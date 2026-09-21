import { describe, expect, expectTypeOf, it } from "vitest";
import { and, eq } from "../functions";
import { v } from "../functions/builders";
import { REFERENCE_TYPE, ref } from "../reference";
import { number, string } from "../schemas";
import { SchemaType } from "../types";
import { createGlobals, GLOBAL_TYPE, type GlobalReference, GlobalType, global, isGlobalReference } from "./global";

describe("GLOBAL_TYPE", () => {
  it("should be a constant string", () => {
    expect(GLOBAL_TYPE).toBe("_dglobal");
    expect(typeof GLOBAL_TYPE).toBe("string");
  });

  it("should be distinct from REFERENCE_TYPE", () => {
    expect(GLOBAL_TYPE).not.toBe(REFERENCE_TYPE);
  });
});

describe("global function", () => {
  it("should create a global reference object with a simple key", () => {
    const reference = global("currentUserId", GlobalType.STRING);

    expect(reference).toEqual({
      type: GLOBAL_TYPE,
      globalType: "string",
      key: "currentUserId",
    });
  });

  it("should preserve exact key string", () => {
    const key = "some.dotted.looking.key";
    const reference = global(key, GlobalType.STRING);

    expect(reference.key).toBe(key);
  });

  it("should create a global reference with empty string key", () => {
    const reference = global("", GlobalType.STRING);

    expect(reference).toEqual({
      type: GLOBAL_TYPE,
      globalType: "string",
      key: "",
    });
  });
});

describe("isGlobalReference function", () => {
  it("should return true for valid global reference objects", () => {
    const reference = global("today", GlobalType.STRING);
    expect(isGlobalReference(reference)).toBe(true);
  });

  it("should return true for manually created global reference objects", () => {
    const manual = { type: GLOBAL_TYPE, key: "manual" };
    expect(isGlobalReference(manual)).toBe(true);
  });

  it("should return false for null", () => {
    expect(isGlobalReference(null)).toBe(false);
  });

  it("should return false for undefined", () => {
    expect(isGlobalReference(undefined)).toBe(false);
  });

  it("should return false for primitive values", () => {
    expect(isGlobalReference("string")).toBe(false);
    expect(isGlobalReference(123)).toBe(false);
    expect(isGlobalReference(true)).toBe(false);
    expect(isGlobalReference(false)).toBe(false);
  });

  it("should return false for arrays", () => {
    expect(isGlobalReference([])).toBe(false);
  });

  it("should return false for plain objects", () => {
    expect(isGlobalReference({})).toBe(false);
    expect(isGlobalReference({ name: "test" })).toBe(false);
  });

  it("should return false for objects missing type", () => {
    expect(isGlobalReference({ key: "test" })).toBe(false);
  });

  it("should return false for objects missing key", () => {
    expect(isGlobalReference({ type: GLOBAL_TYPE })).toBe(false);
  });

  // The important regression: a GlobalReference and a Reference must never both match.
  it("should return false for a Reference built by ref()", () => {
    expect(isGlobalReference(ref("some.path"))).toBe(false);
  });

  it("should return false for a Static value built by v()", () => {
    expect(isGlobalReference(v("hello"))).toBe(false);
  });

  it("should return false for a Predicate", () => {
    expect(isGlobalReference(eq(v(1), v(1)))).toBe(false);
    expect(isGlobalReference(and(eq(v(1), v(1))))).toBe(false);
  });
});

describe("GlobalReference type", () => {
  it("should work as a type guard", () => {
    const value: unknown = global("test.key", GlobalType.NUMBER);

    if (isGlobalReference(value)) {
      expect(value.type).toBe(GLOBAL_TYPE);
      expect(value.key).toBe("test.key");
    } else {
      throw new Error("Expected value to be a global reference");
    }
  });

  it("should work with generic key types", () => {
    const specific: GlobalReference<"currentUser"> = global("currentUser", GlobalType.NUMBER);
    expect(specific.key).toBe("currentUser");
  });
});

describe("serialization", () => {
  it("should preserve global reference type through object transformations", () => {
    const original = global("original.key", GlobalType.STRING);
    const copied = { ...original };
    const jsonParsed = JSON.parse(JSON.stringify(original));

    expect(isGlobalReference(original)).toBe(true);
    expect(isGlobalReference(copied)).toBe(true);
    expect(isGlobalReference(jsonParsed)).toBe(true);
  });
});

describe("createGlobals", () => {
  it("returns the contract unchanged", () => {
    const contract = { minAmount: SchemaType.NUMBER, now: SchemaType.DATE } as const;
    const { contract: returned } = createGlobals(contract);

    expect(returned).toBe(contract);
  });

  it("produces a global reference carrying the contract's SchemaType for that key", () => {
    const { global: typedGlobal } = createGlobals({ minAmount: SchemaType.NUMBER, now: SchemaType.DATE });

    expect(typedGlobal("minAmount")).toEqual({
      type: GLOBAL_TYPE,
      key: "minAmount",
      globalType: SchemaType.NUMBER,
    });
  });

  it("still satisfies isGlobalReference", () => {
    const { global: typedGlobal } = createGlobals({ now: SchemaType.DATE });

    expect(isGlobalReference(typedGlobal("now"))).toBe(true);
  });

  it("survives JSON round-tripping, contract included", () => {
    const { global: typedGlobal } = createGlobals({ minAmount: SchemaType.NUMBER });
    const jsonParsed = JSON.parse(JSON.stringify(typedGlobal("minAmount")));

    expect(jsonParsed).toEqual({ type: GLOBAL_TYPE, key: "minAmount", globalType: "number" });
  });

  describe("type safety", () => {
    it("types the key against the contract and the value against its SchemaType", () => {
      const { global: typedGlobal } = createGlobals({ minAmount: SchemaType.NUMBER, now: SchemaType.DATE });

      expectTypeOf(typedGlobal("minAmount")).toEqualTypeOf<GlobalReference<"minAmount", typeof SchemaType.NUMBER>>();

      // @ts-expect-error - "unknownKey" isn't in the contract
      typedGlobal("unknownKey");

      // A number-typed global is accepted where a number is expected...
      number().min(typedGlobal("minAmount"));

      // @ts-expect-error - ...but a date-typed global is not.
      number().min(typedGlobal("now"));
    });

    it("keeps the untyped global() escape hatch assignable anywhere, regardless of value type", () => {
      // No contract, no compile-time value-type checking - same as before createGlobals() existed.
      number().min(global("minAmount", GlobalType.NUMBER));
      string().min(global("minLength", GlobalType.NUMBER));
    });
  });
});
