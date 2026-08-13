import { describe, expect, it } from "vitest";
import {
  getByPath,
  isPathWithin,
  normalizeDependencyName,
  setByPath,
  toAbsolutePath,
  toFieldName,
  toPathSegments,
} from "./path";

describe("toPathSegments", () => {
  it("splits dot and bracket notation", () => {
    expect(toPathSegments("items[0].name")).toEqual(["items", "0", "name"]);
    expect(toPathSegments("address.zip")).toEqual(["address", "zip"]);
    expect(toPathSegments("")).toEqual([]);
  });
});

describe("toAbsolutePath", () => {
  it("prefixes field names", () => {
    expect(toAbsolutePath("address.zip")).toBe("$.address.zip");
    expect(toAbsolutePath("items[0].name")).toBe("$.items[0].name");
  });

  it("leaves absolute paths alone", () => {
    expect(toAbsolutePath("$.address.zip")).toBe("$.address.zip");
    expect(toAbsolutePath("$")).toBe("$");
    expect(toAbsolutePath("")).toBe("$");
  });
});

describe("toFieldName", () => {
  it("strips the root prefix", () => {
    expect(toFieldName("$.address.zip")).toBe("address.zip");
    expect(toFieldName("$.items[0].name")).toBe("items[0].name");
    // dynz spells array indices with a leading dot; field names drop it.
    expect(toFieldName("$.items.[0].name")).toBe("items[0].name");
    expect(toFieldName("$")).toBe("");
  });
});

describe("getByPath", () => {
  const values = { address: { zip: "1234" }, items: [{ name: "one" }, { name: "two" }] };

  it("reads nested and indexed paths", () => {
    expect(getByPath(values, "address.zip")).toBe("1234");
    expect(getByPath(values, "items[1].name")).toBe("two");
    expect(getByPath(values, "items.0.name")).toBe("one");
  });

  it("returns undefined for missing paths instead of throwing", () => {
    expect(getByPath(values, "address.city")).toBeUndefined();
    expect(getByPath(values, "nope.deeply.missing")).toBeUndefined();
    expect(getByPath(values, "address.zip.nope")).toBeUndefined();
  });
});

describe("setByPath", () => {
  it("writes nested values", () => {
    const values: Record<string, unknown> = { address: { zip: "1234" } };
    setByPath(values, "address.zip", "5678");

    expect(values).toEqual({ address: { zip: "5678" } });
  });

  it("creates missing objects", () => {
    const values: Record<string, unknown> = {};
    setByPath(values, "address.zip", "1234");

    expect(values).toEqual({ address: { zip: "1234" } });
  });

  it("creates arrays for numeric segments", () => {
    const values: Record<string, unknown> = {};
    setByPath(values, "items[0].name", "one");

    expect(values).toEqual({ items: [{ name: "one" }] });
    expect(Array.isArray(values.items)).toBe(true);
  });

  it("ignores an empty path", () => {
    const values: Record<string, unknown> = { a: 1 };
    setByPath(values, "", "x");

    expect(values).toEqual({ a: 1 });
  });
});

describe("isPathWithin", () => {
  it("matches the field itself and everything nested under it", () => {
    expect(isPathWithin("items", "items")).toBe(true);
    expect(isPathWithin("items[0].name", "items")).toBe(true);
    expect(isPathWithin("address.zip", "address")).toBe(true);
    expect(isPathWithin("addressLine", "address")).toBe(false);
    expect(isPathWithin("other", "items")).toBe(false);
  });
});

describe("normalizeDependencyName", () => {
  it("maps array member notation onto the array", () => {
    expect(normalizeDependencyName(toFieldName("$.items.[]"))).toBe("items");
    expect(normalizeDependencyName("items")).toBe("items");
  });
});
