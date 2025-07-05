import { defineProject, mergeConfig } from "vitest/config";
import rootConfig from "../../vitest.config.ts";

export default mergeConfig(
  rootConfig,
  defineProject({
    test: {
      typecheck: {
        tsconfig: "./tsconfig.test.json",
      },
    },
  })
) as object;