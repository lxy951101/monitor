import { CfgManager, EventBus, Logger } from "@monitor/core";
import type { MonitorContext } from "@monitor/core";
import { describe, expect, it, vi } from "vitest";
import { createErrorPlugin } from "./create-error-plugin";

function createMockContext(overrides: Partial<MonitorContext> = {}): MonitorContext {
  const cfgManager = new CfgManager();
  return {
    cfgManager,
    eventBus: new EventBus(),
    transport: { send: vi.fn().mockResolvedValue({ ok: true, status: 204 }) },
    logger: new Logger(false),
    ...overrides,
  };
}

describe("createErrorPlugin", () => {
  it("返回一个 name 为 @monitor/plugin-error 的 Plugin", () => {
    const plugin = createErrorPlugin();
    expect(plugin.name).toBe("@monitor/plugin-error");
    expect(typeof plugin.start).toBe("function");
    expect(typeof plugin.stop).toBe("function");
  });

  it("start 时创建 ErrorManager 并调用 onReady", () => {
    const onReady = vi.fn();
    const plugin = createErrorPlugin({ onReady });
    const ctx = createMockContext();

    plugin.start(ctx);

    expect(onReady).toHaveBeenCalledTimes(1);
    expect(onReady.mock.calls[0][0]).toBeDefined();
  });

  it("start + stop 不抛错", () => {
    const plugin = createErrorPlugin();
    const ctx = createMockContext();

    expect(() => plugin.start(ctx)).not.toThrow();
    expect(() => plugin.stop?.()).not.toThrow();
  });

  it("stop 后重复 start 不抛错", () => {
    const plugin = createErrorPlugin();
    const ctx = createMockContext();

    plugin.start(ctx);
    plugin.stop?.();
    expect(() => plugin.start(ctx)).not.toThrow();
    plugin.stop?.();
  });
});
