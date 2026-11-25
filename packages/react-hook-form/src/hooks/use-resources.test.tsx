import type { CurrentResource } from "@dynz/form-resources";
import { act, render, waitFor } from "@testing-library/react";
import {
  array,
  boolean,
  eq,
  type ObjectSchema,
  object,
  options,
  type ResourceResolver,
  type ResourceResolvers,
  ref,
  resource,
  resourceRef,
  string,
} from "dynz";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { DynzFormProvider } from "../components/dynz-form-provider";
import { type UseDynzFormReturn, useDynzForm } from "./use-dynz-form";
import { useIsIncluded } from "./use-is-included";
import { useOptions } from "./use-options";
import { useResources } from "./use-resource";

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

const outcomeFor = (key: unknown) => ({ outcome: key === "KNOWN" ? "found" : "not_found" });

/** Looks every key up right away. */
const lookup: ResourceResolver = async (key) => outcomeFor(key);

/** Lets running lookups (and the updates they cause) finish. */
const settled = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

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
      await settled();
      running.get(key)?.resolve(state);
      await settled();
    },
    fail: async (key: string) => {
      await settled();
      running.get(key)?.reject(new Error("offline"));
      await settled();
    },
  };
}

/** Renders a form with its resolvers written inline, as an application would. */
function renderForm<TSchema extends ObjectSchema<never>>(
  formSchema: TSchema,
  defaultValues: Record<string, unknown>,
  resolvers: ResourceResolvers | undefined,
  children: ReactNode
) {
  let form!: UseDynzFormReturn<TSchema>;

  function Form() {
    form = useDynzForm<TSchema>({
      schema: formSchema,
      defaultValues: defaultValues as never,
      resolvers: resolvers === undefined ? undefined : { ...resolvers },
    });
    return <DynzFormProvider {...form}>{children}</DynzFormProvider>;
  }

  render(<Form />);

  return () => form;
}

async function setup(resolver: ResourceResolver = lookup) {
  const included: Record<string, boolean | undefined> = {};
  const vehicles: (CurrentResource | undefined)[] = [];

  function Field({ name }: { name: string }) {
    included[name] = useIsIncluded(name);
    return null;
  }

  function Vehicle() {
    vehicles.push(useResources()["$.vehicle"]);
    return null;
  }

  const form = renderForm(
    schema,
    { hasCar: true, plate: "KNOWN" },
    { vehicle: resolver },
    <>
      <Field name="manualDetails" />
      <Field name="other" />
      <Vehicle />
    </>
  );
  await settled();

  /** Changes the plate, and lets its lookup finish. */
  const lookUp = async (plate: string) => {
    act(() => form().setValue("plate", plate));
    await settled();
  };

  return { included, latest: () => vehicles.at(-1), form, lookUp };
}

describe("resources in hooks", () => {
  it("looks resources up, and resolves resource references against the results", async () => {
    const { included, lookUp } = await setup();

    expect(included.manualDetails).toBe(false);

    await lookUp("UNKNOWN");

    expect(included.manualDetails).toBe(true);
  });

  it("is pending while a new key is looked up", async () => {
    const vehicle = controlled();
    const { included, latest, form } = await setup(vehicle.resolver);
    await vehicle.settle("KNOWN", { outcome: "not_found" });
    expect(included.manualDetails).toBe(true);

    act(() => form().setValue("plate", "OTHER"));

    expect(latest()).toMatchObject({ status: "pending", key: "OTHER" });
    expect(included.manualDetails).toBe(false);
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
    const { latest } = await setup(vehicle.resolver);

    await vehicle.fail("KNOWN");
    expect(latest()).toMatchObject({ status: "failed", error: new Error("offline") });

    act(() => latest()?.retry());
    expect(latest()?.status).toBe("pending");

    await vehicle.settle("KNOWN");
    expect(latest()).toMatchObject({ status: "settled", state: { outcome: "found" } });
  });
});

describe("validation", () => {
  it("validates against the looked up states, without looking up again", async () => {
    const resolver = vi.fn(lookup);
    const { form, lookUp } = await setup(resolver);
    act(() => form().setValue("manualDetails", "Saab"));

    // found: manualDetails is not included, so a value for it is an error
    expect(await act(() => form().trigger())).toBe(false);

    await lookUp("UNKNOWN");

    expect(await act(() => form().trigger())).toBe(true);
    expect(resolver).toHaveBeenCalledTimes(2);
  });

  it("waits for a running lookup", async () => {
    const vehicle = controlled();
    const { form } = await setup(vehicle.resolver);
    act(() => form().setValue("manualDetails", "Saab"));

    let validating!: Promise<boolean>;
    await act(async () => {
      validating = form().trigger();
    });
    await vehicle.settle("KNOWN", { outcome: "not_found" });

    // not found: manualDetails is included
    expect(await act(() => validating)).toBe(true);
  });
});

describe("handleSubmit", () => {
  it("submits once the lookups it reads are done: validation waits", async () => {
    const onValid = vi.fn();
    const vehicle = controlled();
    const { form } = await setup(vehicle.resolver);

    let submitting!: Promise<void>;
    await act(async () => {
      submitting = form().handleSubmit(onValid)();
    });
    expect(onValid).not.toHaveBeenCalled();

    await vehicle.settle("KNOWN");
    await act(() => submitting);

    expect(onValid).toHaveBeenCalledOnce();
  });

  it("does not wait when the form is given no resources", async () => {
    const onValid = vi.fn();
    const form = renderForm(schema, { hasCar: true, plate: "KNOWN" }, undefined, null);

    await act(() => form().handleSubmit(onValid)());

    expect(onValid).toHaveBeenCalledOnce();
  });
});

describe("re-validation when a resource changes", () => {
  it("re-validates a touched field that reads the resource", async () => {
    const { form, lookUp } = await setup();

    // found: manualDetails is not included, so a value for it is an error
    act(() => form().setValue("manualDetails", "Saab", { shouldTouch: true }));
    await act(() => form().trigger());
    expect(form().getFieldState("manualDetails").error?.type).toBe("included");

    // not_found: the error clears without validating again by hand
    await lookUp("UNKNOWN");

    await waitFor(() => expect(form().getFieldState("manualDetails").error).toBeUndefined());
  });

  it("re-validates a touched field without an error", async () => {
    const { form, lookUp } = await setup();
    await lookUp("UNKNOWN");
    act(() => form().setValue("manualDetails", "Saab", { shouldTouch: true }));

    await lookUp("KNOWN");

    await waitFor(() => expect(form().getFieldState("manualDetails").error?.type).toBe("included"));
  });

  it("does not re-validate a field the user has not interacted with", async () => {
    const { included, form, lookUp } = await setup();
    await lookUp("UNKNOWN");
    act(() => form().setValue("manualDetails", "Saab"));

    await lookUp("KNOWN");
    expect(included.manualDetails).toBe(false);

    expect(form().getFieldState("manualDetails").error).toBeUndefined();
  });

  it("re-validates every dependent field after a submit", async () => {
    const { form, lookUp } = await setup();
    await lookUp("UNKNOWN");
    act(() => form().setValue("manualDetails", "Saab"));
    await act(() => form().handleSubmit(() => {})());

    await lookUp("KNOWN");

    await waitFor(() => expect(form().getFieldState("manualDetails").error?.type).toBe("included"));
  });
});

describe("useResources", () => {
  it("is undefined when the resource is not enabled", async () => {
    const { latest, form } = await setup();

    act(() => form().setValue("hasCar", false));

    expect(latest()).toBeUndefined();
  });

  it("is on the form in the component that calls useDynzForm", async () => {
    let vehicle: CurrentResource | undefined;

    function Form() {
      const form = useDynzForm<typeof schema>({
        schema,
        defaultValues: { hasCar: true, plate: "KNOWN" },
        resolvers: { vehicle: lookup },
      });
      vehicle = form.resources["$.vehicle"];
      return null;
    }

    render(<Form />);
    await settled();

    expect(vehicle).toMatchObject({ key: "KNOWN", status: "settled" });
  });
});

describe("useOptions with resources", () => {
  it("enables an option once its resource is settled", async () => {
    const coverage = object({
      plate: string(),
      coverage: options(["basic", { value: "all_risk", enabled: eq(resourceRef("vehicle.outcome"), "found") }]),
    }).setResources({ vehicle: resource({ key: ref("plate"), outcomes: ["found", "not_found"] }) });
    const results: { value: unknown; enabled: boolean }[][] = [];
    const vehicle = controlled();

    function Probe() {
      results.push(useOptions("coverage"));
      return null;
    }

    renderForm(coverage, { plate: "KNOWN" }, { vehicle: vehicle.resolver }, <Probe />);

    expect(results.at(-1)).toEqual([
      { value: "basic", enabled: true },
      { value: "all_risk", enabled: false },
    ]);

    await vehicle.settle("KNOWN");

    expect(results.at(-1)).toEqual([
      { value: "basic", enabled: true },
      { value: "all_risk", enabled: true },
    ]);
  });
});

describe("resources inside an array", () => {
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

  it("resolves every item against its own resource", async () => {
    const included: Record<string, boolean | undefined> = {};

    function Item({ index }: { index: number }) {
      included[index] = useIsIncluded(`drivers.${index}.years`);
      return null;
    }

    renderForm(
      drivers,
      { drivers: [{ licence: "KNOWN" }, { licence: "UNKNOWN" }] },
      { claims: lookup },
      <>
        <Item index={0} />
        <Item index={1} />
      </>
    );
    await settled();

    expect(included).toEqual({ 0: false, 1: true });
  });

  it("lists one instance per item", async () => {
    const lists: { path: string; key: unknown }[][] = [];

    function Probe() {
      lists.push(Object.values(useResources()).map(({ path, key }) => ({ path, key })));
      return null;
    }

    const form = renderForm(drivers, { drivers: [{ licence: "A" }, { licence: "B" }] }, { claims: lookup }, <Probe />);

    expect(lists.at(-1)).toEqual([
      { path: "$.drivers.[0].claims", key: "A" },
      { path: "$.drivers.[1].claims", key: "B" },
    ]);

    act(() => form().setValue("drivers", [{ licence: "C" }] as never));
    await settled();

    expect(lists.at(-1)).toEqual([{ path: "$.drivers.[0].claims", key: "C" }]);
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

  function renderChained(plate: string) {
    const instances: (CurrentResource | undefined)[] = [];

    function VinCheck() {
      instances.push(useResources()["$.manual.vinCheck"]);
      return null;
    }

    const vinCheck = vi.fn(async () => ({ outcome: "ok" }));
    renderForm(chained, { plate, manual: { vin: "VIN-1" } }, { vehicle: lookup, vinCheck }, <VinCheck />);

    return { latest: () => instances.at(-1), vinCheck };
  }

  it("looks up a resource once the resource its object's inclusion depends on is settled", async () => {
    const { latest, vinCheck } = renderChained("UNKNOWN");

    expect(latest()).toBeUndefined();

    await settled();

    expect(latest()).toMatchObject({ key: "VIN-1", status: "settled", state: { outcome: "ok" } });
    expect(vinCheck).toHaveBeenCalledOnce();
  });

  it("keeps the dependent resource disabled when its object stays excluded", async () => {
    const { latest, vinCheck } = renderChained("KNOWN");
    await settled();

    expect(latest()).toBeUndefined();
    expect(vinCheck).not.toHaveBeenCalled();
  });
});
