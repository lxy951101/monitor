import { describe, expect, it, vi } from "vitest";
import { createFetchInterceptor } from "./index";

describe("fetch 拦截", () => {
  it("记录 fetch 耗时、状态码并可恢复原始方法", async () => {
    const response = new Response("ok", {
      status: 201,
      headers: { "content-length": "2" }
    });
    const originalFetch = vi.fn().mockResolvedValue(response);
    const win = { fetch: originalFetch as unknown as typeof fetch };
    const onCall = vi.fn();
    const now = vi.fn().mockReturnValueOnce(10).mockReturnValueOnce(42);
    const interceptor = createFetchInterceptor({
      window: win,
      onCall,
      now,
      shouldIgnore: () => false
    });

    interceptor.start();
    await win.fetch("/api/data", { method: "PUT", body: "abc" });

    // body clone 是异步的，等待 microtask
    await vi.waitFor(() => expect(onCall).toHaveBeenCalled());

    expect(onCall).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "PUT",
        url: "/api/data",
        duration: 32,
        type: "fetch",
        statusCode: expect.stringContaining("201"),
        firstCategory: ""
      })
    );

    interceptor.stop();
    expect(win.fetch).toBe(originalFetch);
  });

  it("fetch 网络失败时记录 status 500 后继续抛出", async () => {
    const originalFetch = vi.fn().mockRejectedValue(new Error("offline"));
    const win = { fetch: originalFetch as unknown as typeof fetch };
    const onCall = vi.fn();
    const interceptor = createFetchInterceptor({
      window: win,
      onCall,
      now: vi.fn().mockReturnValueOnce(1).mockReturnValueOnce(6),
      shouldIgnore: () => false
    });

    interceptor.start();
    await expect(win.fetch("/api/fail")).rejects.toThrow("offline");

    expect(onCall).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/api/fail",
        duration: 5,
        type: "fetch",
        statusCode: expect.stringContaining("500"),
        firstCategory: "ajaxError"
      })
    );
  });
});
