import { array, boolean, eq, object, type ResourceResolver, ref, resource, resourceRef, string, validate } from "dynz";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createResourceCache } from "./resource-cache";

const vehicle = resource({
  key: ref("plate"),
  enabled: eq(ref("hasCar"), true),
  outcomes: ["found", "not_found"],
});

const schema = object({
  hasCar: boolean(),
  plate: string(),
  model: string().setIncluded(eq(resourceRef("vehicle.outcome"), "not_found")),
}).setResources({ vehicle });

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

/** A resolver whose lookups the test settles by key. */
function controlled() {
  const pending = new Map<string, { resolve: (state: unknown) => void; reject: (error: unknown) => void }>();
  const calls: { key: unknown; signal: AbortSignal }[] = [];
  const resolver: ResourceResolver = (key, { signal }) =>
    new Promise((resolve, reject) => {
      calls.push({ key, signal });
      pending.set(String(key), { resolve: resolve as (state: unknown) => void, reject });
    });

  return {
    resolver,
    calls,
    settle: async (key: string, state: unknown) => {
      pending.get(key)?.resolve(state);
      await flush();
    },
    fail: async (key: string, error: unknown) => {
      pending.get(key)?.reject(error);
      await flush();
    },
  };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("createResourceCache", () => {
  it("looks up an enabled instance and settles it", async () => {
    const lookup = controlled();
    const cache = createResourceCache(schema, { vehicle: lookup.resolver });

    cache.update({ hasCar: true, plate: "AB-123-C" });
    await flush();

    expect(cache.current().instances["$.vehicle"]).toMatchObject({ status: "pending", key: "AB-123-C" });
    expect(lookup.calls.map(({ key }) => key)).toEqual(["AB-123-C"]);

    await lookup.settle("AB-123-C", { outcome: "found" });

    expect(cache.current().instances["$.vehicle"]).toMatchObject({ status: "settled", state: { outcome: "found" } });
    expect(cache.current().states).toEqual({ "$.vehicle": { outcome: "found" } });
  });

  it("does not look up an instance that is not enabled", async () => {
    const lookup = controlled();
    const cache = createResourceCache(schema, { vehicle: lookup.resolver });

    cache.update({ hasCar: false, plate: "AB-123-C" });
    await flush();

    expect(cache.current().instances).toEqual({});
    expect(lookup.calls).toEqual([]);
  });

  it("looks a key up once, and keeps its state when the key comes back", async () => {
    const lookup = controlled();
    const cache = createResourceCache(schema, { vehicle: lookup.resolver });

    cache.update({ hasCar: true, plate: "AB-123-C" });
    await flush();
    await lookup.settle("AB-123-C", { outcome: "found" });

    cache.update({ hasCar: true, plate: "XY-999-Z" });
    expect(cache.current().instances["$.vehicle"]).toMatchObject({ status: "pending", key: "XY-999-Z" });
    expect(cache.current().states).toEqual({});

    cache.update({ hasCar: true, plate: "AB-123-C" });
    await flush();
    expect(cache.current().instances["$.vehicle"]).toMatchObject({ status: "settled" });
    expect(lookup.calls.map(({ key }) => key)).toEqual(["AB-123-C", "XY-999-Z"]);
  });

  it("aborts and forgets a running lookup once its key is no longer current", async () => {
    const lookup = controlled();
    const cache = createResourceCache(schema, { vehicle: lookup.resolver });

    cache.update({ hasCar: true, plate: "AB-1" });
    await flush();
    cache.update({ hasCar: true, plate: "AB-12" });
    await flush();

    expect(lookup.calls[0]?.signal.aborted).toBe(true);
    expect(lookup.calls[1]?.signal.aborted).toBe(false);

    // back to the first key: looked up again, its old lookup is ignored
    cache.update({ hasCar: true, plate: "AB-1" });
    await flush();
    await lookup.settle("AB-1", { outcome: "found" });
    expect(lookup.calls.map(({ key }) => key)).toEqual(["AB-1", "AB-12", "AB-1"]);
    expect(cache.current().instances["$.vehicle"]).toMatchObject({ status: "settled" });
  });

  it("keeps the same snapshot, and does not notify, while nothing changed", async () => {
    const lookup = controlled();
    const cache = createResourceCache(schema, { vehicle: lookup.resolver });
    const listener = vi.fn();
    cache.subscribe(listener);

    cache.update({ hasCar: true, plate: "AB-123-C" });
    const snapshot = cache.current();
    cache.update({ hasCar: true, plate: "AB-123-C", model: "typing" });

    expect(cache.current()).toBe(snapshot);
    expect(listener).toHaveBeenCalledTimes(1);
    await flush();

    await lookup.settle("AB-123-C", { outcome: "found" });
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("follows resources that depend on other resources", async () => {
    const owner = resource({ key: ref("plate"), outcomes: ["found"] });
    const insurer = resource({ key: resourceRef("owner.data.id"), outcomes: ["found"] });
    const dependent = object({ plate: string() }).setResources({ owner, insurer });
    const insurerLookup = vi.fn(async () => ({ outcome: "found", data: "Acme" }));
    const cache = createResourceCache(dependent, {
      owner: async () => ({ outcome: "found", data: { id: 7 } }),
      insurer: insurerLookup,
    });

    cache.update({ plate: "AB-123-C" });
    await flush();
    await flush();

    expect(cache.current().states).toEqual({
      "$.owner": { outcome: "found", data: { id: 7 } },
      "$.insurer": { outcome: "found", data: "Acme" },
    });
    expect(insurerLookup).toHaveBeenCalledWith(7, expect.objectContaining({ path: "$.insurer" }));
  });

  it("looks up array instances by key, sharing the lookup of equal keys", async () => {
    const lookup = vi.fn(async (key: unknown) => ({ outcome: "found", data: key }));
    const drivers = object({
      drivers: array(
        object({ plate: string() }).setResources({ car: resource({ key: ref("plate"), outcomes: ["found"] }) })
      ),
    });
    const cache = createResourceCache(drivers, { car: lookup });

    cache.update({ drivers: [{ plate: "A" }, { plate: "B" }, { plate: "A" }] });
    await flush();

    expect(Object.keys(cache.current().states)).toEqual([
      "$.drivers.[0].car",
      "$.drivers.[1].car",
      "$.drivers.[2].car",
    ]);
    expect(lookup).toHaveBeenCalledTimes(2);
  });

  describe("failures and retrying", () => {
    it("leaves a throwing lookup failed, logs it, and does not look it up again", async () => {
      const lookup = controlled();
      const cache = createResourceCache(schema, { vehicle: lookup.resolver });

      cache.update({ hasCar: true, plate: "AB-123-C" });
      await flush();
      await lookup.fail("AB-123-C", new Error("offline"));
      cache.update({ hasCar: true, plate: "AB-123-C" });

      expect(cache.current().instances["$.vehicle"]).toMatchObject({ status: "failed", error: new Error("offline") });
      expect(lookup.calls).toHaveLength(1);
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith(
        '[dynz] The lookup of resource "vehicle" at $.vehicle failed',
        new Error("offline")
      );
    });

    it("looks an instance up again on retry", async () => {
      const lookup = controlled();
      const cache = createResourceCache(schema, { vehicle: lookup.resolver });

      cache.update({ hasCar: true, plate: "AB-123-C" });
      await flush();
      await lookup.fail("AB-123-C", new Error("offline"));

      cache.current().instances["$.vehicle"]?.retry();
      expect(cache.current().instances["$.vehicle"]).toMatchObject({ status: "pending" });
      await flush();

      await lookup.settle("AB-123-C", { outcome: "found" });
      expect(cache.current().instances["$.vehicle"]).toMatchObject({ status: "settled" });
      expect(lookup.calls).toHaveLength(2);
    });

    it("aborts a running lookup on retry, and ignores its result", async () => {
      const lookup = controlled();
      const cache = createResourceCache(schema, { vehicle: lookup.resolver });

      cache.update({ hasCar: true, plate: "AB-123-C" });
      await flush();
      cache.current().instances["$.vehicle"]?.retry();
      await flush();

      expect(lookup.calls[0]?.signal.aborted).toBe(true);
      await lookup.settle("AB-123-C", { outcome: "found" });
      expect(cache.current().instances["$.vehicle"]).toMatchObject({ status: "settled" });
    });

    it("fails an instance without a resolver", () => {
      const cache = createResourceCache(schema, {});

      cache.update({ hasCar: true, plate: "AB-123-C" });

      expect(cache.current().instances["$.vehicle"]).toMatchObject({ status: "failed" });
    });
  });

  describe("resolvers", () => {
    it("validates against the cached states, without looking up again", async () => {
      const lookup = vi.fn(async () => ({ outcome: "not_found" }));
      const cache = createResourceCache(schema, { vehicle: lookup });
      const values = { hasCar: true, plate: "AB-123-C" };

      cache.update(values);
      await flush();
      const result = await validate(schema, undefined, values, { resolvers: cache.resolvers });

      expect(result.success).toBe(false);
      expect(lookup).toHaveBeenCalledTimes(1);
    });

    it("waits for a pending lookup", async () => {
      const lookup = controlled();
      const cache = createResourceCache(schema, { vehicle: lookup.resolver });
      const values = { hasCar: true, plate: "AB-123-C", model: "V70" };

      cache.update(values);
      let done = false;
      const result = validate(schema, undefined, values, { resolvers: cache.resolvers }).finally(() => {
        done = true;
      });
      await flush();
      expect(done).toBe(false);

      await lookup.settle("AB-123-C", { outcome: "not_found" });
      expect(await result).toMatchObject({ success: true, values: { model: "V70" } });
    });

    it("looks up what validation needs, also for values the form has not seen", async () => {
      const lookup = vi.fn(async () => ({ outcome: "found" }));
      const cache = createResourceCache(schema, { vehicle: lookup });

      const result = await validate(
        schema,
        undefined,
        { hasCar: true, plate: "AB-123-C" },
        { resolvers: cache.resolvers }
      );

      expect(result.success).toBe(true);
      expect(lookup).toHaveBeenCalledTimes(1);
    });

    it("stops waiting once the values moved away from the key", async () => {
      const lookup = controlled();
      const cache = createResourceCache(schema, { vehicle: lookup.resolver });
      const values = { hasCar: true, plate: "AB-123-C", model: "V70" };

      cache.update(values);
      const result = validate(schema, undefined, values, { resolvers: cache.resolvers });
      await flush();
      cache.update({ ...values, plate: "XY-999-Z" });

      // no state for the vehicle: model is not included
      expect(await result).toMatchObject({ success: false });
    });

    it("validates a failed lookup without its state", async () => {
      const lookup = controlled();
      const cache = createResourceCache(schema, { vehicle: lookup.resolver });
      const values = { hasCar: true, plate: "AB-123-C", model: "V70" };

      cache.update(values);
      await flush();
      await lookup.fail("AB-123-C", new Error("offline"));

      // no state for the vehicle: model is not included
      expect(await validate(schema, undefined, values, { resolvers: cache.resolvers })).toMatchObject({
        success: false,
      });
    });

    it("stops waiting once the cache is disposed", async () => {
      const lookup = controlled();
      const cache = createResourceCache(schema, { vehicle: lookup.resolver });
      const values = { hasCar: true, plate: "AB-123-C", model: "V70" };

      cache.update(values);
      const result = validate(schema, undefined, values, { resolvers: cache.resolvers });
      await flush();
      cache.dispose();

      expect(await result).toMatchObject({ success: false });
    });

    it("stops waiting once a pending lookup fails", async () => {
      const lookup = controlled();
      const cache = createResourceCache(schema, { vehicle: lookup.resolver });
      const values = { hasCar: true, plate: "AB-123-C", model: "V70" };

      cache.update(values);
      const result = validate(schema, undefined, values, { resolvers: cache.resolvers });
      await flush();
      await lookup.fail("AB-123-C", new Error("offline"));

      expect(await result).toMatchObject({ success: false });
    });
  });
});
