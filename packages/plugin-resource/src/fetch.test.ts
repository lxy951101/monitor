import { describe, expect, it, vi } from "vitest";
import { createFetchInterceptor } from "./index";

describe("fetch 拦截", () => {
  it("记录 fetch 耗时、状态码并可恢复原始方法", async () => {
    const response = new Response("ok", { status: 201, headers: { "content-length": "2" } });
    const originalFetch = vi.fn().mockResolvedValue(response);
    const win = { fetch: originalFetch as unknown as typeof fetch };
    const onCall = vi.fn();
    const now = vi.fn().mockReturnValueOnce(10).mockReturnValueOnce(42);
    const interceptor = createFetchInterceptor({ window: win, onCall, now });

    interceptor.start();
    await win.fetch("/api/data", { method: "PUT", body: "abc" });

    expect(onCall).toHaveBeenCalledWith(
      expect.objectContaining({ method: "PUT", url: "/api/data", statusCode: 201, duration: 32, type: "fetch" })
    );

    interceptor.stop();
    expect(win.fetch).toBe(originalFetch);
  });

  it("fetch 网络失败时记录 status 0 后继续抛出", async () => {
    const originalFetch = vi.fn().mockRejectedValue(new Error("offline"));
    const win = { fetch: originalFetch as unknown as typeof fetch };
    const onCall = vi.fn();
    const interceptor = createFetchInterceptor({
      window: win,
      onCall,
      now: vi.fn().mockReturnValueOnce(1).mockReturnValueOnce(6)
    });

    interceptor.start();
    await expect(win.fetch("/api/fail")).rejects.toThrow("offline");

    expect(onCall).toHaveBeenCalledWith(
      expect.objectContaining({ url: "/api/fail", statusCode: 0, duration: 5, type: "fetch" })
    );
  });
});
