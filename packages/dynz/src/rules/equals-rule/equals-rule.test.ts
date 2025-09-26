import { describe, expect, it } from "vitest";
import { REFERENCE_TYPE, ref } from "../../reference";
import { equals } from "./index";

describe("equals rule", () => {
  it("should create equals rule with string value", () => {
    const rule = equals("admin");

    expect(rule).toEqual({
      type: "equals",
      equals: "admin",
    });
  });

  it("should create equals rule with number value", () => {
    const rule = equals(42);

    expect(rule).toEqual({
      type: "equals",
      equals: 42,
    });
  });

  it("should create equals rule with boolean value", () => {
    const rule = equals(true);

    expect(rule).toEqual({
      type: "equals",
      equals: true,
    });
  });

  it("should create equals rule with reference", () => {
    const reference = ref("confirmPassword");
    const rule = equals(reference);

    expect(rule).toEqual({
      type: "equals",
      equals: {
        _type: REFERENCE_TYPE,
        path: "confirmPassword",
      },
    });
  });

  it("should create equals rule with cross-field reference", () => {
    const rule = equals(ref("$.user.expectedRole"));

    expect(rule).toEqual({
      type: "equals",
      equals: {
        _type: REFERENCE_TYPE,
        path: "$.user.expectedRole",
      },
    });
  });

  it("should create equals rule with array value", () => {
    const rule = equals(["admin", "user"]);

    expect(rule).toEqual({
      type: "equals",
      equals: ["admin", "user"],
    });
  });
});
