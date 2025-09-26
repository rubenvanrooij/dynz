import { describe, expect, it } from "vitest";
import { regex } from "./index";

describe("regex rule", () => {
  it("should create regex rule for email validation", () => {
    const rule = regex("^[^@]+@[^@]+\\.[^@]+$");

    expect(rule).toEqual({
      type: "regex",
      regex: "^[^@]+@[^@]+\\.[^@]+$",
    });
  });

  it("should create regex rule for phone number validation", () => {
    const rule = regex("^\\+?[1-9]\\d{1,14}$");

    expect(rule).toEqual({
      type: "regex",
      regex: "^\\+?[1-9]\\d{1,14}$",
    });
  });

  it("should create regex rule for alphanumeric validation", () => {
    const rule = regex("^[a-zA-Z0-9]+$");

    expect(rule).toEqual({
      type: "regex",
      regex: "^[a-zA-Z0-9]+$",
    });
  });

  it("should create regex rule for URL validation", () => {
    const urlPattern =
      "^https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)$";
    const rule = regex(urlPattern);

    expect(rule).toEqual({
      type: "regex",
      regex: urlPattern,
    });
  });

  it("should create regex rule for password strength", () => {
    const passwordPattern = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$";
    const rule = regex(passwordPattern);

    expect(rule).toEqual({
      type: "regex",
      regex: passwordPattern,
    });
  });

  it("should handle simple patterns", () => {
    const rule = regex("[0-9]+");

    expect(rule).toEqual({
      type: "regex",
      regex: "[0-9]+",
    });
  });
});
