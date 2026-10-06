import { describe, expect, it } from "vitest";
import { isPrivateValue } from "./is-private";

describe("isPrivateValue", () => {
  it("should return false for non private values", () => {
    const tests = [
      null,
      undefined,
      42,
      "string",
      true,
      [],
      {},
      { state: "unknown", value: "test" },
      { state: "plain" },
      { value: "test" },
    ];

    tests.forEach((test) => {
      expect(isPrivateValue(test)).toBe(false);
    });
  });

  it("should return true for private values", () => {
    const tests = [
      {
        state: "plain",
        value: "foo",
      },
      {
        state: "masked",
        value: "foo",
      },
    ];

    tests.forEach((test) => {
      expect(isPrivateValue(test)).toBe(true);
    });
  });
});
