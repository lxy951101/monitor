import { describe, expect, it } from "vitest";
import {
  RESOURCE_FIELD_ORDER,
  createResourceModel,
  encodeResourceJsonBatchBytes,
  encodeResourceProtobufBatch,
  encodeResourceTextBatch,
} from "./index";

describe("资源协议", () => {
  it("按固定字段顺序编码资源", () => {
    expect(RESOURCE_FIELD_ORDER.slice(0, 4)).toEqual([
      "resourceUrl",
      "connectType",
      "type",
      "timestamp",
    ]);
    const item = createResourceModel({
      resourceUrl: "https://example.com/a.js",
      connectType: "https",
      type: "js",
      project: "demo",
      pageUrl: "/home",
      realUrl: "https://example.com/home",
      responsetime: "12",
      statusCode: "200|",
    });
    const text = encodeResourceTextBatch({ infos: [item] });
    expect(text).toContain("https://example.com/a.js");
    expect(text).toContain('"infos"');
  });

  it("返回可解码的 JSON 批量字节编码", () => {
    const item = createResourceModel({
      resourceUrl: "https://example.com/a.js",
      connectType: "https",
      type: "js",
      project: "demo",
      pageUrl: "/home",
      realUrl: "https://example.com/home",
    });
    const data = encodeResourceJsonBatchBytes({ infos: [item] });
    expect(data).toBeInstanceOf(Uint8Array);
    expect(data.byteLength).toBeGreaterThan(0);
    expect(JSON.parse(new TextDecoder().decode(data))).toEqual({ infos: [item] });
  });

  it("protobuf 编码BatchMessage 生成二进制 Uint8Array", () => {
    const item = createResourceModel({
      resourceUrl: "https://example.com/a.js",
      connectType: "https",
      type: "js",
      project: "demo",
      pageUrl: "/home",
      realUrl: "https://example.com/home",
      responsetime: 12,
      statusCode: 200,
      firstCategory: "resource",
      secondCategory: "script",
      logContent: "load failed",
      traceid: "t1",
      ctags: '{ "k": "v" }',
    });
    const data = encodeResourceProtobufBatch({
      infos: [item],
      region: "sh",
      operator: "cmcc",
    });
    expect(data).toBeInstanceOf(Uint8Array);
    expect(data.byteLength).toBeGreaterThan(0);

    // 确保内容包含关键字段的字节 (UTF-8)
    const view = new TextDecoder().decode(data);
    expect(view).toContain("https://example.com/a.js");
    expect(view).toContain("demo");
    expect(view).toContain("load failed");
  });

  it("protobuf 空 infos 只包含 batch option 字段", () => {
    const data = encodeResourceProtobufBatch({
      infos: [],
      region: "sh",
      os: "ios",
    });
    expect(data).toBeInstanceOf(Uint8Array);
    expect(data.byteLength).toBeGreaterThan(0);
    // 不应包含 infos 字段 tag (10)
    const bytes = Array.from(data);
    expect(bytes).not.toContain(10);
  });
});
