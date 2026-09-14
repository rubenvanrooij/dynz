import { array, eq, number, object, options, ref, string } from "dynz";
import { describe, expect, it, vi } from "vitest";
import { mountDynzForm } from "../testing/mount-form";
import { useDynzField } from "./use-dynz-field";

const schema = object({
  plan: options(["free", "enterprise"] as const),
  companyName: string()
    .min(3)
    .setIncluded(eq(ref("plan"), "enterprise")),
  slug: string().setMutable(false),
  address: object({
    street: string(),
    zip: string().min(4),
  }),
  tags: array(string().min(2)),
});

function validValues() {
  return {
    plan: "free" as const,
    slug: "acme",
    address: { street: "Main st", zip: "1234" },
    tags: [] as string[],
  };
}

describe("useDynzForm", () => {
  it("starts out with a deep copy of the initial values", () => {
    const initialValues = { address: { street: "Main st", zip: "1234" } };
    const { form } = mountDynzForm({ schema, initialValues });

    form.setFieldValue("address.street", "Side st");

    expect(initialValues.address.street).toBe("Main st");
    expect(form.values.address.street).toBe("Side st");
  });

  it("falls back to currentValues when no initial values are given", () => {
    const { form } = mountDynzForm({ schema, currentValues: validValues() });

    expect(form.values.slug).toBe("acme");
  });

  it("reports no errors for valid values", async () => {
    const { form } = mountDynzForm({
      schema,
      initialValues: { plan: "free", slug: "acme", address: { street: "Main st", zip: "1234" }, tags: ["vue"] },
    });

    const result = await form.validate();

    expect(result.valid).toBe(true);
    expect(form.errors.value).toEqual({});
    expect(form.meta.value.valid).toBe(true);
  });

  it("keys errors by field name, without the $. prefix", async () => {
    const { form } = mountDynzForm({
      schema,
      initialValues: { plan: "free", slug: "acme", address: { street: "Main st", zip: "1" }, tags: ["a"] },
    });

    await form.validate();

    expect(Object.keys(form.errors.value).sort()).toEqual(["address.zip", "tags[0]"]);
    expect(form.meta.value.valid).toBe(false);
  });

  it("runs error messages through the message transformer", async () => {
    const { form } = mountDynzForm({
      schema,
      initialValues: { plan: "free", slug: "acme", address: { street: "Main st", zip: "1" }, tags: [] },
      messageTransformer: (error) => `translated:${error.code}`,
    });

    await form.validate();

    expect(form.errors.value["address.zip"]).toBe("translated:min_length");
  });

  it("enforces mutability only when currentValues are passed", async () => {
    const { form: withCurrent } = mountDynzForm({ schema, currentValues: validValues() });
    withCurrent.setFieldValue("slug", "changed");
    await withCurrent.validate();

    expect(withCurrent.errors.value.slug).toBeDefined();

    const { form: withoutCurrent } = mountDynzForm({
      schema,
      initialValues: { ...validValues(), slug: "changed" },
    });
    await withoutCurrent.validate();

    expect(withoutCurrent.errors.value.slug).toBeUndefined();
  });

  it("reports a value that is present on an excluded field", async () => {
    const { form } = mountDynzForm({
      schema,
      initialValues: {
        plan: "free",
        slug: "acme",
        companyName: "Acme",
        address: { street: "Main st", zip: "1234" },
        tags: [],
      },
    });

    await form.validate();

    expect(form.errors.value.companyName).toBeDefined();
  });
});

describe("useDynzForm — validateField", () => {
  const crossFieldSchema = object({
    password: string().min(8),
    confirmPassword: string().equals(ref("password")),
    unrelated: string().min(5),
  });

  /**
   * `validateField` only skips fields the user has not touched when those fields
   * have their own registered vee-validate field state — which in a real app is
   * exactly what `DynzField`/`useDynzField` provide for every rendered field. A form
   * with no fields mounted has nothing to scope against, so every field is mounted
   * here to exercise the real behavior.
   */
  function mountInvalidForm() {
    return mountDynzForm(
      { schema: crossFieldSchema, initialValues: { password: "sh", confirmPassword: "nope", unrelated: "no" } },
      () => ({
        password: useDynzField<string>("password"),
        confirmPassword: useDynzField<string>("confirmPassword"),
        unrelated: useDynzField<string>("unrelated"),
      })
    );
  }

  it("does not surface errors for fields the user has not touched", async () => {
    const { form } = mountInvalidForm();

    await form.validateField("password");

    expect(Object.keys(form.errors.value)).toEqual(["password"]);
  });

  it("clears an error once it is resolved", async () => {
    const { form, result: fields } = mountInvalidForm();

    await form.validateField("password");
    expect(form.errors.value.password).toBeDefined();

    fields.password.setValue("longenough");
    await form.validateField("password");

    expect(form.errors.value.password).toBeUndefined();
  });

  it("heals a cross-field error on another field once it becomes valid", async () => {
    const { form, result: fields } = mountInvalidForm();

    await form.validate();
    expect(Object.keys(form.errors.value)).toHaveLength(3);

    fields.password.setValue("longenough");
    fields.confirmPassword.setValue("longenough");
    await form.validateField("password");

    expect(form.errors.value.password).toBeUndefined();
    expect(form.errors.value.confirmPassword).toBeUndefined();
    expect(form.errors.value.unrelated).toBeDefined();
  });

  it("also clears a nested field's own error once it is resolved", async () => {
    const { form, result: fields } = mountDynzForm(
      { schema, initialValues: { plan: "free", slug: "acme", address: { street: "Main st", zip: "1" }, tags: [] } },
      () => ({ zip: useDynzField<string>("address.zip") })
    );

    await form.validate();
    expect(form.errors.value["address.zip"]).toBeDefined();

    fields.zip.setValue("1234");
    await form.validateField("address.zip");

    expect(form.errors.value["address.zip"]).toBeUndefined();
  });
});

describe("useDynzForm — submitting", () => {
  const submitSchema = object({ email: string().min(3), age: number() });

  it("calls onValid with the validated values", async () => {
    const { form } = mountDynzForm({ schema: submitSchema, initialValues: { email: "a@b.c", age: 30 } });
    const onValid = vi.fn();

    await form.handleSubmit(onValid)();

    expect(onValid).toHaveBeenCalledWith({ email: "a@b.c", age: 30 }, expect.anything());
    expect(form.context.isSubmitted?.()).toBe(true);
    expect(form.submitCount.value).toBe(1);
    expect(form.isSubmitting.value).toBe(false);
  });

  it("calls onInvalid with the dynz errors and prevents the default event", async () => {
    const { form } = mountDynzForm({ schema: submitSchema, initialValues: { email: "a", age: 30 } });
    const onValid = vi.fn();
    const onInvalid = vi.fn();
    const event = new Event("submit");
    const preventDefaultSpy = vi.spyOn(event, "preventDefault");

    await form.handleSubmit(onValid, onInvalid)(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(onValid).not.toHaveBeenCalled();
    expect(onInvalid).toHaveBeenCalledWith(
      expect.objectContaining({ errors: expect.objectContaining({ email: expect.any(String) }) })
    );
  });

  it("clears isSubmitting even when the handler throws", async () => {
    const { form } = mountDynzForm({ schema: submitSchema, initialValues: { email: "a@b.c", age: 30 } });

    await expect(
      form.handleSubmit(() => {
        throw new Error("boom");
      })()
    ).rejects.toThrow("boom");

    expect(form.isSubmitting.value).toBe(false);
  });
});

describe("useDynzForm — state helpers", () => {
  const stateSchema = object({ a: string(), b: string() });

  it("sets and clears errors manually", () => {
    const { form } = mountDynzForm({ schema: stateSchema });

    form.setFieldError("a", "nope");
    expect(form.errors.value.a).toBe("nope");

    form.setFieldError("a", undefined);
    expect(form.errors.value.a).toBeUndefined();

    // `setErrors` only sets the keys it is given — clearing a field means passing
    // `undefined` for it explicitly, there is no "wipe everything" shorthand.
    form.setErrors({ a: "nope", b: "also nope" });
    expect(form.errors.value).toEqual({ a: "nope", b: "also nope" });

    form.setErrors({ a: undefined, b: undefined });
    expect(form.errors.value).toEqual({});
  });

  it("reads and writes values by path", () => {
    const { form } = mountDynzForm({ schema });

    form.setFieldValue("address.zip", "1234");
    form.setFieldValue("tags[0]" as never, "vue" as never);

    expect(form.getValue("address.zip")).toBe("1234");
    expect(form.values.tags).toEqual(["vue"]);
  });

  it("resets back to the initial values", async () => {
    const { form } = mountDynzForm({ schema: stateSchema, initialValues: { a: "one" } });

    form.setFieldValue("a", "changed");
    form.setFieldValue("b", "added");
    form.setFieldError("a", "nope");
    form.setFieldTouched("a", true);
    await form.handleSubmit(() => undefined)();

    form.resetForm();

    expect(form.values).toEqual({ a: "one" });
    expect(form.errors.value).toEqual({});
    expect(form.isFieldTouched("a")).toBe(false);
    expect(form.context.isSubmitted?.()).toBe(false);
    expect(form.submitCount.value).toBe(0);
  });

  it("resets to explicit values", () => {
    const { form } = mountDynzForm({ schema: stateSchema, initialValues: { a: "one" } });

    form.resetForm({ values: { a: "two", b: "three" } });

    expect(form.values).toEqual({ a: "two", b: "three" });
  });

  it("exposes the rule dependencies dynz reports for a field", () => {
    const depSchema = object({
      password: string(),
      confirmPassword: string().equals(ref("password")),
    });
    const { form } = mountDynzForm({ schema: depSchema });

    // NOTE: dynz' getRulesDependenciesMap currently returns an empty map for object
    // schemas (it collects rules off the root schema instead of the nested one), so
    // there is nothing to report here yet. validateField does not rely on it — see the
    // "heals a cross-field error" test above.
    expect(form.getDependencies("password")).toBeUndefined();
  });
});
