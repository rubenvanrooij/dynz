import { array, boolean, eq, number, object, ref, string } from "dynz";
import type { TypedSchema } from "vee-validate";
import { describe, expect, expectTypeOf, it } from "vitest";
import { dynzTypedSchema } from "./dynz-typed-schema";

describe("dynzTypedSchema", () => {
  it("satisfies VeeValidate's TypedSchema contract", () => {
    const schema = object({ fieldOne: string() });

    // This is the one contract dynz does not own; if VeeValidate changes its typed
    // schema shape, this assertion is what fails.
    expectTypeOf(dynzTypedSchema(schema)).toExtend<TypedSchema>();
  });

  it("returns the parsed values for a valid document", async () => {
    const schema = object({
      fieldOne: string(),
      fieldTwo: number(),
      fieldThree: boolean(),
    });

    const result = await dynzTypedSchema(schema).parse({
      fieldOne: "string",
      fieldTwo: 1,
      fieldThree: false,
    });

    expect(result.errors).toEqual([]);
    expect(result.value).toEqual({ fieldOne: "string", fieldTwo: 1, fieldThree: false });
  });

  it("returns errors grouped per path, without the $. prefix", async () => {
    const schema = object({ address: object({ zip: string().min(4) }) });

    const result = await dynzTypedSchema(schema).parse({ address: { zip: "1" } });

    expect(result.value).toBeUndefined();
    expect(result.errors).toEqual([{ path: "address.zip", errors: [expect.any(String)] }]);
  });

  it("collects every message of a field into one entry", async () => {
    const schema = object({ value: string().setRequired(true).min(10).regex("^[A-Z]") });

    const result = await dynzTypedSchema(schema).parse({ value: "hi" });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.path).toBe("value");
    expect(result.errors[0]?.errors.length).toBeGreaterThan(0);
  });

  it("uses the bracket notation VeeValidate expects for array paths", async () => {
    const schema = object({ tags: array(string().min(2)) });

    const result = await dynzTypedSchema(schema).parse({ tags: ["ok", "a"] });

    // dynz reports `$.tags.[1]`; VeeValidate addresses the same field as `tags[1]`.
    expect(result.errors[0]?.path).toBe("tags[1]");
  });

  it("runs messages through the transformer", async () => {
    const schema = object({ value: string().min(10) });

    const result = await dynzTypedSchema(schema, undefined, undefined, {
      messageTransformer: (error) => `translated:${error.code}`,
    }).parse({ value: "hi" });

    expect(result.errors).toEqual([{ path: "value", errors: ["translated:min_length"] }]);
  });

  it("enforces mutability when current values are supplied", async () => {
    const schema = object({ slug: string().setMutable(false) });

    const withCurrent = await dynzTypedSchema(schema, { slug: "acme" }).parse({ slug: "changed" });
    expect(withCurrent.errors).toHaveLength(1);

    const withoutCurrent = await dynzTypedSchema(schema).parse({ slug: "changed" });
    expect(withoutCurrent.errors).toEqual([]);
  });

  it("forwards the validate options", async () => {
    const schema = object({
      plan: string(),
      companyName: string().setIncluded(eq(ref("plan"), "enterprise")),
    });

    const result = await dynzTypedSchema(schema, undefined, { stripNotIncludedValues: true }).parse({
      plan: "free",
      companyName: "Acme",
    });

    expect(result.errors).toEqual([]);
    expect(result.value).toEqual({ plan: "free" });
  });
});

describe("dynzTypedSchema — describe", () => {
  const schema = object({
    plan: string(),
    companyName: string().setRequired(eq(ref("plan"), "enterprise")),
    nickname: string().setRequired(false),
  });

  it("reports a statically required field as required", () => {
    expect(dynzTypedSchema(schema).describe("plan")).toEqual({ required: true, exists: true });
  });

  it("reports an optional field as not required", () => {
    expect(dynzTypedSchema(schema).describe("nickname")).toEqual({ required: false, exists: true });
  });

  it("resolves conditional required against the live values", () => {
    let values: { plan: string } = { plan: "free" };
    const typedSchema = dynzTypedSchema(schema, undefined, undefined, { getValues: () => values });

    expect(typedSchema.describe("companyName").required).toBe(false);

    values = { plan: "enterprise" };

    expect(typedSchema.describe("companyName").required).toBe(true);
  });

  it("reports unknown paths as non-existent instead of throwing", () => {
    expect(dynzTypedSchema(schema).describe("nope")).toEqual({ required: false, exists: false });
  });
});
