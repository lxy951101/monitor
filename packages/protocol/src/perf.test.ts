import { describe, expect, it } from "vitest";
import { createPerfCustomPayload, createPerfLogPayload } from "./index";

describe("Perf 协议", () => {
  it("生成 category/env/logs 结构", () => {
    const payload = createPerfLogPayload({
      category: "fsp",
      env: { project: "demo" },
      logs: [{ name: "load", value: 12 }]
    });
    expect(payload).toEqual({
      category: "fsp",
      env: { project: "demo" },
      logs: [{ name: "load", value: 12 }]
    });
  });

  it("生成 custom category 结构", () => {
    const payload = createPerfCustomPayload({
      category: "custom_fsp",
      env: { project: "demo" },
      metrics: { firstScreen: 88 }
    });
    expect(payload.category).toBe("custom_fsp");
    expect(payload.logs[0]).toEqual({ firstScreen: 88 });
  });
});
