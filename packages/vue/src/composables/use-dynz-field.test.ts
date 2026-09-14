import { boolean, eq, number, object, options, ref, string } from "dynz";
import { describe, expect, it } from "vitest";
import { mountDynzForm, waitForValidation } from "../testing/mount-form";
import { useDynzField } from "./use-dynz-field";
import type { DynzFormMode } from "./use-dynz-form";

const schema = object({
  plan: options(["free", "enterprise"] as const),
  companyName: string()
    .min(3)
    .setIncluded(eq(ref("plan"), "enterprise")),
  slug: string().setMutable(false),
  address: object({ zip: string().min(4) }),
});

function mountField(mode: DynzFormMode = "onSubmit", initialValues: Record<string, unknown> = { plan: "enterprise" }) {
  return mountDynzForm({ schema, initialValues, mode }, () => useDynzField<string>("companyName"));
}

describe("useDynzField", () => {
  it("reads and writes the form value", () => {
    const { form, result: field } = mountField();

    expect(field.value.value).toBeUndefined();

    field.value.value = "Acme";

    expect(form.values.companyName).toBe("Acme");
    expect(field.value.value).toBe("Acme");
  });

  it("writes nested paths", () => {
    const { form, result: field } = mountDynzForm({ schema }, () => useDynzField<string>("address.zip"));

    field.setValue("1234");

    expect(form.values.address.zip).toBe("1234");
  });

  it("exposes the schema conditions, and keeps them reactive", async () => {
    const { form, result: field } = mountField();

    expect(field.included.value).toBe(true);

    form.setFieldValue("plan", "free");
    await waitForValidation();

    expect(field.included.value).toBe(false);
  });

  it("marks a field read only only when mutable resolves to exactly false", () => {
    const { result } = mountDynzForm(
      { schema, currentValues: { plan: "free", slug: "a", address: { zip: "1234" } } },
      () => ({
        immutable: useDynzField("slug"),
        mutable: useDynzField("address.zip"),
      })
    );

    expect(result.immutable.readOnly.value).toBe(true);
    expect(result.mutable.readOnly.value).toBe(false);
  });

  it("surfaces the error of its own field", async () => {
    const { form, result: field } = mountField();

    field.setValue("no");
    await form.validate();

    expect(field.error.value).toBe(form.errors.value.companyName);
    expect(field.error.value).toBeDefined();
  });

  it("tracks touched state on blur", () => {
    const { form, result: field } = mountField();

    expect(field.isTouched.value).toBe(false);

    field.onBlur();

    expect(field.isTouched.value).toBe(true);
    expect(form.isFieldTouched("companyName")).toBe(true);
  });
});

describe("useDynzField — input handling", () => {
  it("reads the value off a DOM input event", () => {
    const { form, result: field } = mountField();
    const input = document.createElement("input");
    input.value = "Acme";
    input.addEventListener("input", field.onInput);

    input.dispatchEvent(new Event("input"));

    expect(form.values.companyName).toBe("Acme");
  });

  it("accepts a raw value, as emitted by component inputs", () => {
    const { form, result: field } = mountField();

    field.onInput("Acme");

    expect(form.values.companyName).toBe("Acme");
  });

  it("reads checked instead of value for checkboxes", () => {
    const boolSchema = object({ accepted: boolean() });
    const { form, result: field } = mountDynzForm({ schema: boolSchema }, () => useDynzField("accepted"));

    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = true;
    input.addEventListener("input", field.onInput);

    input.dispatchEvent(new Event("input"));

    expect(form.values.accepted).toBe(true);
  });

  it("reads numeric inputs as numbers, and empty ones as undefined", () => {
    const numberSchema = object({ age: number() });
    const { form, result: field } = mountDynzForm({ schema: numberSchema }, () => useDynzField("age"));

    const input = document.createElement("input");
    input.type = "number";
    input.addEventListener("input", field.onInput);

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
    const { form, result: field } = mountField("onSubmit");

    field.setValue("no");
    await waitForValidation();

    expect(form.errors.value.companyName).toBeUndefined();
  });

  it("validates on input in onInput mode", async () => {
    const { form, result: field } = mountField("onInput");

    field.setValue("no");
    await waitForValidation();

    expect(form.errors.value.companyName).toBeDefined();
  });

  it("validates on blur in onBlur mode", async () => {
    const { form, result: field } = mountField("onBlur");

    field.setValue("no");
    await waitForValidation();
    expect(form.errors.value.companyName).toBeUndefined();

    field.onBlur();
    await waitForValidation();

    expect(form.errors.value.companyName).toBeDefined();
  });

  it("switches to the revalidate mode after the first submit", async () => {
    const { form, result: field } = mountDynzForm(
      { schema, initialValues: { plan: "enterprise" }, mode: "onSubmit", revalidateMode: "onInput" },
      () => useDynzField<string>("companyName")
    );

    field.setValue("no");
    await waitForValidation();
    expect(form.errors.value.companyName).toBeUndefined();

    await form.handleSubmit(() => undefined)();
    expect(form.errors.value.companyName).toBeDefined();

    field.setValue("Acme");
    await waitForValidation();

    expect(form.errors.value.companyName).toBeUndefined();
  });
});
