import { describe, expect, it } from "vitest";
import { getByPath, toAbsolutePath, toFieldName, toPathSegments } from "./path";

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
