import { beforeEach, describe, expect, it, vi } from "vitest";
import { REFERENCE_TYPE, ref, unpackRef } from "../../reference";
import { type FileSchema, file } from "../../schemas";
import type { Context } from "../../types";
import { mimeType, mimeTypeRule } from "./index";

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

describe("mimeType rule", () => {
  it("should create mimeType rule with string value", () => {
    const rule = mimeType("image/jpeg");

    expect(rule).toEqual({
      type: "mime_type",
      mimeType: "image/jpeg",
    });
  });

  it("should create mimeType rule with array value", () => {
    const rule = mimeType(["image/jpeg", "image/png", "image/gif"]);

    expect(rule).toEqual({
      type: "mime_type",
      mimeType: ["image/jpeg", "image/png", "image/gif"],
    });
  });

  it("should create mimeType rule with reference", () => {
    const reference = ref("$.allowedMimeTypes");
    const rule = mimeType(reference);

    expect(rule).toEqual({
      type: "mime_type",
      mimeType: {
        _type: REFERENCE_TYPE,
        path: "$.allowedMimeTypes",
      },
    });
  });

  it("should create mimeType rule with custom code", () => {
    const rule = mimeType("application/pdf", "INVALID_FILE_TYPE");

    expect(rule).toEqual({
      type: "mime_type",
      mimeType: "application/pdf",
      code: "INVALID_FILE_TYPE",
    });
  });
});

describe("mimeTypeRule validator", () => {
  const mockContext = {} as unknown as Context<FileSchema>;
  const mockSchema = file();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return undefined when file type matches single allowed type", async () => {
    const rule = mimeType("image/jpeg");
    const mockFile = { type: "image/jpeg" } as File;

    vi.mocked(unpackRef).mockReturnValue({ value: "image/jpeg" } as ReturnType<typeof unpackRef>);

    const result = mimeTypeRule({
      rule,
      value: mockFile,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should return undefined when file type matches one of multiple allowed types", async () => {
    const rule = mimeType(["image/jpeg", "image/png"]);
    const mockFile = { type: "image/png" } as File;

    vi.mocked(unpackRef).mockReturnValue({ value: ["image/jpeg", "image/png"] } as ReturnType<typeof unpackRef>);

    const result = mimeTypeRule({
      rule,
      value: mockFile,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should return error when file type does not match allowed type", async () => {
    const rule = mimeType("image/jpeg");
    const mockFile = { type: "application/pdf" } as File;

    vi.mocked(unpackRef).mockReturnValue({ value: "image/jpeg" } as ReturnType<typeof unpackRef>);

    const result = mimeTypeRule({
      rule,
      value: mockFile,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(unpackRef).toHaveBeenCalledTimes(1);
    expect(result).toBeDefined();
    expect(result?.code).toBe("mime_type");
    expect(result?.message).toContain("testPath");
    expect(result?.message).toContain("is not equal to");
  });

  it("should return error when file type does not match any of multiple allowed types", async () => {
    const rule = mimeType(["image/jpeg", "image/png"]);
    const mockFile = { type: "text/plain" } as File;

    vi.mocked(unpackRef).mockReturnValue({ value: ["image/jpeg", "image/png"] } as ReturnType<typeof unpackRef>);

    const result = mimeTypeRule({
      rule,
      value: mockFile,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("mime_type");
    expect(result?.message).toContain("text/plain");
  });

  it("should return undefined when unpackRef returns undefined", async () => {
    const rule = mimeType("image/jpeg");
    const mockFile = { type: "application/pdf" } as File;

    vi.mocked(unpackRef).mockReturnValue({ value: undefined } as ReturnType<typeof unpackRef>);

    const result = mimeTypeRule({
      rule,
      value: mockFile,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should handle reference objects correctly", async () => {
    const rule = mimeType(ref("allowedTypes"));
    const mockFile = { type: "application/json" } as File;

    vi.mocked(unpackRef).mockReturnValue({ value: ["application/json", "text/xml"] } as ReturnType<typeof unpackRef>);

    const result = mimeTypeRule({
      rule,
      value: mockFile,
      path: "dataFile",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should include correct error message format", async () => {
    const rule = mimeType("video/mp4");
    const mockFile = { type: "audio/mp3" } as File;

    vi.mocked(unpackRef).mockReturnValue({ value: "video/mp4" } as ReturnType<typeof unpackRef>);

    const result = mimeTypeRule({
      rule,
      value: mockFile,
      path: "$.mediaFile",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result?.message).toContain("$.mediaFile");
    expect(result?.message).toContain("audio/mp3");
    expect(result?.message).toContain("is not equal to video/mp4");
    expect(result?.code).toBe("mime_type");
  });

  it("should handle document mime types correctly", async () => {
    const rule = mimeType(["application/pdf", "application/msword"]);
    const mockFile = { type: "application/pdf" } as File;

    vi.mocked(unpackRef).mockReturnValue({ value: ["application/pdf", "application/msword"] } as ReturnType<
      typeof unpackRef
    >);

    const result = mimeTypeRule({
      rule,
      value: mockFile,
      path: "documentFile",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });
});
