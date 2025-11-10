/// <reference types="vitest" />
import { resolve } from "node:path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      formats: ["es", "cjs", "umd", "iife"],
      name: "DYNZ",
    },
  },
  plugins: [dts({ rollupTypes: true })],
});
