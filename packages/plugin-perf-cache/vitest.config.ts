import { defineConfig } from "vitest/config";

export default defineConfig({
 resolve: {
  alias: {
   "@monitor/transport": new URL("../transport/src/index.ts", import.meta.url).pathname
  }
 },
 test: {
  environment: "node",
  passWithNoTests: true
 }
});
