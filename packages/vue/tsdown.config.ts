import { defineConfig } from "tsdown";

/** Internal, never published: bundled into this package, code and types. */
const BUNDLED = "@dynz/form-resources";

export default defineConfig([
  {
    entry: ["./src/index.ts"],
    clean: true,
    format: ["esm", "cjs"],
    external: ["vue", "vee-validate"],
    noExternal: [BUNDLED],
    minify: false,
    dts: { resolve: [BUNDLED] },
    outDir: "./dist",
  },
  {
    entry: ["./src/index.ts"],
    clean: true,
    format: ["esm", "cjs"],
    external: ["vue", "vee-validate"],
    noExternal: [BUNDLED],
    minify: true,
    dts: false,
    outDir: "./dist",
    outExtensions: ({ format }) => ({
      js: format === "cjs" ? ".min.cjs" : ".min.js",
    }),
  },
]);
