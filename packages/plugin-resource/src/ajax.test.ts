import { describe, expect, it, vi } from "vitest";
import { createAjaxInterceptor } from "./index";

class FakeXHR {
  status = 200;
  responseText = "ok";
  readyState = 0;
  onreadystatechange: ((event: Event) => void) | null = null;
  private listeners = new Map<string, Array<() => void>>();

  open = vi.fn();

  send = vi.fn(() => {
    this.readyState = 4;
    for (const listener of this.listeners.get("loadend") ?? []) {
      listener();
    }
    this.onreadystatechange?.(new Event("readystatechange"));
  });

  addEventListener(name: string, listener: () => void): void {
    this.listeners.set(name, [...(this.listeners.get(name) ?? []), listener]);
  }
}

describe("ajax 拦截", () => {
  it("重复启动只 patch 一次并在请求完成后触发事件", () => {
    const win = { XMLHttpRequest: FakeXHR as unknown as new () => XMLHttpRequest };
    const onCall = vi.fn();
    const interceptor = createAjaxInterceptor({ window: win, onCall, now: () => 100 });

    interceptor.start();
    const patched = win.XMLHttpRequest;
    interceptor.start();
    const xhr = new win.XMLHttpRequest();
    xhr.open("POST", "/api/order");
    xhr.send("payload");

    expect(win.XMLHttpRequest).toBe(patched);
    expect(interceptor.isStarted()).toBe(true);
    expect(onCall).toHaveBeenCalledWith(
      expect.objectContaining({ method: "POST", url: "/api/order", statusCode: 200, type: "ajax" })
    );

    interceptor.stop();
    expect(win.XMLHttpRequest).toBe(FakeXHR);
  });
});

