import { describe, expect, it } from "vitest";
import { appendQueryParams, encodeQueryParams } from "./index";

describe("Query 编码", () => {
  it("跳过 undefined 并正确 encodeURIComponent", () => {
    expect(
      encodeQueryParams({
        project: "demo app",
        pageurl: "/home?a=1",
        empty: undefined,
      }),
    ).toBe("project=demo%20app&pageurl=%2Fhome%3Fa%3D1");
  });

  it("支持追加到已有 query", () => {
    expect(appendQueryParams("/api/log?foo=bar", { project: "demo" })).toBe(
      "/api/log?foo=bar&project=demo",
    );
  });

  it("支持追加到无 query 但有 hash 的 URL", () => {
    expect(appendQueryParams("/page#tab", { project: "demo" })).toBe("/page?project=demo#tab");
  });

  it("支持追加到已有 query 和 hash 的 URL", () => {
    expect(appendQueryParams("/page?x=1#tab", { project: "demo" })).toBe(
      "/page?x=1&project=demo#tab",
    );
  });

  it("追加时跳过 undefined 并编码特殊字符", () => {
    expect(
      appendQueryParams("/page#tab", {
        project: "demo app",
        empty: undefined,
        pageurl: "/home?a=1",
      }),
    ).toBe("/page?project=demo%20app&pageurl=%2Fhome%3Fa%3D1#tab");
  });
});
