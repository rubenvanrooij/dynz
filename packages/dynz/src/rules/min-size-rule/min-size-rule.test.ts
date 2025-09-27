import { beforeEach, describe, expect, it, vi } from "vitest";
import { REFERENCE_TYPE, ref, unpackRef } from "../../reference";
import { type FileSchema, file } from "../../schemas";
import type { Context } from "../../types";
import { minSize, minSizeRule } from "./index";

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

describe("minSize rule", () => {
  it("should create minSize rule with number value", () => {
    const rule = minSize(1024);

    expect(rule).toEqual({
      type: "min_size",
      min: 1024,
    });
  });

  it("should create minSize rule with reference", () => {
    const reference = ref("$.minFileSize");
    const rule = minSize(reference);

    expect(rule).toEqual({
      type: "min_size",
      min: {
        _type: REFERENCE_TYPE,
        path: "$.minFileSize",
      },
    });
  });

  it("should create minSize rule with custom code", () => {
    const rule = minSize(500, "CUSTOM_MIN_SIZE_ERROR");

    expect(rule).toEqual({
      type: "min_size",
      min: 500,
      code: "CUSTOM_MIN_SIZE_ERROR",
    });
  });
});

describe("minSizeRule validator", () => {
  const mockContext = {} as unknown as Context<FileSchema>;
  const mockSchema = file();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return undefined when file meets minimum size requirement", async () => {
    const rule = minSize(1024);
    const mockFile = { size: 2048 } as File;

    vi.mocked(unpackRef).mockReturnValue({ value: 1024 } as ReturnType<typeof unpackRef>);

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
    const rule = minSize(1024);
    const mockFile = { size: 512 } as File;

    vi.mocked(unpackRef).mockReturnValue({ value: 1024 } as ReturnType<typeof unpackRef>);

    const result = minSizeRule({
      rule,
      value: mockFile,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(unpackRef).toHaveBeenCalledTimes(1);
    expect(result).toBeDefined();
    expect(result?.code).toBe("min_size");
    expect(result?.message).toContain("testPath");
    expect(result?.message).toContain("should have at least a size of");
  });

  it("should return undefined when unpackRef returns undefined", async () => {
    const rule = minSize(1024);
    const mockFile = { size: 512 } as File;

    vi.mocked(unpackRef).mockReturnValue({ value: undefined } as ReturnType<typeof unpackRef>);

    const result = minSizeRule({
      rule,
      value: mockFile,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should handle reference objects correctly", async () => {
    const rule = minSize(ref("minSizeThreshold"));
    const mockFile = { size: 2048 } as File;

    vi.mocked(unpackRef).mockReturnValue({ value: 1500 } as ReturnType<typeof unpackRef>);

    const result = minSizeRule({
      rule,
      value: mockFile,
      path: "currentFile",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should include correct error message format", async () => {
    const rule = minSize(5000);
    const mockFile = { size: 1000 } as File;

    vi.mocked(unpackRef).mockReturnValue({ value: 5000 } as ReturnType<typeof unpackRef>);

    const result = minSizeRule({
      rule,
      value: mockFile,
      path: "$.uploadFile",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result?.message).toContain("$.uploadFile");
    expect(result?.message).toContain("should have at least a size of 5000");
    expect(result?.code).toBe("min_size");
  });

  it("should return undefined when file size equals minimum", async () => {
    const rule = minSize(1024);
    const mockFile = { size: 1024 } as File;

    vi.mocked(unpackRef).mockReturnValue({ value: 1024 } as ReturnType<typeof unpackRef>);

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
    const rule = minSize(1);
    const mockFile = { size: 0 } as File;

    vi.mocked(unpackRef).mockReturnValue({ value: 1 } as ReturnType<typeof unpackRef>);

    const result = minSizeRule({
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
