import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "MonitorSdk",
      formats: ["es", "cjs", "iife"],
      fileName: (format) => {
        if (format === "es") {
          return "index.js";
        }
        return format === "cjs" ? "index.cjs" : "index.iife.js";
      }
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
        "@monitor/plugin-perf-cache",
        "@monitor/transport"
      ],
      output: {
        globals: {
          "@monitor/core": "MonitorCore",
          "@monitor/plugin-error": "MonitorPluginError",
          "@monitor/plugin-resource": "MonitorPluginResource",
          "@monitor/plugin-page": "MonitorPluginPage",
          "@monitor/plugin-pv": "MonitorPluginPv",
          "@monitor/plugin-metric": "MonitorPluginMetric",
          "@monitor/plugin-logan": "MonitorPluginLogan",
          "@monitor/plugin-horn": "MonitorPluginHorn",
          "@monitor/plugin-perf-fsp2": "MonitorPluginPerfFsp2",
          "@monitor/plugin-perf-ird": "MonitorPluginPerfIrd",
          "@monitor/plugin-perf-shr": "MonitorPluginPerfShr",
          "@monitor/plugin-perf-cache": "MonitorPluginPerfCache",
          "@monitor/transport": "MonitorTransport"
        }
      }
    }
  }
});
