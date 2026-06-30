import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "MonitorSdk",
      formats: ["es", "cjs"],
      fileName: (format) => (format === "es" ? "index.js" : "index.cjs")
    },
    rollupOptions: {
      external: [
        "@monitor/core",
        "@monitor/plugin-error",
        "@monitor/plugin-resource",
        "@monitor/plugin-page",
        "@monitor/plugin-pv",
        "@monitor/plugin-metric",
        "@monitor/plugin-logan",
        "@monitor/plugin-horn",
        "@monitor/plugin-perf-fsp2",
        "@monitor/plugin-perf-ird",
        "@monitor/plugin-perf-shr",
        "@monitor/plugin-perf-cache"
      ]
    }
  }
});
