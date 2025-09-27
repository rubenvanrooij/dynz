import { describe, expect, it } from "vitest";
import { REFERENCE_TYPE, ref } from "../../reference";
import { maxSize } from "./index";

describe("maxSize rule", () => {
  it("should create maxSize rule with number value", () => {
    const rule = maxSize(1024);

    expect(rule).toEqual({
      type: "max_size",
      max: 1024,
    });
  });

  it("should create maxSize rule with reference", () => {
    const rule = maxSize(ref("maxFileSize"));

    expect(rule).toEqual({
      type: "max_size",
      max: {
        _type: REFERENCE_TYPE,
        path: "maxFileSize",
      },
    });
  });

  it("should create maxSize rule with custom error code", () => {
    const rule = maxSize(2048, "FILE_TOO_LARGE");

    expect(rule).toEqual({
      type: "max_size",
      max: 2048,
      code: "FILE_TOO_LARGE",
    });
  });

  it("should create maxSize rule with large file size", () => {
    const rule = maxSize(10485760); // 10MB

    expect(rule).toEqual({
      type: "max_size",
      max: 10485760,
    });
  });

  it("should create maxSize rule with zero size", () => {
    const rule = maxSize(0);

    expect(rule).toEqual({
      type: "max_size",
      max: 0,
    });
  });
});
