import { describe, expect, it, vi } from "vitest";
import { CfgManager } from "@monitor/core";
import { MetricManager } from "./index";

describe("MetricManager", () => {
  it("setMetric、setTags、report 生成 tvs 和 datas", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const manager = new MetricManager({ project: "demo", send });

    manager.setTags({ app: "checkout" });
    manager.setTag("env", "test");
    manager.setExtraData({ unit: "ms" });
    manager.setMetric("latency", 123, { api: "pay" });
    await manager.report();

    const request = send.mock.calls[0][0];
    expect(request.url).toContain("/rapi/metricjts");
    expect(request.url).toContain("project=demo");
    expect(JSON.parse(request.body)).toEqual({
      tvs: { app: "checkout", env: "test" },
      datas: [
        {
          key: "latency",
          vs: [123],
          tvs: { api: "pay" },
          extra: { unit: "ms" },
          ts: expect.any(Number)
        }
      ]
    });
  });

  it("未命中 metric 采样时不发送", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const cfgManager = new CfgManager({ project: "demo", metric: { sample: 0 } });
    const manager = new MetricManager({ cfgManager, send });

    manager.setMetric("count", 1);
    await manager.report();

    expect(send).not.toHaveBeenCalled();
  });

  it("delay 合并一段时间内的指标后自动发送", async () => {
    vi.useFakeTimers();
    const send = vi.fn().mockResolvedValue(undefined);
    const manager = new MetricManager({ project: "demo", send, delay: 50 });

    manager.setMetric("first", 1);
    manager.setMetric("second", 2);
    await vi.advanceTimersByTimeAsync(50);

    expect(send).toHaveBeenCalledTimes(1);
    expect(JSON.parse(send.mock.calls[0][0].body).datas.map((item: { key: string }) => item.key)).toEqual([
      "first",
      "second"
    ]);
    vi.useRealTimers();
  });

  it("后台发送失败调用告警回调且不产生未处理 rejection", async () => {
    vi.useFakeTimers();
    const error = new Error("network failed");
    const send = vi.fn().mockRejectedValue(error);
    const reportError = vi.fn();
    const manager = new MetricManager({ project: "demo", send, delay: 10, reportError });

    manager.setMetric("count", 1);
    await vi.advanceTimersByTimeAsync(10);

    expect(reportError).toHaveBeenCalledWith(error);
    expect(reportError).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("手动 report 失败也调用告警回调并保留指标可重试", async () => {
    const error = new Error("network failed");
    const send = vi.fn().mockRejectedValueOnce(error).mockResolvedValueOnce(undefined);
    const reportError = vi.fn();
    const manager = new MetricManager({ project: "demo", send, reportError });

    manager.setMetric("count", 1);
    await expect(manager.report()).rejects.toThrow("network failed");
    await manager.report();

    expect(reportError).toHaveBeenCalledWith(error);
    expect(send).toHaveBeenCalledTimes(2);
    expect(JSON.parse(send.mock.calls[1][0].body).datas[0].key).toBe("count");
  });

  it("支持 metric endpoint 覆盖和配置默认 tags", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const cfgManager = new CfgManager({
      project: "demo",
      endpoints: { metricJTs: "/custom/metric" },
      metric: { tags: { region: "sh" } }
    });
    const manager = new MetricManager({ cfgManager, send });

    manager.setMetric("count", 1);
    await manager.report();

    expect(send.mock.calls[0][0].url).toContain("/custom/metric");
    expect(JSON.parse(send.mock.calls[0][0].body).tvs).toEqual({ region: "sh" });
  });
});
