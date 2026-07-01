import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  {
    test: {
      name: "packages",
      include: ["packages/*/src/**/*.test.ts"],
      passWithNoTests: true
    }
  },
  {
    test: {
      name: "apps",
      include: ["apps/*/src/**/*.test.ts"],
      passWithNoTests: true
    }
  }
]);
