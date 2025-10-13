import { describe, expect, it } from "vitest";
import { ensureAbsolutePath } from "./path";

describe("ensureAbsolutePath", () => {
  describe("absolute path handling", () => {
    it("should return original path when it starts with $", () => {
      const fieldPath = "$.user.name";
      const currentPath = "$.form.fields";

      const result = ensureAbsolutePath(fieldPath, currentPath);

      expect(result).toBe("$.user.name");
    });

    it("should handle root absolute path", () => {
      const fieldPath = "$";
      const currentPath = "$.deeply.nested.path";

      const result = ensureAbsolutePath(fieldPath, currentPath);

      expect(result).toBe("$");
    });

    it("should handle complex absolute path", () => {
      const fieldPath = "$.data.users[0].profile.settings";
      const currentPath = "$.form.validation";

      const result = ensureAbsolutePath(fieldPath, currentPath);

      expect(result).toBe("$.data.users[0].profile.settings");
    });
  });

  describe("relative path handling", () => {
    it("should make relative path absolute using parent path", () => {
      const fieldPath = "confirmPassword";
      const currentPath = "$.user.password";

      const result = ensureAbsolutePath(fieldPath, currentPath);

      expect(result).toBe("$.user.confirmPassword");
    });

    it("should handle relative path from root", () => {
      const fieldPath = "username";
      const currentPath = "$";

      const result = ensureAbsolutePath(fieldPath, currentPath);

      expect(result).toBe("$.username");
    });

    it("should handle relative path from nested location", () => {
      const fieldPath = "street";
      const currentPath = "$.user.address.city";

      const result = ensureAbsolutePath(fieldPath, currentPath);

      expect(result).toBe("$.user.address.street");
    });

    it("should handle deeply nested relative path", () => {
      const fieldPath = "theme";
      const currentPath = "$.app.user.profile.settings.display";

      const result = ensureAbsolutePath(fieldPath, currentPath);

      expect(result).toBe("$.app.user.profile.settings.theme");
    });

    it("should handle relative path with complex field names", () => {
      const fieldPath = "max_length";
      const currentPath = "$.validation.rules.min_length";

      const result = ensureAbsolutePath(fieldPath, currentPath);

      expect(result).toBe("$.validation.rules.max_length");
    });
  });

  describe("edge cases", () => {
    it("should handle empty relative field path", () => {
      const fieldPath = "";
      const currentPath = "$.user.name";

      const result = ensureAbsolutePath(fieldPath, currentPath);

      expect(result).toBe("$.user.");
    });

    it("should handle single level path", () => {
      const fieldPath = "email";
      const currentPath = "$.name";

      const result = ensureAbsolutePath(fieldPath, currentPath);

      expect(result).toBe("$.email");
    });

    it("should handle path with array indices", () => {
      const fieldPath = "status";
      const currentPath = "$.users[0].tasks[1].title";

      const result = ensureAbsolutePath(fieldPath, currentPath);

      expect(result).toBe("$.users[0].tasks[1].status");
    });

    it("should handle path that already has dots", () => {
      const fieldPath = "nested.field";
      const currentPath = "$.parent.child";

      const result = ensureAbsolutePath(fieldPath, currentPath);

      expect(result).toBe("$.parent.nested.field");
    });
  });

  describe("parent path extraction", () => {
    it("should handle root path correctly", () => {
      const fieldPath = "field";
      const currentPath = "$";

      const result = ensureAbsolutePath(fieldPath, currentPath);

      expect(result).toBe("$.field");
    });

    it("should extract correct parent from deep path", () => {
      const fieldPath = "newField";
      const currentPath = "$.level1.level2.level3.level4.currentField";

      const result = ensureAbsolutePath(fieldPath, currentPath);

      expect(result).toBe("$.level1.level2.level3.level4.newField");
    });

    it("should handle path with multiple consecutive dots", () => {
      const fieldPath = "field";
      const currentPath = "$.parent..child";

      const result = ensureAbsolutePath(fieldPath, currentPath);

      expect(result).toBe("$.parent..field");
    });
  });

  describe("special characters", () => {
    it("should handle field paths with underscores", () => {
      const fieldPath = "user_id";
      const currentPath = "$.form.user_name";

      const result = ensureAbsolutePath(fieldPath, currentPath);

      expect(result).toBe("$.form.user_id");
    });

    it("should handle field paths with numbers", () => {
      const fieldPath = "field123";
      const currentPath = "$.section1.field456";

      const result = ensureAbsolutePath(fieldPath, currentPath);

      expect(result).toBe("$.section1.field123");
    });

    it("should handle field paths with hyphens", () => {
      const fieldPath = "first-name";
      const currentPath = "$.user.last-name";

      const result = ensureAbsolutePath(fieldPath, currentPath);

      expect(result).toBe("$.user.first-name");
    });
  });
});
