import { describe, expect, it, vi } from "vitest";
import { startRouteFst } from "./index";

describe("路由首屏监听", () => {
  it("auto 模式同时监听 history 和 hash 并可停止", () => {
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
    const onRoute = vi.fn();

    const stop = startRouteFst({ env, routeMode: "auto", onRoute });
    env.history.pushState({}, "", "/b");
    listeners.get("hashchange")?.(new Event("hashchange"));
    stop();

    expect(onRoute).toHaveBeenCalledTimes(2);
    expect(env.removeEventListener).toHaveBeenCalledWith("popstate", expect.any(Function));
    expect(env.removeEventListener).toHaveBeenCalledWith("hashchange", expect.any(Function));
  });
});

