import { describe, expect, it } from "vitest";
import { string } from "../schemas";
import { isValueMasked } from "./is-value-masked";

describe("isValueMasked", () => {
  it("should return false for non private schemas", () => {
    expect(
      isValueMasked(
        string({
          private: false,
        }),
        {}
      )
    ).toBe(false);
  });

  it("should return false for non masked values", () => {
    expect(
      isValueMasked(
        string({
          private: true,
        }),
        {
          state: "plain",
          value: "foo",
        }
      )
    ).toBe(false);
  });

  it("should return true for masked values", () => {
    expect(
      isValueMasked(
        string({
          private: true,
        }),
        {
          state: "masked",
          value: "foo",
        }
      )
    ).toBe(true);
  });
});
