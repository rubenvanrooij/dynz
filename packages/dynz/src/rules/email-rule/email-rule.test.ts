import { describe, expect, it } from "vitest";
import { email } from "./index";

describe("email rule", () => {
  it("should create email rule", () => {
    const rule = email();

    expect(rule).toEqual({
      type: "email",
    });
  });
});
