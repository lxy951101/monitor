import { describe, expect, it } from "vitest";
import { createPvModel, encodePvQuery } from "./index";

describe("PV 协议", () => {
  it("生成 OWL 兼容查询参数", () => {
    const query = encodePvQuery(
      createPvModel({
        project: "demo",
        pageurl: "/home",
        pageId: "p1",
        timestamp: 1000,
        region: "sh",
        operator: "cmcc",
        network: "wifi",
        container: "browser",
        os: "mac",
        unionid: "u1",
        ctags: { scene: "home" }
      })
    );
    for (const key of [
      "project",
      "pageurl",
      "pageId",
      "timestamp",
      "region",
      "operator",
      "network",
      "container",
      "os",
      "unionid",
      "ctags"
    ]) {
      expect(query).toContain(`${key}=`);
    }
  });
});
