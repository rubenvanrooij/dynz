import { fileURLToPath } from "node:url";
import { defineProject, mergeConfig } from "vitest/config";
import rootConfig from "../../vitest.config.ts";

export default mergeConfig(
  rootConfig,
  defineProject({
    resolve: {
      // test against the cache's source, not its build: no stale `dist` after a change
      alias: {
        "@dynz/form-resources": fileURLToPath(new URL("../form-resources/src/index.ts", import.meta.url)),
      },
    },
    test: {
      // DynzField/useDynzField tests mount real components, so a DOM is required.
      environment: "happy-dom",
      typecheck: {
        tsconfig: "./tsconfig.json",
      },
    },
  })
) as object;
