import { defineConfig } from "tsdown";

export default defineConfig([
  {
    entry: ["./src/index.tsx"],
    clean: true,
    format: ["esm", "cjs"],
    external: ["react", "react-dom", "react/jsx-runtime", "react-hook-form"],
    minify: false,
    dts: true,
    outDir: "./dist",
  },
  {
    entry: ["./src/index.tsx"],
    clean: true,
    format: ["esm", "cjs"],
    external: ["react", "react-dom", "react/jsx-runtime", "react-hook-form"],
    minify: true,
    dts: false,
    outDir: "./dist",
    outExtensions: ({ format }) => ({
      js: format === "cjs" ? ".min.cjs" : ".min.js",
    }),
  },
]);
