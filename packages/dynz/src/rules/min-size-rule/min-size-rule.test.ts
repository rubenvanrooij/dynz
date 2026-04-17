import { describe, expect, it } from "vitest";
import { v } from "../../functions";
import { REFERENCE_TYPE, ref } from "../../reference";
import { type FileSchema, file } from "../../schemas";
import type { Context } from "../../types";
import { buildMinSizeRule, minSizeRule } from "./index";

function createFile(sizeInBytes: number, type = "application/octet-stream"): File {
  return new File(["a".repeat(sizeInBytes)], "test.bin", { type });
}

describe("minSize rule", () => {
  it("should create minSize rule with number value", () => {
    const rule = buildMinSizeRule(v(1024));

    expect(rule).toEqual({
      type: "min_size",
      min: v(1024),
    });
  });

  it("should create minSize rule with reference", () => {
    const reference = ref("$.minFileSize");
    const rule = buildMinSizeRule(reference);

    expect(rule).toEqual({
      type: "min_size",
      min: { type: REFERENCE_TYPE, path: "$.minFileSize" },
    });
  });

  it("should create minSize rule with custom code", () => {
    const rule = buildMinSizeRule(v(500), "CUSTOM_MIN_SIZE_ERROR");

    expect(rule).toEqual({
      type: "min_size",
      min: v(500),
      code: "CUSTOM_MIN_SIZE_ERROR",
    });
  });
});

describe("minSizeRule validator", () => {
  const mockContext = {} as unknown as Context<FileSchema>;
  const mockSchema = file();

  it("should return undefined when file meets minimum size requirement", () => {
    const rule = buildMinSizeRule(v(100));
    const mockFile = createFile(200);

    const result = minSizeRule({
      rule,
      value: mockFile,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should return error when file is below minimum size", async () => {
    const rule = buildMinSizeRule(v(200));
    const mockFile = createFile(100);

    const result = await minSizeRule({
      rule,
      value: mockFile,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("min_size");
    expect(result?.message).toContain("testPath");
    expect(result?.message).toContain("should have at least a size of");
  });

  it("should return undefined when resolved min is undefined", () => {
    const rule = buildMinSizeRule(undefined);
    const mockFile = createFile(100);

    const result = minSizeRule({
      rule,
      value: mockFile,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should include correct error message format", async () => {
    const rule = buildMinSizeRule(v(500));
    const mockFile = createFile(100);

    const result = await minSizeRule({
      rule,
      value: mockFile,
      path: "$.uploadFile",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result?.message).toContain("$.uploadFile");
    expect(result?.message).toContain("should have at least a size of 500");
    expect(result?.code).toBe("min_size");
  });

  it("should return undefined when file size equals minimum", () => {
    const rule = buildMinSizeRule(v(100));
    const mockFile = createFile(100);

    const result = minSizeRule({
      rule,
      value: mockFile,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should handle zero size file correctly", async () => {
    const rule = buildMinSizeRule(v(1));
    const mockFile = createFile(0);

    const result = await minSizeRule({
      rule,
      value: mockFile,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("min_size");
  });
});
