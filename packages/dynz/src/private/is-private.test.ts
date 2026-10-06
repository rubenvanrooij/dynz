import { describe, expect, it } from "vitest";
import { isPrivateValue, isPivateValue } from "./is-private";

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

describe("isPivateValue (deprecated)", () => {
  it("should return false for non private values, using the old api with typo", () => {
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
      expect(isPivateValue(test)).toBe(false);
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
