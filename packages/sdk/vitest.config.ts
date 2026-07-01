import { defineConfig } from "vitest/config";

export default defineConfig({
 resolve: {
  alias: {
   "@monitor/config": new URL("../config/src/index.ts", import.meta.url).pathname,
   "@monitor/core": new URL("../core/src/index.ts", import.meta.url).pathname,
   "@monitor/plugin-error": new URL("../plugin-error/src/index.ts", import.meta.url).pathname,
   "@monitor/plugin-metric": new URL("../plugin-metric/src/index.ts", import.meta.url).pathname,
   "@monitor/plugin-page": new URL("../plugin-page/src/index.ts", import.meta.url).pathname,
   "@monitor/plugin-perf-cache": new URL("../plugin-perf-cache/src/index.ts", import.meta.url).pathname,
   "@monitor/plugin-perf-fsp": new URL("../plugin-perf-fsp/src/index.ts", import.meta.url).pathname,
   "@monitor/plugin-perf-ird": new URL("../plugin-perf-ird/src/index.ts", import.meta.url).pathname,
   "@monitor/plugin-perf-shr": new URL("../plugin-perf-shr/src/index.ts", import.meta.url).pathname,
   "@monitor/plugin-pv": new URL("../plugin-pv/src/index.ts", import.meta.url).pathname,
   "@monitor/plugin-resource": new URL("../plugin-resource/src/index.ts", import.meta.url).pathname,
   "@monitor/protocol": new URL("../protocol/src/index.ts", import.meta.url).pathname,
   "@monitor/transport": new URL("../transport/src/index.ts", import.meta.url).pathname
  }
 },
 test: {
  environment: "node",
  passWithNoTests: true
 }
});
