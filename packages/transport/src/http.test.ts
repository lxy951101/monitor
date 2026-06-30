import { describe, expect, it, vi } from "vitest";
import { createXhrTransport, type XhrConstructor } from "./index";

class FakeXMLHttpRequest {
  static instances: FakeXMLHttpRequest[] = [];

  method = "";
  url = "";
  body: unknown;
  status = 200;
  responseText = "ok";
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  headers = new Map<string, string>();

  constructor() {
    FakeXMLHttpRequest.instances.push(this);
  }

  open(method: string, url: string): void {
    this.method = method;
    this.url = url;
  }

  setRequestHeader(key: string, value: string): void {
    this.headers.set(key, value);
  }

  send(body?: unknown): void {
    this.body = body;
  }
}

describe("createXhrTransport", () => {
  it("支持注入 XMLHttpRequest 并发送 POST、headers、body", async () => {
    const transport = createXhrTransport({
      XMLHttpRequest: FakeXMLHttpRequest as unknown as XhrConstructor
    });
    const promise = transport.send({
      method: "POST",
      url: "https://example.com/api",
      headers: { "content-type": "text/plain" },
      body: "payload"
    });
    const xhr = FakeXMLHttpRequest.instances.at(-1);

    xhr?.onload?.();
    await expect(promise).resolves.toEqual({
      ok: true,
      status: 200,
      body: "ok"
    });
    expect(xhr?.method).toBe("POST");
    expect(xhr?.url).toBe("https://example.com/api");
    expect(xhr?.headers.get("content-type")).toBe("text/plain");
    expect(xhr?.body).toBe("payload");
  });

  it("支持 GET 成功和 HTTP 失败", async () => {
    const transport = createXhrTransport({
      XMLHttpRequest: FakeXMLHttpRequest as unknown as XhrConstructor
    });
    const success = transport.send({ method: "GET", url: "/ok" });
    const okXhr = FakeXMLHttpRequest.instances.at(-1);

    okXhr?.onload?.();
    await expect(success).resolves.toMatchObject({ ok: true, status: 200 });
    expect(okXhr?.body).toBeUndefined();

    const failed = transport.send({ method: "GET", url: "/failed" });
    const failXhr = FakeXMLHttpRequest.instances.at(-1);
    if (failXhr) {
      failXhr.status = 500;
      failXhr.responseText = "failed";
      failXhr.onload?.();
    }

    await expect(failed).rejects.toMatchObject({ status: 500 });
  });

  it("网络错误时返回 rejected Promise", async () => {
    const transport = createXhrTransport({
      XMLHttpRequest: FakeXMLHttpRequest as unknown as XhrConstructor
    });
    const promise = transport.send({ method: "POST", url: "/failed" });

    FakeXMLHttpRequest.instances.at(-1)?.onerror?.();

    await expect(promise).rejects.toThrow("XMLHttpRequest failed");
  });

  it("未提供 XMLHttpRequest 时失败可观测", async () => {
    const transport = createXhrTransport();

    await expect(transport.send({ method: "GET", url: "/missing" })).rejects.toThrow(
      "XMLHttpRequest is not available"
    );
  });
});
