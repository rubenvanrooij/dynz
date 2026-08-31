import { boolean, eq, number, object, options, ref, string } from "dynz";
import { flushPromises } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { createDynzContext } from "../context";
import { mountComposable } from "../testing/mount-composable";
import { useDynzField } from "./use-dynz-field";
import { type DynzFormMode, useDynzForm } from "./use-dynz-form";

const schema = object({
  plan: options(["free", "enterprise"] as const),
  companyName: string()
    .min(3)
    .setIncluded(eq(ref("plan"), "enterprise")),
  slug: string().setMutable(false),
  address: object({ zip: string().min(4) }),
});

function setup(mode: DynzFormMode = "onSubmit", initialValues: Record<string, unknown> = { plan: "enterprise" }) {
  const form = useDynzForm({ schema, initialValues, mode, provideContext: false });
  const { result } = mountComposable(() => useDynzField<string>("companyName"), form.context);

  return { form, field: result };
}

describe("useDynzField", () => {
  it("reads and writes the form value", () => {
    const { form, field } = setup();

    expect(field.value.value).toBeUndefined();

    field.value.value = "Acme";

    expect(form.values.companyName).toBe("Acme");
    expect(field.value.value).toBe("Acme");
  });

  it("writes nested paths", () => {
    const form = useDynzForm({ schema, provideContext: false });
    const { result } = mountComposable(() => useDynzField<string>("address.zip"), form.context);

    result.setValue("1234");

    expect(form.values.address.zip).toBe("1234");
  });

  it("exposes the schema conditions, and keeps them reactive", () => {
    const { form, field } = setup();

    expect(field.included.value).toBe(true);

    form.values.plan = "free";

    expect(field.included.value).toBe(false);
  });

  it("marks a field read only only when mutable resolves to exactly false", () => {
    const form = useDynzForm({ schema, currentValues: { plan: "free", slug: "a", address: { zip: "1234" } } });
    const { result: immutable } = mountComposable(() => useDynzField("slug"), form.context);
    const { result: mutable } = mountComposable(() => useDynzField("address.zip"), form.context);

    expect(immutable.readOnly.value).toBe(true);
    expect(mutable.readOnly.value).toBe(false);
  });

  it("surfaces the error of its own field", async () => {
    const { form, field } = setup();

    field.setValue("no");
    await form.validate();

    expect(field.error.value).toBe(form.errors.value.companyName);
    expect(field.error.value).toBeDefined();
  });

  it("tracks touched state on blur", () => {
    const { form, field } = setup();

    expect(field.isTouched.value).toBe(false);

    field.onBlur();

    expect(field.isTouched.value).toBe(true);
    expect(form.touched.value.companyName).toBe(true);
  });
});

describe("useDynzField — input handling", () => {
  it("reads the value off a DOM input event", () => {
    const { form, field } = setup();
    const input = document.createElement("input");
    input.value = "Acme";
    input.addEventListener("input", field.onInput);

    input.dispatchEvent(new Event("input"));

    expect(form.values.companyName).toBe("Acme");
  });

  it("accepts a raw value, as emitted by component inputs", () => {
    const { form, field } = setup();

    field.onInput("Acme");

    expect(form.values.companyName).toBe("Acme");
  });

  it("reads checked instead of value for checkboxes", () => {
    const boolSchema = object({ accepted: boolean() });
    const form = useDynzForm({ schema: boolSchema, provideContext: false });
    const { result } = mountComposable(() => useDynzField("accepted"), form.context);

    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = true;
    input.addEventListener("input", result.onInput);

    input.dispatchEvent(new Event("input"));

    expect(form.values.accepted).toBe(true);
  });

  it("reads numeric inputs as numbers, and empty ones as undefined", () => {
    const numberSchema = object({ age: number() });
    const form = useDynzForm({ schema: numberSchema, provideContext: false });
    const { result } = mountComposable(() => useDynzField("age"), form.context);

    const input = document.createElement("input");
    input.type = "number";
    input.addEventListener("input", result.onInput);

    input.value = "42";
    input.dispatchEvent(new Event("input"));
    expect(form.values.age).toBe(42);

    input.value = "";
    input.dispatchEvent(new Event("input"));
    expect(form.values.age).toBeUndefined();
  });
});

describe("useDynzField — validation modes", () => {
  it("does not validate on input in onSubmit mode", async () => {
    const { form, field } = setup("onSubmit");

    field.setValue("no");
    await flushPromises();

    expect(form.errors.value.companyName).toBeUndefined();
  });

  it("validates on input in onInput mode", async () => {
    const { form, field } = setup("onInput");

    field.setValue("no");
    await flushPromises();

    expect(form.errors.value.companyName).toBeDefined();
  });

  it("validates on blur in onBlur mode", async () => {
    const { form, field } = setup("onBlur");

    field.setValue("no");
    await flushPromises();
    expect(form.errors.value.companyName).toBeUndefined();

    field.onBlur();
    await flushPromises();

    expect(form.errors.value.companyName).toBeDefined();
  });

  it("switches to the revalidate mode after the first submit", async () => {
    const form = useDynzForm({
      schema,
      initialValues: { plan: "enterprise" },
      mode: "onSubmit",
      revalidateMode: "onInput",
      provideContext: false,
    });
    const { result: field } = mountComposable(() => useDynzField<string>("companyName"), form.context);

    field.setValue("no");
    await flushPromises();
    expect(form.errors.value.companyName).toBeUndefined();

    await form.handleSubmit(() => undefined)();
    expect(form.errors.value.companyName).toBeDefined();

    field.setValue("Acme");
    await flushPromises();

    expect(form.errors.value.companyName).toBeUndefined();
  });
});

describe("useDynzField — guards", () => {
  it("throws when the context does not manage field state", () => {
    const context = createDynzContext({ schema, getValues: () => ({}) });

    expect(() => mountComposable(() => useDynzField("companyName"), context)).toThrow(/does not manage field state/);
  });
});
