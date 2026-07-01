import { defineConfig } from "vitest/config";

export default defineConfig({
 resolve: {
  alias: {
   "@monitor/config": new URL("../config/src/index.ts", import.meta.url).pathname,
   "@monitor/core": new URL("../core/src/index.ts", import.meta.url).pathname,
   "@monitor/plugin-perf-cache": new URL("../plugin-perf-cache/src/index.ts", import.meta.url).pathname,
   "@monitor/protocol": new URL("../protocol/src/index.ts", import.meta.url).pathname,
   "@monitor/transport": new URL("../transport/src/index.ts", import.meta.url).pathname
  }
 },
 test: {
  environment: "node",
  passWithNoTests: true
 }
});
