import { flushPromises } from "@vue/test-utils";
import { array, boolean, eq, object, options, type ResourceResolver, ref, resource, resourceRef, string } from "dynz";
import { describe, expect, it, vi } from "vitest";
import { computed } from "vue";
import { mountComposable } from "../testing/mount-composable";
import { mountDynzForm, waitForValidation } from "../testing/mount-form";
import { useDynzField } from "./use-dynz-field";
import { useDynzForm } from "./use-dynz-form";
import { useIsIncluded } from "./use-is-included";
import { useOptions } from "./use-options";
import { usePredicate } from "./use-predicate";
import { useResources } from "./use-resource";

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

const outcomeFor = (key: unknown) => ({ outcome: key === "KNOWN" ? "found" : "not_found" });

/** Looks every key up right away. */
const lookup: ResourceResolver = async (key) => outcomeFor(key);

/** A resolver whose lookups the test settles or fails, by key. */
function controlled() {
  const running = new Map<string, { resolve: (state: unknown) => void; reject: (error: unknown) => void }>();
  const calls: unknown[] = [];
  const resolver: ResourceResolver = (key) =>
    new Promise((resolve, reject) => {
      calls.push(key);
      running.set(String(key), { resolve: resolve as (state: unknown) => void, reject });
    });

  return {
    resolver,
    calls,
    settle: async (key: string, state = outcomeFor(key)) => {
      await flushPromises();
      running.get(key)?.resolve(state);
      await flushPromises();
    },
    fail: async (key: string) => {
      await flushPromises();
      running.get(key)?.reject(new Error("offline"));
      await flushPromises();
    },
  };
}

async function setup(resolver: ResourceResolver = lookup) {
  const mounted = mountDynzForm(
    { schema, initialValues: { hasCar: true, plate: "KNOWN" }, resolvers: { vehicle: resolver } },
    () => ({
      included: useIsIncluded("manualDetails"),
      found: usePredicate(eq(resourceRef("vehicle.outcome"), "found")),
      coverage: useOptions("coverage"),
      ...(() => {
        const resources = useResources();
        return { vehicle: computed(() => resources.value["$.vehicle"]) };
      })(),
      field: useDynzField("manualDetails"),
    })
  );
  await flushPromises();

  /** Changes the plate, and lets its lookup finish. */
  const lookUp = async (plate: string) => {
    mounted.form.setFieldValue("plate", plate, false);
    await flushPromises();
  };

  return { ...mounted, lookUp };
}

describe("resources in the condition composables", () => {
  it("looks resources up, and follows the results", async () => {
    const { result, lookUp } = await setup();

    expect(result.included.value).toBe(false);
    expect(result.found.value).toBe(true);
    expect(result.coverage.value).toEqual([
      { value: "basic", enabled: true },
      { value: "full", enabled: true },
    ]);

    await lookUp("UNKNOWN");

    expect(result.included.value).toBe(true);
    expect(result.found.value).toBe(false);
    expect(result.coverage.value[1]).toEqual({ value: "full", enabled: false });
  });

  it("is pending while a new key is looked up", async () => {
    const vehicle = controlled();
    const { form, result } = await setup(vehicle.resolver);
    await vehicle.settle("KNOWN");

    form.setFieldValue("plate", "OTHER", false);

    expect(result.vehicle.value).toMatchObject({ status: "pending", key: "OTHER" });
    expect(result.found.value).toBe(false);
  });

  it("looks a key up once", async () => {
    const vehicle = controlled();
    const { lookUp } = await setup(vehicle.resolver);
    await vehicle.settle("KNOWN");

    await lookUp("OTHER");
    await lookUp("KNOWN");

    expect(vehicle.calls).toEqual(["KNOWN", "OTHER"]);
  });

  it("fails a throwing lookup, and looks it up again on retry", async () => {
    const vehicle = controlled();
    const { result } = await setup(vehicle.resolver);

    await vehicle.fail("KNOWN");
    expect(result.vehicle.value).toMatchObject({ status: "failed", error: new Error("offline") });

    result.vehicle.value?.retry();
    expect(result.vehicle.value?.status).toBe("pending");

    await vehicle.settle("KNOWN");
    expect(result.found.value).toBe(true);
  });
});

describe("useResources", () => {
  it("works in the component that calls useDynzForm, given the form's context", async () => {
    let resources: ReturnType<typeof useResources> | undefined;
    const { wrapper } = mountComposable(() => {
      const form = useDynzForm({
        schema,
        initialValues: { hasCar: true, plate: "KNOWN" },
        resolvers: { vehicle: lookup },
      });
      resources = useResources(form.context);
    });
    await flushPromises();

    expect(resources?.value["$.vehicle"]).toMatchObject({
      status: "settled",
      key: "KNOWN",
      state: { outcome: "found" },
    });
    wrapper.unmount();
  });

  it("is undefined when the resource is not enabled", async () => {
    const { form, result } = await setup();

    form.setFieldValue("hasCar", false, false);

    expect(result.vehicle.value).toBeUndefined();
  });

  it("lists one instance per array item", async () => {
    const drivers = object({
      drivers: array(
        object({ plate: string().optional() }).setResources({
          vehicle: resource({ key: ref("plate"), outcomes: ["found"] }),
        })
      ),
    });
    const { form, result } = mountDynzForm(
      {
        schema: drivers,
        initialValues: { drivers: [{ plate: "A" }, { plate: "B" }] },
        resolvers: { vehicle: lookup },
      },
      () => {
        const resources = useResources();
        return computed(() => Object.values(resources.value));
      }
    );

    expect(result.value.map(({ path, key }) => [path, key])).toEqual([
      ["$.drivers.[0].vehicle", "A"],
      ["$.drivers.[1].vehicle", "B"],
    ]);

    form.setFieldValue("drivers", [{ plate: "C" }], false);
    await flushPromises();

    expect(result.value.map(({ path, key }) => [path, key])).toEqual([["$.drivers.[0].vehicle", "C"]]);
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

  function mountChained(plate: string) {
    const vinCheck = vi.fn(async () => ({ outcome: "ok" }));
    const { result } = mountDynzForm(
      {
        schema: chained,
        initialValues: { plate, manual: { vin: "VIN-1" } },
        resolvers: { vehicle: lookup, vinCheck },
      },
      () => {
        const resources = useResources();
        return computed(() => resources.value["$.manual.vinCheck"]);
      }
    );

    return { result, vinCheck };
  }

  it("looks up a resource once the resource its object's inclusion depends on is settled", async () => {
    const { result, vinCheck } = mountChained("UNKNOWN");

    expect(result.value).toBeUndefined();

    await flushPromises();

    expect(result.value).toMatchObject({ key: "VIN-1", status: "settled", state: { outcome: "ok" } });
    expect(vinCheck).toHaveBeenCalledOnce();
  });

  it("keeps the dependent resource disabled when its object stays excluded", async () => {
    const { result, vinCheck } = mountChained("KNOWN");
    await flushPromises();

    expect(result.value).toBeUndefined();
    expect(vinCheck).not.toHaveBeenCalled();
  });
});

describe("validation", () => {
  it("validates against the looked up states, without looking up again", async () => {
    const resolver = vi.fn(lookup);
    const { form, lookUp } = await setup(resolver);
    form.setFieldValue("manualDetails", "Saab", false);

    // found: manualDetails is not included, so a value for it is an error
    expect((await form.validate()).valid).toBe(false);

    await lookUp("UNKNOWN");

    expect((await form.validate()).valid).toBe(true);
    expect(resolver).toHaveBeenCalledTimes(2);
  });

  it("waits for a running lookup", async () => {
    const vehicle = controlled();
    const { form } = await setup(vehicle.resolver);
    // manualDetails is only included once the vehicle is not found
    form.setFieldValue("manualDetails", "Saab", false);

    const validating = form.validate();
    await vehicle.settle("KNOWN", { outcome: "not_found" });

    expect((await validating).valid).toBe(true);
  });
});

describe("handleSubmit", () => {
  it("submits once the lookups it reads are done: validation waits", async () => {
    const onValid = vi.fn();
    const vehicle = controlled();
    const { form } = await setup(vehicle.resolver);

    const submitting = form.handleSubmit(onValid)();
    await flushPromises();
    await waitForValidation();

    expect(onValid).not.toHaveBeenCalled();

    await vehicle.settle("KNOWN");
    await submitting;

    expect(onValid).toHaveBeenCalledOnce();
  });

  it("does not wait when the form is given no resources", async () => {
    const onValid = vi.fn();
    const { form } = mountDynzForm({ schema, initialValues: { hasCar: true, plate: "KNOWN" } });

    await form.handleSubmit(onValid)();

    expect(onValid).toHaveBeenCalledOnce();
  });
});

describe("re-validation when a resource changes", () => {
  it("re-validates a touched field that reads the resource", async () => {
    const { form, result, lookUp } = await setup();

    // found: manualDetails is not included, so a value for it is an error
    result.field.setValue("Saab");
    result.field.onBlur();
    await form.validate();
    expect(form.errors.value.manualDetails).toBeDefined();

    // not_found: the error clears without validating again by hand
    await lookUp("UNKNOWN");
    await waitForValidation();

    expect(form.errors.value.manualDetails).toBeUndefined();
  });

  it("does not re-validate a field the user has not interacted with", async () => {
    const { form, result, lookUp } = await setup();
    await lookUp("UNKNOWN");
    form.setFieldValue("manualDetails", "Saab", false);

    await lookUp("KNOWN");
    await waitForValidation();

    expect(result.included.value).toBe(false);
    expect(form.errors.value.manualDetails).toBeUndefined();
  });

  it("re-validates every dependent field after a submit", async () => {
    const { form, lookUp } = await setup();
    await lookUp("UNKNOWN");
    form.setFieldValue("manualDetails", "Saab", false);
    await form.handleSubmit(() => {})();

    await lookUp("KNOWN");
    await waitForValidation();

    expect(form.errors.value.manualDetails).toBeDefined();
  });
});
