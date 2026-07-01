import { describe, expect, it } from "vitest";
import { createFspBridgeEvent, createPerfCustomPayload, createPerfLogPayload } from "./index";

describe("Perf 协议", () => {
  it("生成 category/env/logs 结构", () => {
    const payload = createPerfLogPayload({
      category: "fsp",
      env: { project: "demo" },
      logs: [{ name: "load", value: 12 }],
    });
    expect(payload).toEqual({
      category: "fsp",
      env: { project: "demo" },
      logs: [{ name: "load", value: 12 }],
    });
  });

  it("生成 custom category 结构", () => {
    const payload = createPerfCustomPayload({
      category: "custom_fsp",
      env: { project: "demo" },
      metrics: { firstScreen: 88 },
    });
    expect(payload.category).toBe("custom_fsp");
    expect(payload.logs[0]).toEqual({ firstScreen: 88 });
  });

  it("生成容器 FSP 桥事件结构", () => {
    const event = createFspBridgeEvent({
      type: "success",
      createMs: 260,
      appId: "demo",
      pagePath: "/home",
      pageUrl: "https://example.com/home",
      userAgent: "demo-agent",
      sdkVersion: "1.0.0",
      pageNavStart: 100,
      isOffline: false,
      sampleRate: 0.5,
      tags: { env: "test" },
      metrics: {
        reachBottom: true,
        renderRate: 1,
        mutationCount: 2,
        costMs: 3,
        pageLoadedTime: 250,
        pageStable: true,
        loadedStableGap: 10,
      },
    });

    expect(event).toEqual({
      env: "test",
      eType: "success",
      createMs: 260,
      appId: "demo",
      pagePath: "/home",
      pageUrl: "https://example.com/home",
      userAgent: "demo-agent",
      sdkVersion: "1.0.0",
      pageNavStart: 100,
      isOffline: false,
      reachBottom: "reached",
      costMs: 3,
      mutationCount: 2,
      renderRate: 1,
      $sr: 0.5,
      detect_cls: true,
      ffp_page_loaded: true,
      ffp_loaded_time: 250,
      ffp_page_stable: true,
      ffp_loaded_stable_gap: 10,
    });
  });
});
