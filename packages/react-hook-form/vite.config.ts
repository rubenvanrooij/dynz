/// <reference types="vitest" />
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.tsx"),
      formats: ["es", "cjs", "umd", "iife"],
      name: "REACT_HOOK_FORM_DYNZ",
    },
    rollupOptions: {
      // Add _all_ external dependencies here
      external: ["react", "react-dom", "react/jsx-runtime", "react", "react-hook-form", "dynz"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react-hook-form": "ReactHookForm",
          dynz: "DYNZ",
        },
      },
    },
  },
  plugins: [react({
    jsxRuntime: 'automatic'
  }), dts({ rollupTypes: true })],
});
