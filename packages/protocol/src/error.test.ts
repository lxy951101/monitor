import { describe, expect, it } from "vitest";
import { createErrorModel, encodeErrorBody } from "./index";

describe("错误协议", () => {
  it("生成 兼容错误体", () => {
    const model = createErrorModel({
      project: "demo",
      pageUrl: "/home",
      realUrl: "https://example.com/home",
      category: "jsError",
      sec_category: "boom",
      level: "error",
      content: "stack",
    });
    const body = encodeErrorBody([model]);
    expect(body.startsWith("c=")).toBe(true);
    expect(decodeURIComponent(body.slice(2))).toContain('"sec_category":"boom"');
  });

  it("jsError 类别时把 rowNum、colNum 和 tags 放入 dynamicMetric", () => {
    const model = createErrorModel({
      project: "demo",
      pageUrl: "/home",
      realUrl: "https://example.com/home",
      category: "jsError",
      content: "stack",
      rowNum: 12,
      colNum: 5,
      tags: { feature: "checkout" },
    });
    expect(model.dynamicMetric).toEqual({
      rowNum: 12,
      colNum: 5,
      tags: { feature: "checkout" },
    });
  });

  it("非 jsError 类别时不把 rowNum/colNum 放入 dynamicMetric ", () => {
    const model = createErrorModel({
      project: "demo",
      pageUrl: "/home",
      realUrl: "https://example.com/home",
      category: "resourceError",
      content: "img load failed",
      rowNum: 12,
      colNum: 5,
      tags: { feature: "checkout" },
    });
    expect(model.dynamicMetric).toEqual({
      tags: { feature: "checkout" },
    });
  });

  it("默认类别 jsError 时 rowNum/colNum 正常工作", () => {
    const model = createErrorModel({
      project: "demo",
      pageUrl: "/home",
      realUrl: "https://example.com/home",
      content: "stack",
      rowNum: 1,
      colNum: 2,
    });
    expect(model.dynamicMetric).toEqual({
      rowNum: 1,
      colNum: 2,
    });
  });
});
