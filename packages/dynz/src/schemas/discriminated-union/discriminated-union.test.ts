import { describe, expect, it } from "vitest";
import { eq, v } from "../../functions";
import { ref } from "../../reference";
import { ErrorCode } from "../../types";
import { validate } from "../../validate";
import { discriminatedUnion, number, object, string } from "..";
import { DISCRIMINATOR_TYPE } from "./types";

describe("discriminatedUnion()", () => {
  it("normalizes a raw primitive discriminator value into a Discriminator", () => {
    const schema = discriminatedUnion("kind", [{ kind: "a", value: string() }]);

    expect(schema.schemas[0]?.kind).toEqual({ type: DISCRIMINATOR_TYPE, value: "a" });
  });

  it("normalizes a DynamicOptionValue discriminator value into a Discriminator", () => {
    const enabled = eq(ref("country"), v("NL"));
    const schema = discriminatedUnion("kind", [{ kind: { enabled, value: "a" }, value: string() }]);

    expect(schema.schemas[0]?.kind).toEqual({ type: DISCRIMINATOR_TYPE, value: "a", enabled });
  });

  it("leaves non-discriminator fields untouched", () => {
    const valueSchema = string();
    const schema = discriminatedUnion("kind", [{ kind: "a", value: valueSchema }]);

    expect(schema.schemas[0]?.value).toBe(valueSchema);
  });
});

describe("discriminated union validation", () => {
  const schema = object({
    kind: discriminatedUnion("kind", [
      { kind: "a", value: string() },
      { kind: "b", value: number() },
    ]),
  });

  it("validates the matching member for a plain-string discriminator", async () => {
    const result = await validate(schema, undefined, { kind: { kind: "a", value: "hello" } });

    expect(result).toEqual({ success: true, values: { kind: { kind: "a", value: "hello" } } });
  });

  it("fails when no member matches the discriminator value", async () => {
    const result = await validate(schema, undefined, { kind: { kind: "c", value: "hello" } });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0]?.code).toBe(ErrorCode.TYPE);
    }
  });

  describe("with a DynamicOptionValue discriminator", () => {
    it("matches a member whose discriminator is statically enabled", async () => {
      const dynamicSchema = object({
        kind: discriminatedUnion("kind", [
          { kind: { enabled: true, value: "a" }, value: string() },
          { kind: "b", value: number() },
        ]),
      });

      const result = await validate(dynamicSchema, undefined, { kind: { kind: "a", value: "hello" } });

      expect(result).toEqual({ success: true, values: { kind: { kind: "a", value: "hello" } } });
    });

    it("unwraps the DynamicOptionValue to its literal value in the validated output", async () => {
      const dynamicSchema = object({
        kind: discriminatedUnion("kind", [{ kind: { enabled: true, value: "a" }, value: string() }]),
      });

      const result = await validate(dynamicSchema, undefined, { kind: { kind: "a", value: "hello" } });

      expect(result).toEqual({ success: true, values: { kind: { kind: "a", value: "hello" } } });
    });

    it("never matches a member whose discriminator is statically disabled", async () => {
      const dynamicSchema = object({
        kind: discriminatedUnion("kind", [
          { kind: { enabled: false, value: "a" }, value: string() },
          { kind: "b", value: number() },
        ]),
      });

      const result = await validate(dynamicSchema, undefined, { kind: { kind: "a", value: "hello" } });

      expect(result.success).toBe(false);
    });

    it("matches or rejects based on a predicate-based enabled flag", async () => {
      const dynamicSchema = object({
        country: string(),
        kind: discriminatedUnion("kind", [
          { kind: { enabled: eq(ref("$.country"), v("NL")), value: "a" }, value: string() },
          { kind: "b", value: number() },
        ]),
      });

      const enabledResult = await validate(dynamicSchema, undefined, {
        country: "NL",
        kind: { kind: "a", value: "hello" },
      });
      expect(enabledResult.success).toBe(true);

      const disabledResult = await validate(dynamicSchema, undefined, {
        country: "BE",
        kind: { kind: "a", value: "hello" },
      });
      expect(disabledResult.success).toBe(false);
    });
  });
});
