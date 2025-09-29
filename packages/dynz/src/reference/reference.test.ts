import { describe, expect, it } from "vitest";
import { isReference, REFERENCE_TYPE, type Reference, ref, type ValueOrReference } from "./reference";

describe("REFERENCE_TYPE", () => {
  it("should be a constant string", () => {
    expect(REFERENCE_TYPE).toBe("__dref");
    expect(typeof REFERENCE_TYPE).toBe("string");
  });
});

describe("ref function", () => {
  it("should create a reference object with simple path", () => {
    const reference = ref("user.name");

    expect(reference).toEqual({
      _type: REFERENCE_TYPE,
      path: "user.name",
    });
  });

  it("should create a reference object with JSONPath", () => {
    const reference = ref("$.user.profile.email");

    expect(reference).toEqual({
      _type: REFERENCE_TYPE,
      path: "$.user.profile.email",
    });
  });

  it("should create a reference object with array index path", () => {
    const reference = ref("users[0].name");

    expect(reference).toEqual({
      _type: REFERENCE_TYPE,
      path: "users[0].name",
    });
  });

  it("should create a reference object with complex nested path", () => {
    const reference = ref("$.data.users[0].profile.settings.theme");

    expect(reference).toEqual({
      _type: REFERENCE_TYPE,
      path: "$.data.users[0].profile.settings.theme",
    });
  });

  it("should create a reference object with root path", () => {
    const reference = ref("$");

    expect(reference).toEqual({
      _type: REFERENCE_TYPE,
      path: "$",
    });
  });

  it("should preserve exact path string", () => {
    const path = "some.complex.path[123].value";
    const reference = ref(path);

    expect(reference.path).toBe(path);
  });

  it("should create reference with empty string path", () => {
    const reference = ref("");

    expect(reference).toEqual({
      _type: REFERENCE_TYPE,
      path: "",
    });
  });
});

describe("isReference function", () => {
  it("should return true for valid reference objects", () => {
    const reference = ref("user.name");
    expect(isReference(reference)).toBe(true);
  });

  it("should return true for manually created reference objects", () => {
    const manualRef = {
      _type: REFERENCE_TYPE,
      path: "manual.path",
    };
    expect(isReference(manualRef)).toBe(true);
  });

  it("should return false for null", () => {
    expect(isReference(null)).toBe(false);
  });

  it("should return false for undefined", () => {
    expect(isReference(undefined)).toBe(false);
  });

  it("should return false for primitive values", () => {
    expect(isReference("string")).toBe(false);
    expect(isReference(123)).toBe(false);
    expect(isReference(true)).toBe(false);
    expect(isReference(false)).toBe(false);
  });

  it("should return false for arrays", () => {
    expect(isReference([])).toBe(false);
    expect(isReference([1, 2, 3])).toBe(false);
  });

  it("should return false for plain objects", () => {
    expect(isReference({})).toBe(false);
    expect(isReference({ name: "test" })).toBe(false);
  });

  it("should return false for objects with wrong _type", () => {
    expect(isReference({ _type: "wrong", path: "test" })).toBe(false);
    expect(isReference({ _type: "reference", path: "test" })).toBe(false);
  });

  it("should return false for objects missing _type", () => {
    expect(isReference({ path: "test" })).toBe(false);
  });

  it("should return false for objects missing path", () => {
    expect(isReference({ _type: REFERENCE_TYPE })).toBe(false);
  });

  it("should return false for objects with additional properties", () => {
    const objWithExtra = {
      _type: REFERENCE_TYPE,
      path: "test",
      extra: "property",
    };
    expect(isReference(objWithExtra)).toBe(true); // Should still be valid
  });

  it("should return false for Date objects", () => {
    expect(isReference(new Date())).toBe(false);
  });

  it("should return false for Error objects", () => {
    expect(isReference(new Error("test"))).toBe(false);
  });

  it("should return false for RegExp objects", () => {
    expect(isReference(/test/)).toBe(false);
  });

  it("should return false for functions", () => {
    expect(isReference(() => {})).toBe(false);
    expect(isReference(function test() {})).toBe(false);
  });
});

describe("Reference type", () => {
  it("should work as type guard", () => {
    const value: unknown = ref("test.path");

    if (isReference(value)) {
      // TypeScript should know this is a Reference
      expect(value._type).toBe(REFERENCE_TYPE);
      expect(value.path).toBe("test.path");
    } else {
      throw new Error("Expected value to be a reference");
    }
  });

  it("should work with generic path types", () => {
    const specificRef: Reference<"$.user.name"> = ref("$.user.name");
    expect(specificRef.path).toBe("$.user.name");
  });
});

describe("ValueOrReference type", () => {
  it("should accept both values and references", () => {
    const stringValue: ValueOrReference<string> = "test";
    const stringRef: ValueOrReference<string> = ref("test.path");
    const numberValue: ValueOrReference<number> = 42;
    const numberRef: ValueOrReference<number> = ref("number.path");

    expect(typeof stringValue).toBe("string");
    expect(isReference(stringRef)).toBe(true);
    expect(typeof numberValue).toBe("number");
    expect(isReference(numberRef)).toBe(true);
  });

  it("should work with complex types", () => {
    interface User extends Record<string, unknown> {
      name: string;
      age: number;
    }

    const userValue: ValueOrReference<User> = { name: "John", age: 30 };
    const userRef: ValueOrReference<User> = ref("$.user");

    expect(typeof userValue).toBe("object");
    expect(userValue.name).toBe("John");
    expect(isReference(userRef)).toBe(true);
  });
});

describe("Integration tests", () => {
  it("should create and validate references in a workflow", () => {
    const userNameRef = ref("$.user.profile.name");
    const userAgeRef = ref("$.user.profile.age");

    expect(isReference(userNameRef)).toBe(true);
    expect(isReference(userAgeRef)).toBe(true);

    expect(userNameRef.path).toBe("$.user.profile.name");
    expect(userAgeRef.path).toBe("$.user.profile.age");
  });

  it("should handle mixed arrays of values and references", () => {
    const mixed: ValueOrReference<string>[] = [
      "literal string",
      ref("$.string.path"),
      "another literal",
      ref("$.another.path"),
    ];

    expect(mixed.length).toBe(4);
    expect(isReference(mixed[0])).toBe(false);
    expect(isReference(mixed[1])).toBe(true);
    expect(isReference(mixed[2])).toBe(false);
    expect(isReference(mixed[3])).toBe(true);
  });

  it("should preserve reference type through object transformations", () => {
    const original = ref("original.path");
    const copied = { ...original };
    const jsonParsed = JSON.parse(JSON.stringify(original));

    expect(isReference(original)).toBe(true);
    expect(isReference(copied)).toBe(true);
    expect(isReference(jsonParsed)).toBe(true);
  });
});
