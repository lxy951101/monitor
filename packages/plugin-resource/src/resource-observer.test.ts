import { describe, expect, it, vi } from "vitest";
import { startResourceErrorCapture, startResourceObserver } from "./index";

describe("资源 PerformanceEntry 与加载错误", () => {
  it("支持 PerformanceObserver 和回退 performance 读取", () => {
    const onCall = vi.fn();
    class FakePerformanceObserver {
      constructor(
        private readonly callback: (list: {
          getEntries: () => Array<{
            name: string;
            initiatorType: string;
            duration?: number;
            transferSize?: number;
          }>;
        }) => void,
      ) {}
      observe(): void {
        this.callback({
          getEntries: () => [
            { name: "/app.js", initiatorType: "script", duration: 12, transferSize: 120 },
          ],
        });
      }
      disconnect = vi.fn();
    }

    const stop = startResourceObserver({ PerformanceObserver: FakePerformanceObserver }, onCall);
    stop();
    startResourceObserver(
      {
        performance: {
          getEntriesByType: () => [{ name: "/img.png", initiatorType: "img" }],
        },
      },
      onCall,
    );

    expect(onCall).toHaveBeenCalledWith(
      expect.objectContaining({
        resourceUrl: "/app.js",
        type: "js",
      }),
    );
    expect(onCall).toHaveBeenCalledWith(
      expect.objectContaining({
        resourceUrl: expect.stringContaining("img.png"),
        type: "image",
      }),
    );
  });

  it("过滤掉非 link/script/img/css 的资源", () => {
    const onCall = vi.fn();
    startResourceObserver(
      {
        performance: {
          getEntriesByType: () => [{ name: "/font.woff", initiatorType: "other" }],
        },
      },
      onCall,
    );
    expect(onCall).not.toHaveBeenCalled();
  });

  it("捕获资源加载错误并在 stop 后移除监听", () => {
    const listeners = new Map<string, EventListener>();
    const target = {
      addEventListener: vi.fn((name: string, listener: EventListener) =>
        listeners.set(name, listener),
      ),
      removeEventListener: vi.fn(),
    };
    const onCall = vi.fn();

    const stop = startResourceErrorCapture(target, onCall);
    listeners.get("error")?.({
      target: { nodeName: "IMG", getAttribute: () => "/bad.png" },
    } as unknown as Event);
    stop();

    expect(onCall).toHaveBeenCalledWith(
      expect.objectContaining({
        resourceUrl: expect.stringContaining("/bad.png"),
        type: "img",
        firstCategory: "resourceError",
      }),
    );
    expect(target.removeEventListener).toHaveBeenCalledWith("error", expect.any(Function), true);
  });
});
