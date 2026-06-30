import { describe, expect, it, vi } from "vitest";
import { collectResourceEntries, startResourceErrorCapture, startResourceObserver } from "./index";

describe("资源 PerformanceEntry 与加载错误", () => {
  it("解析 script/link/img/css 等 resource entry", () => {
    expect(
      collectResourceEntries([
        { name: "/app.js", initiatorType: "script", duration: 12, transferSize: 120 },
        { name: "/font.woff", initiatorType: "other", duration: 1 }
      ])
    ).toEqual([
      expect.objectContaining({ resourceUrl: "/app.js", type: "script", duration: 12, responsebyte: 120 })
    ]);
  });

  it("支持 PerformanceObserver 和回退 performance 读取", () => {
    const onCall = vi.fn();
    class FakePerformanceObserver {
      constructor(private readonly callback: (list: { getEntries: () => Array<{ name: string; initiatorType: string }> }) => void) {}
      observe(): void {
        this.callback({ getEntries: () => [{ name: "/app.css", initiatorType: "link" }] });
      }
      disconnect = vi.fn();
    }

    const stop = startResourceObserver({ PerformanceObserver: FakePerformanceObserver }, onCall);
    stop();
    startResourceObserver(
      { performance: { getEntriesByType: () => [{ name: "/img.png", initiatorType: "img" }] } },
      onCall
    );

    expect(onCall).toHaveBeenCalledWith(expect.objectContaining({ resourceUrl: "/app.css" }));
    expect(onCall).toHaveBeenCalledWith(expect.objectContaining({ resourceUrl: "/img.png" }));
  });

  it("捕获资源加载错误并在 stop 后移除监听", () => {
    const listeners = new Map<string, EventListener>();
    const target = {
      addEventListener: vi.fn((name: string, listener: EventListener) => listeners.set(name, listener)),
      removeEventListener: vi.fn()
    };
    const onCall = vi.fn();
    const element = {
      tagName: "IMG",
      getAttribute: (name: string) => (name === "src" ? "/bad.png" : null)
    };

    const stop = startResourceErrorCapture(target, onCall);
    listeners.get("error")?.({ target: element } as unknown as Event);
    stop();

    expect(onCall).toHaveBeenCalledWith(
      expect.objectContaining({ resourceUrl: "/bad.png", type: "img", firstCategory: "resourceError" })
    );
    expect(target.removeEventListener).toHaveBeenCalledWith("error", expect.any(Function), true);
  });
});

