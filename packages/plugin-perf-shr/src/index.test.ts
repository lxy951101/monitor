import { describe, expect, it, vi } from "vitest";
import { CfgManager, EventBus, Logger } from "@monitor/core";
import { calculateScrollMetrics, createShrPlugin, ShrManager } from "./index";

describe("滚动帧率", () => {
  it("计算滚动时长、帧数、FPS 和掉帧率", () => {
    const metrics = calculateScrollMetrics({
      startTime: 0,
      endTime: 100,
      frameTimes: [0, 16.7, 50.1, 66.8, 100.2]
    });

    expect(metrics.duration).toBe(100);
    expect(metrics.frames).toBe(5);
    expect(metrics.fps).toBe(50);
    expect(metrics.droppedFrames).toBe(2);
    expect(metrics.droppedRate).toBe(0.4);
  });

  it("上报 shr_web 指标", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const manager = new ShrManager({
      send,
      endpoint: "/perf/shr",
      tags: { page: "home" }
    });

    await manager.report({ startTime: 0, endTime: 100, frameTimes: [0, 16.7, 50.1] });

    expect(send).toHaveBeenCalledTimes(1);
    expect(JSON.parse(send.mock.calls[0][0].body)).toEqual({
      category: "shr_web",
      env: { page: "home" },
      logs: [{
        duration: 100,
        frames: 3,
        fps: 30,
        droppedFrames: 1,
        droppedRate: 1 / 3
      }]
    });
  });

  it("插件启动后监听 scroll 并在滚动停止后上报", async () => {
    let listener: (() => void) | undefined;
    let timeoutCallback: (() => void) | undefined;
    let now = 0;
    const send = vi.fn().mockResolvedValue(undefined);
    const plugin = createShrPlugin({
      idleDelay: 10,
      runtime: {
        addEventListener: vi.fn((_, handler) => {
          listener = handler;
        }),
        removeEventListener: vi.fn(),
        requestAnimationFrame: vi.fn((callback) => {
          callback(now);
          return 1;
        }),
        setTimeout: vi.fn((callback) => {
          timeoutCallback = callback;
          return 1 as unknown as ReturnType<typeof setTimeout>;
        }),
        clearTimeout: vi.fn(),
        now: () => now
      }
    });

    plugin.start(createContext(send));
    listener?.();
    now = 16.7;
    listener?.();
    now = 100;
    timeoutCallback?.();
    await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(1));
  });
});

function createContext(send: ReturnType<typeof vi.fn>) {
  return {
    cfgManager: new CfgManager({ project: "demo", perf: { shr: { endpoint: "/perf/shr" } } }),
    eventBus: new EventBus(),
    logger: new Logger(false),
    transport: { send }
  };
}
