import { describe, expect, it, vi } from "vitest";
import { ReportQueue } from "./index";

describe("ReportQueue", () => {
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
});
