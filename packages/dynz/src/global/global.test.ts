import { describe, expect, it } from "vitest";
import { and, eq } from "../functions";
import { v } from "../functions/builders";
import { REFERENCE_TYPE, ref } from "../reference";
import { GLOBAL_TYPE, type GlobalReference, global, isGlobalReference } from "./global";

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
    const reference = global("currentUserId");

    expect(reference).toEqual({
      type: GLOBAL_TYPE,
      key: "currentUserId",
    });
  });

  it("should preserve exact key string", () => {
    const key = "some.dotted.looking.key";
    const reference = global(key);

    expect(reference.key).toBe(key);
  });

  it("should create a global reference with empty string key", () => {
    const reference = global("");

    expect(reference).toEqual({
      type: GLOBAL_TYPE,
      key: "",
    });
  });
});

describe("isGlobalReference function", () => {
  it("should return true for valid global reference objects", () => {
    const reference = global("today");
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
    const value: unknown = global("test.key");

    if (isGlobalReference(value)) {
      expect(value.type).toBe(GLOBAL_TYPE);
      expect(value.key).toBe("test.key");
    } else {
      throw new Error("Expected value to be a global reference");
    }
  });

  it("should work with generic key types", () => {
    const specific: GlobalReference<"currentUser"> = global("currentUser");
    expect(specific.key).toBe("currentUser");
  });
});

describe("serialization", () => {
  it("should preserve global reference type through object transformations", () => {
    const original = global("original.key");
    const copied = { ...original };
    const jsonParsed = JSON.parse(JSON.stringify(original));

    expect(isGlobalReference(original)).toBe(true);
    expect(isGlobalReference(copied)).toBe(true);
    expect(isGlobalReference(jsonParsed)).toBe(true);
  });
});
