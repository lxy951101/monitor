import { describe, expect, it } from "vitest";
import {
  RESOURCE_FIELD_ORDER,
  createResourceModel,
  encodeResourceProtobufBatch,
  encodeResourceTextBatch
} from "./index";

describe("资源协议", () => {
  it("按固定字段顺序编码资源", () => {
    expect(RESOURCE_FIELD_ORDER.slice(0, 4)).toEqual(["resourceUrl", "connectType", "type", "timestamp"]);
    const item = createResourceModel({
      resourceUrl: "https://example.com/a.js",
      connectType: "https",
      type: "js",
      project: "demo",
      pageUrl: "/home",
      realUrl: "https://example.com/home",
      responsetime: "12",
      statusCode: "200|"
    });
    const text = encodeResourceTextBatch({ infos: [item] });
    expect(text).toContain("https://example.com/a.js");
    expect(text).toContain("\"infos\"");
  });

  it("返回稳定的非空 protobuf 批量编码接口", () => {
    const item = createResourceModel({
      resourceUrl: "https://example.com/a.js",
      connectType: "https",
      type: "js",
      project: "demo",
      pageUrl: "/home",
      realUrl: "https://example.com/home"
    });
    const data = encodeResourceProtobufBatch({ infos: [item] });
    expect(data).toBeInstanceOf(Uint8Array);
    expect(data.byteLength).toBeGreaterThan(0);
  });
});
