import { describe, expect, it } from "vitest";
import { appendQueryParams, encodeQueryParams } from "./index";

describe("Query 编码", () => {
  it("跳过 undefined 并正确 encodeURIComponent", () => {
    expect(
      encodeQueryParams({
        project: "demo app",
        pageurl: "/home?a=1",
        empty: undefined
      })
    ).toBe("project=demo%20app&pageurl=%2Fhome%3Fa%3D1");
  });

  it("支持追加到已有 query", () => {
    expect(appendQueryParams("/api/log?foo=bar", { project: "demo" })).toBe("/api/log?foo=bar&project=demo");
  });
});
