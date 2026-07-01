import { afterEach, describe, expect, it, vi } from "vitest";
import { ReportQueue } from "./index";

describe("ReportQueue", () => {
 afterEach(() => {
  vi.useRealTimers();
 });

 it("达到阈值时立即发送并清空缓存", async () => {
  const send = vi.fn().mockResolvedValue(undefined);
  const queue = new ReportQueue({ maxLength: 2, delay: 1000, send });

  queue.add({ type: "a" });
  queue.add({ type: "b" });
  await queue.flush();

  expect(send).toHaveBeenCalledTimes(1);
  expect(send).toHaveBeenCalledWith([{ type: "a" }, { type: "b" }]);
  expect(queue.size()).toBe(0);
 });

 it("发送失败时回滚数据并触发失败回调", async () => {
  const error = new Error("network failed");
  const onFail = vi.fn();
  const queue = new ReportQueue({
   maxLength: 2,
   delay: 1000,
   send: vi.fn().mockRejectedValue(error),
   onFail
  });

  queue.add({ type: "a" });
  queue.add({ type: "b" });
  await expect(queue.flush()).rejects.toThrow("network failed");

  expect(queue.size()).toBe(2);
  expect(onFail).toHaveBeenCalledWith(error, [{ type: "a" }, { type: "b" }]);
 });

 it("并发 flush 期间新增数据达到阈值会在当前发送完成后继续发送", async () => {
  let resolveFirst: (() => void) | undefined;
  const send = vi
   .fn()
   .mockImplementationOnce(
    () =>
     new Promise<void>((resolve) => {
      resolveFirst = resolve;
     })
   )
   .mockResolvedValue(undefined);
  const queue = new ReportQueue({ maxLength: 2, delay: 1000, send });

  queue.add({ type: "a" });
  queue.add({ type: "b" });
  queue.add({ type: "c" });
  queue.add({ type: "d" });

  expect(send).toHaveBeenCalledTimes(1);
  expect(send).toHaveBeenNthCalledWith(1, [{ type: "a" }, { type: "b" }]);

  resolveFirst?.();
  await queue.flush();

  expect(send).toHaveBeenCalledTimes(2);
  expect(send).toHaveBeenNthCalledWith(2, [{ type: "c" }, { type: "d" }]);
  expect(queue.size()).toBe(0);
 });

 it("timer 自动 flush 失败不会产生外部 unhandled rejection 且数据可重试", async () => {
  vi.useFakeTimers();
  const error = new Error("timer failed");
  const onFail = vi.fn();
  const send = vi.fn().mockRejectedValueOnce(error).mockResolvedValue(undefined);
  const queue = new ReportQueue({ maxLength: 10, delay: 100, minDelay: 0, send, onFail });
  const unhandled = vi.fn();

  process.once("unhandledRejection", unhandled);
  queue.add({ type: "a" });

  await vi.advanceTimersByTimeAsync(100);
  await Promise.resolve();

  expect(onFail).toHaveBeenCalledWith(error, [{ type: "a" }]);
  expect(queue.size()).toBe(1);

  await queue.flush();

  expect(unhandled).not.toHaveBeenCalled();
  expect(send).toHaveBeenCalledTimes(2);
  expect(queue.size()).toBe(0);
  process.removeListener("unhandledRejection", unhandled);
 });
});
