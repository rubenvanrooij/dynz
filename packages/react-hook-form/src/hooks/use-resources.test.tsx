import { act, render, waitFor } from "@testing-library/react";
import {
  array,
  boolean,
  eq,
  object,
  options,
  type ResourceResolvers,
  type ResourceState,
  ref,
  resource,
  resourceRef,
  string,
} from "dynz";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { DynzFormProvider } from "../components/dynz-form-provider";
import type { ResourceEntry } from "./resource-store";
import { type UseDynzFormReturn, useDynzForm } from "./use-dynz-form";
import { useIsIncluded } from "./use-is-included";
import { useOptions } from "./use-options";
import { useResource } from "./use-resource";

const schema = object({
  hasCar: boolean(),
  plate: string().optional(),
  manualDetails: string()
    .optional()
    .setIncluded(eq(resourceRef("vehicle.outcome"), "not_found")),
  other: string().optional(),
}).setResources({
  vehicle: resource({ key: ref("plate"), enabled: eq(ref("hasCar"), true), outcomes: ["found", "not_found"] }),
});

const lookup = (plate: unknown): ResourceState => ({ outcome: plate === "KNOWN" ? "found" : "not_found" });

function setup(resolvers: ResourceResolvers = { vehicle: vi.fn(lookup) }) {
  const renders: Record<string, number> = { manualDetails: 0, other: 0 };
  const included: Record<string, boolean | undefined> = {};
  const entries: (ResourceEntry | undefined)[] = [];
  let form!: UseDynzFormReturn<typeof schema>;

  function Field({ name }: { name: string }) {
    included[name] = useIsIncluded(name);
    renders[name] = (renders[name] ?? 0) + 1;
    return null;
  }

  function Vehicle() {
    entries.push(useResource("$.vehicle"));
    return null;
  }

  function Form({ children }: { children: ReactNode }) {
    form = useDynzForm<typeof schema>({
      schema,
      defaultValues: { hasCar: true, plate: "KNOWN" },
      schemaOptions: { resolvers },
    });
    return <DynzFormProvider {...form}>{children}</DynzFormProvider>;
  }

  render(
    <Form>
      <Field name="manualDetails" />
      <Field name="other" />
      <Vehicle />
    </Form>
  );

  return { renders, included, entries, latest: () => entries.at(-1), form: () => form };
}

/** A promise to settle by hand, to observe the pending state. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("resources in hooks", () => {
  it("resolves resource references in the hooks", async () => {
    const { included, form } = setup();

    await waitFor(() => expect(included.manualDetails).toBe(false));

    act(() => form().setValue("plate", "UNKNOWN"));

    await waitFor(() => expect(included.manualDetails).toBe(true));
  });

  it("only re-renders the hooks whose result changes", async () => {
    const { renders, included, latest, form } = setup();
    await waitFor(() => expect(latest()?.status).toBe("settled"));
    const before = { ...renders };

    act(() => form().setValue("plate", "UNKNOWN"));
    await waitFor(() => expect(included.manualDetails).toBe(true));

    expect(renders.manualDetails).toBeGreaterThan(before.manualDetails ?? 0);
    expect(renders.other).toBe(before.other);
  });

  it("passes the resolvers on to validation", async () => {
    const { form } = setup();

    act(() => form().setValue("plate", "UNKNOWN"));

    expect(await act(() => form().trigger())).toBe(true);
    expect(form().formState.errors).toEqual({});
  });
});

describe("useResource", () => {
  it("is pending while the lookup runs, then settled", async () => {
    const pending = deferred<ResourceState>();
    const { entries, latest } = setup({ vehicle: () => pending.promise });

    await waitFor(() => expect(latest()).toEqual({ status: "pending", key: "KNOWN" }));

    await act(async () => pending.resolve({ outcome: "found" }));

    expect(latest()).toEqual({ status: "settled", key: "KNOWN", state: { outcome: "found" } });
    expect(entries.filter((entry) => entry?.status === "pending")).toHaveLength(1);
  });

  it("is failed when the resolver throws, and retries on the next change", async () => {
    const vehicle = vi.fn<(plate: unknown) => ResourceState>(() => {
      throw new Error("registry down");
    });
    const { latest, form } = setup({ vehicle });

    await waitFor(() => expect(latest()).toMatchObject({ status: "failed", key: "KNOWN" }));

    vehicle.mockImplementation(lookup);
    act(() => form().setValue("other", "x"));

    await waitFor(() => expect(latest()).toMatchObject({ status: "settled", state: { outcome: "found" } }));
    expect(vehicle).toHaveBeenCalledTimes(2);
  });

  it("does not look up again while the key stays the same", async () => {
    const vehicle = vi.fn(lookup);
    const { latest, form } = setup({ vehicle });
    await waitFor(() => expect(latest()?.status).toBe("settled"));

    act(() => form().setValue("other", "x"));
    act(() => form().setValue("other", "y"));

    expect(vehicle).toHaveBeenCalledTimes(1);
  });

  it("ignores a result for a key the instance no longer has", async () => {
    const lookups: Record<string, ReturnType<typeof deferred<ResourceState>>> = {};
    const { latest, form } = setup({
      vehicle: (plate) => {
        lookups[String(plate)] = deferred<ResourceState>();
        return lookups[String(plate)]?.promise as Promise<ResourceState>;
      },
    });
    await waitFor(() => expect(lookups.KNOWN).toBeDefined());

    act(() => form().setValue("plate", "UNKNOWN"));
    await act(async () => lookups.KNOWN?.resolve({ outcome: "found" }));

    expect(latest()).toEqual({ status: "pending", key: "UNKNOWN" });

    await act(async () => lookups.UNKNOWN?.resolve({ outcome: "not_found" }));

    expect(latest()).toEqual({ status: "settled", key: "UNKNOWN", state: { outcome: "not_found" } });
  });

  it("is undefined when the resource is not enabled", async () => {
    const { latest, form } = setup();
    await waitFor(() => expect(latest()?.status).toBe("settled"));

    act(() => form().setValue("hasCar", false));

    expect(latest()).toBeUndefined();
  });
});

describe("useOptions with resources", () => {
  it("enables an option once its resource is looked up", async () => {
    const coverage = object({
      plate: string(),
      coverage: options(["basic", { value: "all_risk", enabled: eq(resourceRef("vehicle.outcome"), "found") }]),
    }).setResources({ vehicle: resource({ key: ref("plate"), outcomes: ["found", "not_found"] }) });
    const pending = deferred<ResourceState>();
    const results: { value: unknown; enabled: boolean }[][] = [];

    function Probe() {
      results.push(useOptions("coverage"));
      return null;
    }

    function Form({ children }: { children: ReactNode }) {
      const form = useDynzForm<typeof coverage>({
        schema: coverage,
        defaultValues: { plate: "KNOWN" },
        schemaOptions: { resolvers: { vehicle: () => pending.promise } },
      });
      return <DynzFormProvider {...form}>{children}</DynzFormProvider>;
    }

    render(
      <Form>
        <Probe />
      </Form>
    );

    expect(results.at(-1)).toEqual([
      { value: "basic", enabled: true },
      { value: "all_risk", enabled: false },
    ]);

    await act(async () => pending.resolve({ outcome: "found" }));

    expect(results.at(-1)).toEqual([
      { value: "basic", enabled: true },
      { value: "all_risk", enabled: true },
    ]);
  });
});

describe("resources inside an array", () => {
  it("resolves every item against its own resource", async () => {
    const drivers = object({
      drivers: array(
        object({
          licence: string(),
          years: string()
            .optional()
            .setIncluded(eq(resourceRef("claims.outcome"), "not_found")),
        }).setResources({ claims: resource({ key: ref("licence"), outcomes: ["found", "not_found"] }) })
      ),
    });
    const included: Record<string, boolean | undefined> = {};
    const entries: Record<string, ResourceEntry | undefined> = {};

    function Item({ index }: { index: number }) {
      included[index] = useIsIncluded(`drivers.${index}.years`);
      entries[index] = useResource(`$.drivers.[${index}].claims`);
      return null;
    }

    function Form({ children }: { children: ReactNode }) {
      const form = useDynzForm<typeof drivers>({
        schema: drivers,
        defaultValues: { drivers: [{ licence: "KNOWN" }, { licence: "UNKNOWN" }] },
        schemaOptions: { resolvers: { claims: lookup } },
      });
      return <DynzFormProvider {...form}>{children}</DynzFormProvider>;
    }

    render(
      <Form>
        <Item index={0} />
        <Item index={1} />
      </Form>
    );

    await waitFor(() => expect(entries[1]?.status).toBe("settled"));

    expect(entries[0]).toMatchObject({ status: "settled", key: "KNOWN", state: { outcome: "found" } });
    expect(included).toEqual({ 0: false, 1: true });
  });
});
