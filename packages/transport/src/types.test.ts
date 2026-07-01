import { describe, expect, it } from "vitest";
import {
  ReportQueue,
  createBeaconTransport,
  createBridgeTransport,
  createXhrTransport,
  type Transport,
  type TransportRequest,
  type TransportResponse
} from "./index";

describe("类型导出", () => {
  it("导出传输层类型和实现", async () => {
    const request: TransportRequest = { method: "GET", url: "/api" };
    const response: TransportResponse = { ok: true, status: 200 };
    const transport: Transport = { send: async () => response };

    expect(request.url).toBe("/api");
    await expect(transport.send(request)).resolves.toBe(response);
    expect(ReportQueue).toBeTypeOf("function");
    expect(createXhrTransport).toBeTypeOf("function");
    expect(createBeaconTransport).toBeTypeOf("function");
    expect(createBridgeTransport).toBeTypeOf("function");
  });
});
