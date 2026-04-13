import { describe, expect, it } from "vitest";
import { v } from "../../functions";
import { REFERENCE_TYPE, ref } from "../../reference";
import { type FileSchema, file } from "../../schemas";
import type { Context } from "../../types";
import { maxSize, maxSizeRule } from "./index";

function createFile(sizeInBytes: number, type = "application/octet-stream"): File {
  return new File(["a".repeat(sizeInBytes)], "test.bin", { type });
}

describe("maxSize rule", () => {
  it("should create maxSize rule with number value", () => {
    const rule = maxSize(v(1024));

    expect(rule).toEqual({
      type: "max_size",
      max: v(1024),
    });
  });

  it("should create maxSize rule with reference", () => {
    const rule = maxSize(ref("maxFileSize"));

    expect(rule).toEqual({
      type: "max_size",
      max: { type: REFERENCE_TYPE, path: "maxFileSize" },
    });
  });

  it("should create maxSize rule with custom error code", () => {
    const rule = maxSize(v(2048), "FILE_TOO_LARGE");

    expect(rule).toEqual({
      type: "max_size",
      max: v(2048),
      code: "FILE_TOO_LARGE",
    });
  });

  it("should create maxSize rule with large file size", () => {
    const rule = maxSize(v(10000)); // large limit

    expect(rule).toEqual({
      type: "max_size",
      max: v(10000),
    });
  });

  it("should create maxSize rule with zero size", () => {
    const rule = maxSize(v(0));

    expect(rule).toEqual({
      type: "max_size",
      max: v(0),
    });
  });
});

describe("maxSizeRule validator", () => {
  const mockContext = {} as unknown as Context<FileSchema>;
  const mockSchema = file();

  it("should return undefined when file is smaller than maximum size", () => {
    const rule = maxSize(v(200));
    const mockFile = createFile(100);

    const result = maxSizeRule({
      rule,
      value: mockFile,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should return undefined when file size equals maximum size", () => {
    const rule = maxSize(v(100));
    const mockFile = createFile(100);

    const result = maxSizeRule({
      rule,
      value: mockFile,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should return error when file exceeds maximum size", async () => {
    const rule = maxSize(v(100));
    const mockFile = createFile(200);

    const result = await maxSizeRule({
      rule,
      value: mockFile,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("max_size");
    expect(result?.message).toContain("testPath");
    expect(result?.message).toContain("should have a maximum size of 100");
    expect(result?.max).toBe(100);
  });

  it("should return undefined when resolved max is undefined", () => {
    const rule = maxSize(undefined);
    const mockFile = createFile(200);

    const result = maxSizeRule({
      rule,
      value: mockFile,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should include correct error message format", async () => {
    const rule = maxSize(v(50));
    const mockFile = createFile(100);

    const result = await maxSizeRule({
      rule,
      value: mockFile,
      path: "$.uploadFile",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result?.message).toContain("$.uploadFile");
    expect(result?.message).toContain("should have a maximum size of 50");
    expect(result?.code).toBe("max_size");
    expect(result?.max).toBe(50);
  });

  it("should handle zero size file correctly", () => {
    const rule = maxSize(v(100));
    const mockFile = createFile(0);

    const result = maxSizeRule({
      rule,
      value: mockFile,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should handle zero maximum size correctly", async () => {
    const rule = maxSize(v(0));
    const mockFile = createFile(1);

    const result = await maxSizeRule({
      rule,
      value: mockFile,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("max_size");
    expect(result?.message).toContain("should have a maximum size of 0");
  });

  it("should return undefined when zero file size and zero maximum", () => {
    const rule = maxSize(v(0));
    const mockFile = createFile(0);

    const result = maxSizeRule({
      rule,
      value: mockFile,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should handle larger file vs smaller limit", () => {
    const rule = maxSize(v(500));
    const mockFile = createFile(250);

    const result = maxSizeRule({
      rule,
      value: mockFile,
      path: "largeFile",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should handle file that exceeds limit", async () => {
    const rule = maxSize(v(100));
    const mockFile = createFile(1000);

    const result = await maxSizeRule({
      rule,
      value: mockFile,
      path: "oversizedFile",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("max_size");
    expect(result?.max).toBe(100);
  });

  it("should handle edge case with exactly one byte over limit", async () => {
    const rule = maxSize(v(100));
    const mockFile = createFile(101);

    const result = await maxSizeRule({
      rule,
      value: mockFile,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("max_size");
  });
});
