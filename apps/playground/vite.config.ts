import { defineConfig } from "vite";

export default defineConfig({
 server: {
  port: 5173,
  proxy: {
   "/api": "http://localhost:8787",
   "/rapi": "http://localhost:8787",
   "/perf": "http://localhost:8787",
   "/__records": "http://localhost:8787"
  }
 },
 resolve: {
  alias: {
   "@monitor/config": new URL("../../packages/config/src/index.ts", import.meta.url).pathname,
   "@monitor/core": new URL("../../packages/core/src/index.ts", import.meta.url).pathname,
   "@monitor/plugin-error": new URL("../../packages/plugin-error/src/index.ts", import.meta.url).pathname,
   "@monitor/plugin-metric": new URL("../../packages/plugin-metric/src/index.ts", import.meta.url).pathname,
   "@monitor/plugin-page": new URL("../../packages/plugin-page/src/index.ts", import.meta.url).pathname,
   "@monitor/plugin-perf-cache": new URL("../../packages/plugin-perf-cache/src/index.ts", import.meta.url).pathname,
   "@monitor/plugin-perf-fsp": new URL("../../packages/plugin-perf-fsp/src/index.ts", import.meta.url).pathname,
   "@monitor/plugin-perf-ird": new URL("../../packages/plugin-perf-ird/src/index.ts", import.meta.url).pathname,
   "@monitor/plugin-perf-shr": new URL("../../packages/plugin-perf-shr/src/index.ts", import.meta.url).pathname,
   "@monitor/plugin-pv": new URL("../../packages/plugin-pv/src/index.ts", import.meta.url).pathname,
   "@monitor/plugin-resource": new URL("../../packages/plugin-resource/src/index.ts", import.meta.url).pathname,
   "@monitor/protocol": new URL("../../packages/protocol/src/index.ts", import.meta.url).pathname,
   "@monitor/sdk": new URL("../../packages/sdk/src/index.ts", import.meta.url).pathname,
   "@monitor/transport": new URL("../../packages/transport/src/index.ts", import.meta.url).pathname
  }
 }
});
