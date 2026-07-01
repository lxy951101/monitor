import { describe, expect, it, vi } from "vitest";
import type { TransportRequest } from "@monitor/transport";
import { PerfCache, sendWithPerfCache } from "./index";

function createStorage() {
 const values = new Map<string, string>();
 return {
  getItem: vi.fn((key: string) => values.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => values.set(key, value)),
  removeItem: vi.fn((key: string) => values.delete(key))
 };
}

describe("PerfCache", () => {
 it("发送失败后写入 __perf_cache", async () => {
  const storage = createStorage();
  const cache = new PerfCache({ storage, now: () => 1000 });

  await expect(sendWithPerfCache({
   method: "POST",
   url: "/perf",
   body: "{\"ok\":false}"
  }, vi.fn().mockRejectedValue(new Error("offline")), cache)).rejects.toThrow("offline");

  expect(JSON.parse(storage.getItem("__perf_cache") ?? "[]")).toEqual([{
   method: "POST",
   url: "/perf",
   body: "{\"ok\":false}",
   timestamp: 1000
  }]);
 });

 it("flush 成功后清空缓存，失败时保留剩余记录", async () => {
  const storage = createStorage();
  const cache = new PerfCache({ storage });
  cache.add({ method: "POST", url: "/ok", body: "1" });
  cache.add({ method: "POST", url: "/fail", body: "2" });
  const send = vi.fn((request: TransportRequest) => {
   return request.url === "/fail" ? Promise.reject(new Error("fail")) : Promise.resolve();
  });

  await cache.flush(send);

  expect(send).toHaveBeenCalledTimes(2);
  expect(cache.read()).toEqual([expect.objectContaining({ url: "/fail", body: "2" })]);
 });
});
