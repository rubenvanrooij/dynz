import { describe, expect, it } from "vitest";
import { v } from "../../functions";
import { REFERENCE_TYPE, ref } from "../../reference";
import { type FileSchema, file } from "../../schemas";
import type { Context } from "../../types";
import { mimeType, mimeTypeRule } from "./index";

describe("mimeType rule", () => {
  it("should create mimeType rule with string value", () => {
    const rule = mimeType(v("image/jpeg"));

    expect(rule).toEqual({
      type: "mime_type",
      mimeType: v("image/jpeg"),
    });
  });

  it("should create mimeType rule with array value", () => {
    const rule = mimeType(v(["image/jpeg", "image/png", "image/gif"]));

    expect(rule).toEqual({
      type: "mime_type",
      mimeType: v(["image/jpeg", "image/png", "image/gif"]),
    });
  });

  it("should create mimeType rule with reference", () => {
    const reference = ref("$.allowedMimeTypes");
    const rule = mimeType(reference);

    expect(rule).toEqual({
      type: "mime_type",
      mimeType: { type: REFERENCE_TYPE, path: "$.allowedMimeTypes" },
    });
  });

  it("should create mimeType rule with custom code", () => {
    const rule = mimeType(v("application/pdf"), "INVALID_FILE_TYPE");

    expect(rule).toEqual({
      type: "mime_type",
      mimeType: v("application/pdf"),
      code: "INVALID_FILE_TYPE",
    });
  });
});

describe("mimeTypeRule validator", () => {
  const mockContext = {} as unknown as Context<FileSchema>;
  const mockSchema = file();

  it("should return undefined when file type matches single allowed type", () => {
    const rule = mimeType(v("image/jpeg"));
    const mockFile = new File([""], "test.jpg", { type: "image/jpeg" });

    const result = mimeTypeRule({
      rule,
      value: mockFile,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should return undefined when file type matches one of multiple allowed types", () => {
    const rule = mimeType(v(["image/jpeg", "image/png"]));
    const mockFile = new File([""], "test.png", { type: "image/png" });

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
    const rule = mimeType(v("image/jpeg"));
    const mockFile = new File([""], "test.pdf", { type: "application/pdf" });

    const result = await mimeTypeRule({
      rule,
      value: mockFile,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("mime_type");
    expect(result?.message).toContain("testPath");
    expect(result?.message).toContain("is not equal to");
  });

  it("should return error when file type does not match any of multiple allowed types", async () => {
    const rule = mimeType(v(["image/jpeg", "image/png"]));
    const mockFile = new File([""], "test.txt", { type: "text/plain" });

    const result = await mimeTypeRule({
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

  it("should return undefined when resolved mimeType is undefined", () => {
    const rule = mimeType(undefined);
    const mockFile = new File([""], "test.pdf", { type: "application/pdf" });

    const result = mimeTypeRule({
      rule,
      value: mockFile,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should include correct error message format", async () => {
    const rule = mimeType(v("video/mp4"));
    const mockFile = new File([""], "test.mp3", { type: "audio/mp3" });

    const result = await mimeTypeRule({
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

  it("should handle document mime types correctly", () => {
    const rule = mimeType(v(["application/pdf", "application/msword"]));
    const mockFile = new File([""], "test.pdf", { type: "application/pdf" });

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
