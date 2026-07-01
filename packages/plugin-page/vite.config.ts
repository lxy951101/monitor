import { defineConfig } from "vite";

export default defineConfig({
 build: {
  lib: {
   entry: "src/index.ts",
   name: "MonitorPluginPage",
   formats: ["es", "cjs"],
   fileName: (format) => (format === "es" ? "index.js" : "index.cjs")
  },
  rollupOptions: {
   external: ["@monitor/core", "@monitor/protocol", "@monitor/transport"]
  }
 }
});
