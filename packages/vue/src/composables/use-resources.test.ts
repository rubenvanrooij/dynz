import { flushPromises } from "@vue/test-utils";
import {
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
import { describe, expect, it, vi } from "vitest";
import { mountComposable } from "../testing/mount-composable";
import { mountDynzForm, waitForValidation } from "../testing/mount-form";
import { useDynzForm } from "./use-dynz-form";
import { useDynzField } from "./use-dynz-field";
import { useIsIncluded } from "./use-is-included";
import { useOptions } from "./use-options";
import { usePredicate } from "./use-predicate";
import { useResource } from "./use-resource";

const schema = object({
  hasCar: boolean(),
  plate: string().optional(),
  other: string().optional(),
  manualDetails: string()
    .optional()
    .setIncluded(eq(resourceRef("vehicle.outcome"), "not_found")),
  coverage: options(["basic", { value: "full", enabled: eq(resourceRef("vehicle.outcome"), "found") }]).optional(),
}).setResources({
  vehicle: resource({ key: ref("plate"), enabled: eq(ref("hasCar"), true), outcomes: ["found", "not_found"] }),
});

const lookup = (plate: unknown): ResourceState => ({ outcome: plate === "KNOWN" ? "found" : "not_found" });

function setup(resolvers: ResourceResolvers = { vehicle: vi.fn(lookup) }) {
  return mountDynzForm(
    { schema, initialValues: { hasCar: true, plate: "KNOWN" }, schemaOptions: { resolvers } },
    () => ({
      included: useIsIncluded("manualDetails"),
      found: usePredicate(eq(resourceRef("vehicle.outcome"), "found")),
      coverage: useOptions("coverage"),
      vehicle: useResource("$.vehicle"),
      field: useDynzField("manualDetails"),
    })
  );
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

describe("resources in the condition composables", () => {
  it("follows a settled lookup", async () => {
    const { form, result } = setup();
    await flushPromises();

    expect(result.included.value).toBe(false);
    expect(result.found.value).toBe(true);
    expect(result.coverage.value).toEqual([
      { value: "basic", enabled: true },
      { value: "full", enabled: true },
    ]);

    form.setFieldValue("plate", "UNKNOWN", false);
    await flushPromises();

    expect(result.included.value).toBe(true);
    expect(result.found.value).toBe(false);
    expect(result.coverage.value[1]).toEqual({ value: "full", enabled: false });
  });
});

describe("useResource", () => {
  it("is pending while the lookup runs, then settled", async () => {
    const pending = deferred<ResourceState>();
    const { result } = setup({ vehicle: () => pending.promise });

    expect(result.vehicle.value).toEqual({ status: "pending", key: "KNOWN" });

    pending.resolve({ outcome: "found" });
    await flushPromises();

    expect(result.vehicle.value).toEqual({ status: "settled", key: "KNOWN", state: { outcome: "found" } });
  });

  it("works in the component that calls useDynzForm, given the form's context", async () => {
    let vehicle: ReturnType<typeof useResource> | undefined;
    const { wrapper } = mountComposable(() => {
      const form = useDynzForm({
        schema,
        initialValues: { hasCar: true, plate: "KNOWN" },
        schemaOptions: { resolvers: { vehicle: lookup } },
      });
      vehicle = useResource("$.vehicle", form.context);
    });
    await flushPromises();

    expect(vehicle?.value).toEqual({ status: "settled", key: "KNOWN", state: { outcome: "found" } });
    wrapper.unmount();
  });

  it("is undefined when the resource is not enabled", async () => {
    const { form, result } = setup();
    await flushPromises();

    form.setFieldValue("hasCar", false, false);
    await flushPromises();

    expect(result.vehicle.value).toBeUndefined();
  });

  it("does not look up again while the key stays the same", async () => {
    const vehicle = vi.fn(lookup);
    const { form } = setup({ vehicle });
    await flushPromises();

    form.setFieldValue("other", "x", false);
    form.setFieldValue("other", "y", false);
    await flushPromises();

    expect(vehicle).toHaveBeenCalledTimes(1);
  });

  it("is failed when the resolver throws, and retries only when the key changes", async () => {
    const vehicle = vi.fn<(plate: unknown) => ResourceState>(() => {
      throw new Error("registry down");
    });
    const { form, result } = setup({ vehicle });
    await flushPromises();

    expect(result.vehicle.value).toMatchObject({ status: "failed", key: "KNOWN" });

    vehicle.mockImplementation(lookup);
    form.setFieldValue("other", "x", false);
    await flushPromises();

    expect(result.vehicle.value).toMatchObject({ status: "failed" });
    expect(vehicle).toHaveBeenCalledTimes(1);

    form.setFieldValue("plate", "UNKNOWN", false);
    await flushPromises();

    expect(result.vehicle.value).toMatchObject({ status: "settled", state: { outcome: "not_found" } });
    expect(vehicle).toHaveBeenCalledTimes(2);
  });

  it("ignores a result for a key the instance no longer has", async () => {
    const lookups: Record<string, ReturnType<typeof deferred<ResourceState>>> = {};
    const { form, result } = setup({
      vehicle: (plate) => {
        lookups[String(plate)] = deferred<ResourceState>();
        return lookups[String(plate)]?.promise as Promise<ResourceState>;
      },
    });

    form.setFieldValue("plate", "UNKNOWN", false);
    await flushPromises();
    lookups.KNOWN?.resolve({ outcome: "found" });
    await flushPromises();

    expect(result.vehicle.value).toEqual({ status: "pending", key: "UNKNOWN" });

    lookups.UNKNOWN?.resolve({ outcome: "not_found" });
    await flushPromises();

    expect(result.vehicle.value).toEqual({ status: "settled", key: "UNKNOWN", state: { outcome: "not_found" } });
  });
});

describe("resources that depend on other resources", () => {
  const chained = object({
    plate: string().optional(),
    manual: object({ vin: string().optional() })
      .setIncluded(eq(resourceRef("vehicle.outcome"), "not_found"))
      .setResources({ vinCheck: resource({ key: ref("vin"), outcomes: ["ok", "stolen"] }) }),
  }).setResources({
    vehicle: resource({ key: ref("plate"), outcomes: ["found", "not_found"] }),
  });

  it("looks up a resource once the resource its object's inclusion depends on settles", async () => {
    const vehicle = deferred<ResourceState>();
    const vinCheck = vi.fn((): ResourceState => ({ outcome: "ok" }));
    const { result } = mountDynzForm(
      {
        schema: chained,
        initialValues: { plate: "UNKNOWN", manual: { vin: "VIN-1" } },
        schemaOptions: { resolvers: { vehicle: () => vehicle.promise, vinCheck } },
      },
      () => useResource("$.manual.vinCheck")
    );
    await flushPromises();

    expect(result.value).toBeUndefined();
    expect(vinCheck).not.toHaveBeenCalled();

    vehicle.resolve({ outcome: "not_found" });
    await flushPromises();

    expect(result.value).toEqual({ status: "settled", key: "VIN-1", state: { outcome: "ok" } });
    expect(vinCheck).toHaveBeenCalledTimes(1);
  });
});

describe("re-validation when a resource settles", () => {
  it("re-validates a touched field that reads the resource", async () => {
    const { form, result } = setup();
    await flushPromises();

    // found: manualDetails is not included, so a value for it is an error
    result.field.setValue("Saab");
    result.field.onBlur();
    await form.validate();
    expect(form.errors.value.manualDetails).toBeDefined();

    // not_found: the error clears without validating again by hand
    form.setFieldValue("plate", "UNKNOWN", false);
    await flushPromises();
    await waitForValidation();

    expect(form.errors.value.manualDetails).toBeUndefined();
  });

  it("does not re-validate a field the user has not interacted with", async () => {
    const { form, result } = setup();
    form.setFieldValue("plate", "UNKNOWN", false);
    await flushPromises();
    form.setFieldValue("manualDetails", "Saab", false);

    form.setFieldValue("plate", "KNOWN", false);
    await flushPromises();
    await waitForValidation();

    expect(result.included.value).toBe(false);
    expect(form.errors.value.manualDetails).toBeUndefined();
  });

  it("re-validates every dependent field after a submit", async () => {
    const { form } = setup();
    form.setFieldValue("plate", "UNKNOWN", false);
    await flushPromises();
    form.setFieldValue("manualDetails", "Saab", false);
    await form.handleSubmit(() => {})();

    form.setFieldValue("plate", "KNOWN", false);
    await flushPromises();
    await waitForValidation();

    expect(form.errors.value.manualDetails).toBeDefined();
  });
});
