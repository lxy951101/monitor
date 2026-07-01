import { createLibConfig } from "@monitor/build-config";

export default createLibConfig({
  name: "Monitor",
  formats: ["iife"],
  iifeName: "Monitor",
  external: [],
});
