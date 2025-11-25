import { describe, expect, it } from "vitest";
import { mask, plain } from "./builder";
import { getPrivateData } from "./get-private-data";

describe("getPrivateData", () => {
  it("should return plain private value for valid plain input", () => {
    const plainValue = plain("secret");
    const result = getPrivateData(plainValue);

    expect(result).toEqual({
      state: "plain",
      value: "secret",
    });
  });

  it("should return masked private value for valid masked input", () => {
    const maskedValue = mask();
    const result = getPrivateData(maskedValue);

    expect(result).toEqual({
      state: "masked",
      value: "***",
    });
  });

  it("should return masked private value with custom mask", () => {
    const maskedValue = mask("secret", () => "HIDDEN");
    const result = getPrivateData(maskedValue);

    expect(result).toEqual({
      state: "masked",
      value: "HIDDEN",
    });
  });

  it("should handle plain private value with undefined", () => {
    const plainValue = plain(undefined);
    const result = getPrivateData(plainValue);

    expect(result).toEqual({
      state: "plain",
      value: undefined,
    });
  });

  it("should throw error for undefined input", () => {
    expect(() => {
      getPrivateData(undefined);
    }).toThrow(
      "'undefined' was passed where a private value was expected; if a private value is not required it must still adhere to the following structure: { type: 'masked' | 'plain', value: undefined }. This is the only way that tracking changes is possible"
    );
  });

  it("should throw error for non-object input", () => {
    expect(() => {
      getPrivateData("not an object");
    }).toThrow("value does not represent a masked value: not an object");
  });

  it("should throw error for object without proper state", () => {
    expect(() => {
      getPrivateData({ state: "invalid", value: "test" });
    }).toThrow("value does not represent a masked value: [object Object]");
  });

  it("should throw error for null input", () => {
    expect(() => {
      getPrivateData(null);
    }).toThrow("value does not represent a masked value: null");
  });

  it("should throw error for object missing state property", () => {
    expect(() => {
      getPrivateData({ value: "test" });
    }).toThrow("value does not represent a masked value: [object Object]");
  });

  it("should handle complex plain values", () => {
    const complexValue = "complex-string-value";
    const plainValue = plain(complexValue);
    const result = getPrivateData(plainValue);

    expect(result).toEqual({
      state: "plain",
      value: complexValue,
    });
  });

  it("should throw error for masked value with non-string mask", () => {
    expect(() => {
      getPrivateData({ state: "masked", value: 123 });
    }).toThrow('Private value with state "masked" must have a string as value');
  });
});
