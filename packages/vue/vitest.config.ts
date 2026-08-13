import { defineProject, mergeConfig } from "vitest/config";
import rootConfig from "../../vitest.config.ts";

export default mergeConfig(
  rootConfig,
  defineProject({
    test: {
      // Component tests mount real components, so a DOM is required.
      environment: "happy-dom",
      typecheck: {
        tsconfig: "./tsconfig.json",
      },
    },
  })
) as object;
