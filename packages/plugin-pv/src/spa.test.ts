import { describe, expect, it, vi } from "vitest";
import { PvManager, startSpaPv } from "./index";

describe("startSpaPv", () => {
  it("路由变化时发送 PV（带 200ms 防抖），stop 后停止发送", async () => {
    vi.useFakeTimers();
    const send = vi.fn().mockResolvedValue(undefined);
    const manager = new PvManager({ project: "demo", pageUrl: "/initial", send });
    let routeHandler: ((url: string) => void) | undefined;
    const stopWatcher = vi.fn();
    const watchRoute = vi.fn((handler: (url: string) => void) => {
      routeHandler = handler;
      return stopWatcher;
    });

    const stop = startSpaPv(manager, { watchRoute });
    routeHandler?.("/next");
    await vi.advanceTimersByTimeAsync(250);
    stop();
    routeHandler?.("/ignored");
    await vi.advanceTimersByTimeAsync(250);

    expect(watchRoute).toHaveBeenCalledTimes(1);
    expect(stopWatcher).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledTimes(1);
    expect(decodeURIComponent(send.mock.calls[0][0].body as string)).toContain("pageurl=/next");

    vi.useRealTimers();
  });

  it("auto 路由模式同时响应 history 和 hash 变化", async () => {
    vi.useFakeTimers();
    const send = vi.fn().mockResolvedValue(undefined);
    const manager = new PvManager({ project: "demo", pageUrl: "/initial", send });
    const listeners = new Map<string, EventListener>();
    const env = {
      location: { href: "https://demo.test/#/a", hash: "#/a" },
      history: {
        pushState: vi.fn(),
        replaceState: vi.fn()
      },
      addEventListener: vi.fn((name: string, listener: EventListener) => {
        listeners.set(name, listener);
      }),
      removeEventListener: vi.fn()
    };

    const stop = startSpaPv(manager, { env, routeMode: "auto" });
    env.history.pushState({}, "", "/b");
    await vi.advanceTimersByTimeAsync(250);
    listeners.get("hashchange")?.(new Event("hashchange"));
    await vi.advanceTimersByTimeAsync(250);
    stop();

    expect(send).toHaveBeenCalledTimes(2);
    expect(env.removeEventListener).toHaveBeenCalledWith("popstate", expect.any(Function));
    expect(env.removeEventListener).toHaveBeenCalledWith("hashchange", expect.any(Function));

    vi.useRealTimers();
  });
});
