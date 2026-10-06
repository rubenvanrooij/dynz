import { describe, expect, it } from "vitest";
import { isEqualValue } from "./is-equal-value";

const d = (iso: string) => new Date(iso);

describe("isEqualValue", () => {
  it("compares dates by instant", () => {
    expect(isEqualValue(d("2026-03-01T00:00:00Z"), d("2026-03-01T00:00:00Z"))).toBe(true);
    expect(isEqualValue(d("2026-03-01T00:00:00Z"), d("2026-03-01T00:00:01Z"))).toBe(false);
  });

  it("compares a date with its ISO string (e.g. after serialize())", () => {
    expect(isEqualValue(d("2026-03-01T00:00:00Z"), "2026-03-01T00:00:00.000Z")).toBe(true);
    expect(isEqualValue(d("2026-03-01T00:00:00Z"), undefined)).toBe(false);
  });

  it("compares other values by identity", () => {
    expect(isEqualValue("a", "a")).toBe(true);
    expect(isEqualValue(1, "1")).toBe(false);
    expect(isEqualValue(undefined, undefined)).toBe(true);
  });
});
