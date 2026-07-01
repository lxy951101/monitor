import { describe, expect, it } from "vitest";
import { createMetricPayload } from "./index";

describe("Metric 协议", () => {
  it("生成 tvs 和 datas，并支持 setMetric 风格 extra", () => {
    const payload = createMetricPayload({
      tvs: { page: "home" },
      metrics: [
        {
          name: "counter",
          value: 2,
          tags: { region: "sh" },
          extra: { traceid: "t1" }
        }
      ]
    });
    expect(payload.tvs).toEqual({ page: "home" });
    expect(payload.datas[0]).toMatchObject({
      name: "counter",
      value: 2,
      extra: { traceid: "t1" }
    });
  });
});
