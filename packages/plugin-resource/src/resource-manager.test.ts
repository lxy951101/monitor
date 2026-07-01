import { describe, expect, it, vi } from "vitest";
import { ResourceManager } from "./index";

describe("ResourceManager", () => {
  it("按资源协议批量发送 API 调用", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const manager = new ResourceManager({ project: "demo", pageUrl: "/home", reportBaseUrl: "", send });

    manager.addCall({
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
    expect(request.url).toContain("/batchts");
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
    const send = vi.fn().mockRejectedValueOnce(new Error("network")).mockResolvedValueOnce(undefined);
    const manager = new ResourceManager({
      project: "demo",
      pageUrl: "/home",
      reportBaseUrl: "https://catfront.dianping.com",
      send
    });

    manager.addCall({ resourceUrl: "https://catfront.dianping.com/batchts", type: "ajax" });
    manager.addCall({ resourceUrl: "/api/order", type: "ajax" });
    await expect(manager.flush()).rejects.toThrow("network");
    await manager.flush();

    expect(send).toHaveBeenCalledTimes(2);
    expect(JSON.parse(String(send.mock.calls[1][0].body)).infos).toHaveLength(1);
  });
});

