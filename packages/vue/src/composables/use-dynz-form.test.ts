import { array, eq, number, object, options, ref, string } from "dynz";
import { describe, expect, it, vi } from "vitest";
import { useDynzForm } from "./use-dynz-form";

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
    const form = useDynzForm({ schema, initialValues, provideContext: false });

    form.values.address.street = "Side st";

    expect(initialValues.address.street).toBe("Main st");
    expect(form.values.address.street).toBe("Side st");
  });

  it("falls back to currentValues when no initial values are given", () => {
    const form = useDynzForm({ schema, currentValues: validValues(), provideContext: false });

    expect(form.values.slug).toBe("acme");
  });

  it("reports no errors for valid values", async () => {
    const form = useDynzForm({
      schema,
      initialValues: { plan: "free", slug: "acme", address: { street: "Main st", zip: "1234" }, tags: ["vue"] },
      provideContext: false,
    });

    const result = await form.validate();

    expect(result.success).toBe(true);
    expect(form.errors.value).toEqual({});
    expect(form.isValid.value).toBe(true);
  });

  it("keys errors by field name, without the $. prefix", async () => {
    const form = useDynzForm({
      schema,
      initialValues: { plan: "free", slug: "acme", address: { street: "Main st", zip: "1" }, tags: ["a"] },
      provideContext: false,
    });

    await form.validate();

    expect(Object.keys(form.errors.value).sort()).toEqual(["address.zip", "tags[0]"]);
    expect(form.isValid.value).toBe(false);
  });

  it("exposes the raw dynz errors alongside the mapped ones", async () => {
    const form = useDynzForm({
      schema,
      initialValues: { plan: "free", slug: "acme", address: { street: "Main st", zip: "1" }, tags: [] },
      provideContext: false,
    });

    await form.validate();

    expect(form.rawErrors.value).toHaveLength(1);
    expect(form.rawErrors.value[0]?.path).toBe("$.address.zip");
  });

  it("runs error messages through the message transformer", async () => {
    const form = useDynzForm({
      schema,
      initialValues: { plan: "free", slug: "acme", address: { street: "Main st", zip: "1" }, tags: [] },
      messageTransformer: (error) => `translated:${error.code}`,
      provideContext: false,
    });

    await form.validate();

    expect(form.errors.value["address.zip"]).toBe("translated:min_length");
  });

  it("enforces mutability only when currentValues are passed", async () => {
    const withCurrent = useDynzForm({ schema, currentValues: validValues(), provideContext: false });
    withCurrent.values.slug = "changed";
    await withCurrent.validate();

    expect(withCurrent.errors.value.slug).toBeDefined();

    const withoutCurrent = useDynzForm({
      schema,
      initialValues: { ...validValues(), slug: "changed" },
      provideContext: false,
    });
    await withoutCurrent.validate();

    expect(withoutCurrent.errors.value.slug).toBeUndefined();
  });

  it("reports a value that is present on an excluded field", async () => {
    const form = useDynzForm({
      schema,
      initialValues: {
        plan: "free",
        slug: "acme",
        companyName: "Acme",
        address: { street: "Main st", zip: "1234" },
        tags: [],
      },
      provideContext: false,
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

  function invalidForm() {
    return useDynzForm({
      schema: crossFieldSchema,
      initialValues: { password: "sh", confirmPassword: "nope", unrelated: "no" },
      provideContext: false,
    });
  }

  it("does not surface errors for fields the user has not touched", async () => {
    const form = invalidForm();

    await form.validateField("password");

    expect(Object.keys(form.errors.value)).toEqual(["password"]);
  });

  it("clears an error once it is resolved", async () => {
    const form = invalidForm();

    await form.validateField("password");
    expect(form.errors.value.password).toBeDefined();

    form.values.password = "longenough";
    await form.validateField("password");

    expect(form.errors.value.password).toBeUndefined();
  });

  it("heals a cross-field error on another field once it becomes valid", async () => {
    const form = invalidForm();

    await form.validate();
    expect(Object.keys(form.errors.value)).toHaveLength(3);

    form.values.password = "longenough";
    form.values.confirmPassword = "longenough";
    await form.validateField("password");

    expect(form.errors.value.password).toBeUndefined();
    expect(form.errors.value.confirmPassword).toBeUndefined();
    expect(form.errors.value.unrelated).toBeDefined();
  });

  it("keeps the raw errors in sync with the mapped ones", async () => {
    const form = invalidForm();

    await form.validateField("password");

    expect(form.rawErrors.value.map((error) => error.path)).toEqual(["$.password"]);
  });

  it("also clears nested errors below the field", async () => {
    const form = useDynzForm({
      schema,
      initialValues: { plan: "free", slug: "acme", address: { street: "Main st", zip: "1" }, tags: [] },
      provideContext: false,
    });

    await form.validate();
    expect(form.errors.value["address.zip"]).toBeDefined();

    form.values.address.zip = "1234";
    await form.validateField("address");

    expect(form.errors.value["address.zip"]).toBeUndefined();
  });
});

describe("useDynzForm — submitting", () => {
  const submitSchema = object({ email: string().min(3), age: number() });

  it("calls onValid with the validated values", async () => {
    const form = useDynzForm({
      schema: submitSchema,
      initialValues: { email: "a@b.c", age: 30 },
      provideContext: false,
    });
    const onValid = vi.fn();

    await form.handleSubmit(onValid)();

    expect(onValid).toHaveBeenCalledWith({ email: "a@b.c", age: 30 });
    expect(form.isSubmitted.value).toBe(true);
    expect(form.submitCount.value).toBe(1);
    expect(form.isSubmitting.value).toBe(false);
  });

  it("calls onInvalid with the dynz errors and prevents the default event", async () => {
    const form = useDynzForm({ schema: submitSchema, initialValues: { email: "a", age: 30 }, provideContext: false });
    const onValid = vi.fn();
    const onInvalid = vi.fn();
    const preventDefault = vi.fn();

    await form.handleSubmit(onValid, onInvalid)({ preventDefault } as unknown as Event);

    expect(preventDefault).toHaveBeenCalled();
    expect(onValid).not.toHaveBeenCalled();
    expect(onInvalid).toHaveBeenCalledWith([expect.objectContaining({ path: "$.email" })]);
  });

  it("clears isSubmitting even when the handler throws", async () => {
    const form = useDynzForm({
      schema: submitSchema,
      initialValues: { email: "a@b.c", age: 30 },
      provideContext: false,
    });

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
    const form = useDynzForm({ schema: stateSchema, provideContext: false });

    form.setError("a", "nope");
    expect(form.errors.value).toEqual({ a: "nope" });

    form.setError("a", undefined);
    expect(form.errors.value).toEqual({});

    form.setError("b", "nope");
    form.clearErrors();
    expect(form.errors.value).toEqual({});
  });

  it("reads and writes values by path", () => {
    const form = useDynzForm({ schema, provideContext: false });

    form.setValue("address.zip", "1234");
    form.setValue("tags[0]", "vue");

    expect(form.getValue("address.zip")).toBe("1234");
    expect(form.values.tags).toEqual(["vue"]);
  });

  it("resets back to the initial values", async () => {
    const form = useDynzForm({
      schema: stateSchema,
      initialValues: { a: "one" },
      provideContext: false,
    });

    form.values.a = "changed";
    form.values.b = "added";
    form.setError("a", "nope");
    form.setTouched("a");
    await form.handleSubmit(() => undefined)();

    form.reset();

    expect(form.values).toEqual({ a: "one" });
    expect(form.errors.value).toEqual({});
    expect(form.touched.value).toEqual({});
    expect(form.isSubmitted.value).toBe(false);
    expect(form.submitCount.value).toBe(0);
  });

  it("resets to explicit values", () => {
    const form = useDynzForm({ schema: stateSchema, initialValues: { a: "one" }, provideContext: false });

    form.reset({ a: "two", b: "three" });

    expect(form.values).toEqual({ a: "two", b: "three" });
  });

  it("exposes the rule dependencies dynz reports for a field", () => {
    const depSchema = object({
      password: string(),
      confirmPassword: string().equals(ref("password")),
    });
    const form = useDynzForm({ schema: depSchema, provideContext: false });

    // NOTE: dynz' getRulesDependenciesMap currently returns an empty map for object
    // schemas (it collects rules off the root schema instead of the nested one), so
    // there is nothing to report here yet. validateField does not rely on it — see the
    // "heals a cross-field error" test above.
    expect(form.getDependencies("password")).toBeUndefined();
  });
});
