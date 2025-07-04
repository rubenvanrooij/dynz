import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
    },
    environment: "node",
    globals: true,
    typecheck: {
      enabled: true,
      include: ["**/*.test.ts"],
    },
  },
});
