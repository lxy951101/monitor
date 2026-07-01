import { describe, expect, it } from "vitest";
import { createMetricPayload } from "./index";

describe("Metric 协议", () => {
  it("生成对齐 owl.js 的 tvs + datas 结构 (key/vs/tvs/ts)", () => {
    const payload = createMetricPayload({
      tvs: { page: "home" },
      extra: { traceid: "t1" },
      metrics: [
        {
          name: "counter",
          value: 2,
          tags: { region: "sh" }
        }
      ]
    });
    expect(payload.tvs).toEqual({ page: "home" });
    expect(payload.datas[0]).toMatchObject({
      key: "counter",
      vs: [2],
      tvs: { region: "sh" },
      extra: { traceid: "t1" }
    });
    // 时间戳为秒级
    expect(payload.datas[0].ts).toBeGreaterThan(0);
    expect(payload.datas[0].ts).toBeLessThan(Date.now() / 1000 + 10);
  });

  it("不传 extra 时 metric 不附带 extra 字段", () => {
    const payload = createMetricPayload({
      metrics: [{ name: "a", value: 1 }]
    });
    expect(payload.datas[0].extra).toBeUndefined();
  });

  it("支持外部指定时间戳(ms)并转为秒级 ts", () => {
    const payload = createMetricPayload({
      metrics: [{ name: "a", value: 1, timestamp: 1700000000000 }]
    });
    expect(payload.datas[0].ts).toBe(1700000000);
  });
});
