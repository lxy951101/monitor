import { describe, expect, it, vi } from "vitest";
import { ResourceManager } from "./index";

describe("ResourceManager", () => {
  it("按资源协议批量发送 API 调用", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const manager = new ResourceManager({
      project: "demo",
      pageUrl: "/home",
      reportBaseUrl: "",
      devMode: true,
      resource: { sampleApi: 1, combo: false },
      send
    });

    manager.pushApi({
      resourceUrl: "/api/order",
      type: "ajax",
      connectType: "xhr",
      duration: 25,
      statusCode: 200,
      requestbyte: 4,
      responsebyte: 8
    });
    await manager.flush();

    const request = send.mock.calls[0][0];
    expect(request.url).toContain("/batchts"); // devMode: true uses batchTs
    expect(request.url).toContain("project=demo");
    expect(JSON.parse(String(request.body)).infos[0]).toEqual(
      expect.objectContaining({
        resourceUrl: "/api/order",
        type: "ajax",
        project: "demo",
        pageUrl: "/home",
        statusCode: "200",
        responsetime: "25"
      })
    );
  });

  it("过滤自身上报请求且发送失败时保留队列", async () => {
    const send = vi
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(undefined);
    const manager = new ResourceManager({
      project: "demo",
      pageUrl: "/home",
      reportBaseUrl: "https://catfront.dianping.com",
      devMode: true,
      resource: { sampleApi: 1, combo: true },
      send
    });

    manager.pushApi({
      resourceUrl: "https://catfront.dianping.com/batchts",
      type: "ajax"
    });
    manager.pushApi({ resourceUrl: "/api/order", type: "ajax" });
    await expect(manager.flush()).rejects.toThrow(
      "resource batch send failed"
    );
    await manager.flush();

    expect(send).toHaveBeenCalledTimes(2);
    expect(
      JSON.parse(String(send.mock.calls[1][0].body)).infos
    ).toHaveLength(1);
  });

  it("report() 立即发送", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const manager = new ResourceManager({
      project: "demo",
      pageUrl: "/home",
      resource: { sampleApi: 1, combo: false },
      send
    });

    await manager.report({
      resourceUrl: "/api/order",
      type: "ajax",
      statusCode: 200
    });

    expect(send).toHaveBeenCalledTimes(1);
  });

  it("pushCall 检查 resource 采样", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const manager = new ResourceManager({
      project: "demo",
      pageUrl: "/home",
      resource: { sample: 0, combo: false },
      send
    });

    manager.pushCall({
      resourceUrl: "/static/app.js",
      type: "js",
      statusCode: 200
    });
    // sample=0 时不应入队
    await manager.flush();
    expect(send).not.toHaveBeenCalled();
  });
});
