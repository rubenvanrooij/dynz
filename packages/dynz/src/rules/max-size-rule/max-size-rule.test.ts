import { beforeEach, describe, expect, it, vi } from "vitest";
import { REFERENCE_TYPE, ref, unpackRef } from "../../reference";
import { type FileSchema, file } from "../../schemas";
import type { Context } from "../../types";
import { maxSize, maxSizeRule } from "./index";

vi.mock("../../reference", () => {
  return {
    ref: (path: string) => ({
      _type: REFERENCE_TYPE,
      path: path,
    }),
    REFERENCE_TYPE: "MOCKED_REFERENCE_TYPE",
    unpackRef: vi.fn(),
  };
});

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

describe("maxSizeRule validator", () => {
  const mockContext = {} as unknown as Context<FileSchema>;
  const mockSchema = file();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return undefined when file is smaller than maximum size", async () => {
    const rule = maxSize(2048);
    const mockFile = { size: 1024 } as File;

    vi.mocked(unpackRef).mockReturnValue({ value: 2048 } as ReturnType<typeof unpackRef>);

    const result = maxSizeRule({
      rule,
      value: mockFile,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should return undefined when file size equals maximum size", async () => {
    const rule = maxSize(1024);
    const mockFile = { size: 1024 } as File;

    vi.mocked(unpackRef).mockReturnValue({ value: 1024 } as ReturnType<typeof unpackRef>);

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
    const rule = maxSize(1024);
    const mockFile = { size: 2048 } as File;

    vi.mocked(unpackRef).mockReturnValue({ value: 1024 } as ReturnType<typeof unpackRef>);

    const result = maxSizeRule({
      rule,
      value: mockFile,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(unpackRef).toHaveBeenCalledTimes(1);
    expect(result).toBeDefined();
    expect(result?.code).toBe("max_size");
    expect(result?.message).toContain("testPath");
    expect(result?.message).toContain("should have a maximum size of 1024");
    expect(result?.max).toBe(1024);
  });

  it("should return undefined when unpackRef returns undefined", async () => {
    const rule = maxSize(1024);
    const mockFile = { size: 2048 } as File;

    vi.mocked(unpackRef).mockReturnValue({ value: undefined } as ReturnType<typeof unpackRef>);

    const result = maxSizeRule({
      rule,
      value: mockFile,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should handle reference objects correctly", async () => {
    const rule = maxSize(ref("maxSizeThreshold"));
    const mockFile = { size: 1500 } as File;

    vi.mocked(unpackRef).mockReturnValue({ value: 2048 } as ReturnType<typeof unpackRef>);

    const result = maxSizeRule({
      rule,
      value: mockFile,
      path: "currentFile",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should include correct error message format", async () => {
    const rule = maxSize(500);
    const mockFile = { size: 1000 } as File;

    vi.mocked(unpackRef).mockReturnValue({ value: 500 } as ReturnType<typeof unpackRef>);

    const result = maxSizeRule({
      rule,
      value: mockFile,
      path: "$.uploadFile",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result?.message).toContain("$.uploadFile");
    expect(result?.message).toContain("should have a maximum size of 500");
    expect(result?.code).toBe("max_size");
    expect(result?.max).toBe(500);
  });

  it("should handle zero size file correctly", async () => {
    const rule = maxSize(1024);
    const mockFile = { size: 0 } as File;

    vi.mocked(unpackRef).mockReturnValue({ value: 1024 } as ReturnType<typeof unpackRef>);

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
    const rule = maxSize(0);
    const mockFile = { size: 1 } as File;

    vi.mocked(unpackRef).mockReturnValue({ value: 0 } as ReturnType<typeof unpackRef>);

    const result = maxSizeRule({
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

  it("should return undefined when zero file size and zero maximum", async () => {
    const rule = maxSize(0);
    const mockFile = { size: 0 } as File;

    vi.mocked(unpackRef).mockReturnValue({ value: 0 } as ReturnType<typeof unpackRef>);

    const result = maxSizeRule({
      rule,
      value: mockFile,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should handle large file sizes correctly", async () => {
    const rule = maxSize(10485760); // 10MB
    const mockFile = { size: 5242880 } as File; // 5MB

    vi.mocked(unpackRef).mockReturnValue({ value: 10485760 } as ReturnType<typeof unpackRef>);

    const result = maxSizeRule({
      rule,
      value: mockFile,
      path: "largeFile",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should handle very large file that exceeds limit", async () => {
    const rule = maxSize(1048576); // 1MB
    const mockFile = { size: 10485760 } as File; // 10MB

    vi.mocked(unpackRef).mockReturnValue({ value: 1048576 } as ReturnType<typeof unpackRef>);

    const result = maxSizeRule({
      rule,
      value: mockFile,
      path: "oversizedFile",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("max_size");
    expect(result?.max).toBe(1048576);
  });

  it("should handle edge case with exactly one byte over limit", async () => {
    const rule = maxSize(1024);
    const mockFile = { size: 1025 } as File;

    vi.mocked(unpackRef).mockReturnValue({ value: 1024 } as ReturnType<typeof unpackRef>);

    const result = maxSizeRule({
      rule,
      value: mockFile,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("max_size");
  });

  it("should handle reference resolution with dynamic file size limits", async () => {
    const rule = maxSize(ref("$.settings.maxUploadSize"));
    const mockFile = { size: 2048 } as File;

    vi.mocked(unpackRef).mockReturnValue({ value: 4096 } as ReturnType<typeof unpackRef>);

    const result = maxSizeRule({
      rule,
      value: mockFile,
      path: "dynamicUpload",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });
});
