import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "../../types";
import { SchemaType } from "../../types";
import { validateFile } from "./validators";
import { file } from "./builder";
import { minSize, maxSize, mimeType, custom } from "../../rules";

// Mock the rules
vi.mock("../../rules", () => ({
  minSizeRule: vi.fn(),
  maxSizeRule: vi.fn(),
  mimeTypeRule: vi.fn(),
  customRule: vi.fn(),
  minSize: vi.fn(),
  maxSize: vi.fn(),
  mimeType: vi.fn(),
  custom: vi.fn(),
}));

import { minSizeRule, maxSizeRule, mimeTypeRule, customRule } from "../../rules";

describe("validateFile", () => {
  const mockSchema = file();
  const mockContext = {} as unknown as Context<typeof mockSchema>;
  const mockFile = new File(["content"], "test.txt");

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should delegate to minSizeRule for min_size validation", () => {
    const rule = minSize(100);
    const contextObj = {
      type: SchemaType.FILE,
      ruleType: "min_size" as const,
      rule,
      schema: mockSchema,
      path: "$.document",
      value: mockFile,
      context: mockContext,
    };

    vi.mocked(minSizeRule).mockReturnValue(undefined);
    const result = validateFile(contextObj);
    expect(minSizeRule).toHaveBeenCalledWith(contextObj);
    expect(result).toBeUndefined();
  });

  it("should delegate to maxSizeRule for max_size validation", () => {
    const rule = maxSize(1024);
    const contextObj = {
      type: SchemaType.FILE,
      ruleType: "max_size" as const,
      rule,
      schema: mockSchema,
      path: "$.document",
      value: mockFile,
      context: mockContext,
    };

    vi.mocked(maxSizeRule).mockReturnValue(undefined);
    const result = validateFile(contextObj);
    expect(maxSizeRule).toHaveBeenCalledWith(contextObj);
    expect(result).toBeUndefined();
  });

  it("should delegate to mimeTypeRule for mime_type validation", () => {
    const rule = mimeType(["image/jpeg", "image/png"]);
    const contextObj = {
      type: SchemaType.FILE,
      ruleType: "mime_type" as const,
      rule,
      schema: mockSchema,
      path: "$.document",
      value: mockFile,
      context: mockContext,
    };

    vi.mocked(mimeTypeRule).mockReturnValue(undefined);
    const result = validateFile(contextObj);
    expect(mimeTypeRule).toHaveBeenCalledWith(contextObj);
    expect(result).toBeUndefined();
  });

  it("should delegate to customRule for custom validation", () => {
    const rule = custom("testRule");
    const contextObj = {
      type: SchemaType.FILE,
      ruleType: "custom" as const,
      rule,
      schema: mockSchema,
      path: "$.document",
      value: mockFile,
      context: mockContext,
    };

    vi.mocked(customRule).mockReturnValue(undefined);
    const result = validateFile(contextObj);
    expect(customRule).toHaveBeenCalledWith(contextObj);
    expect(result).toBeUndefined();
  });
});
