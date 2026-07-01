import { defineConfig } from "vite";

export default defineConfig({
 build: {
  lib: {
   entry: "src/index.ts",
   name: "MonitorCore",
   formats: ["es", "cjs"],
   fileName: (format) => (format === "es" ? "index.js" : "index.cjs")
  },
  rollupOptions: {
   external: ["@monitor/config", "@monitor/protocol", "@monitor/transport"]
  }
 }
});
