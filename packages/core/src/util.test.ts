import { describe, expect, it, vi } from "vitest";
import {
  createHashRouteWatcher,
  createHistoryRouteWatcher,
  getCookie,
  getPageUrl,
  getUserAgent,
  getXPath,
  replaceParam,
  safeJsonStringify,
  setCookie,
  stringifyQuery,
  traceId
} from "./index";

interface FakeElement {
  nodeType: number;
  nodeName: string;
  id?: string;
  parentElement: FakeElement | null;
  children: FakeElement[];
}

describe("util", () => {
  it("stringifyQuery 和 replaceParam 处理 URL 参数", () => {
    expect(stringifyQuery({ a: "x y", b: 2, c: undefined })).toBe("a=x%20y&b=2");
    expect(replaceParam("https://a.test/path?x=1#hash", "x", "2")).toBe(
      "https://a.test/path?x=2#hash"
    );
    expect(replaceParam("/path?redirect=/a?b=1#tab#inner", "q", "v")).toBe(
      "/path?redirect=%2Fa%3Fb%3D1&q=v#tab#inner"
    );
    expect(replaceParam("/path", "q", "v")).toBe("/path?q=v");
  });

  it("safeJsonStringify 能处理循环引用", () => {
    const value: { name: string; self?: unknown } = { name: "demo" };
    value.self = value;

    expect(safeJsonStringify(value)).toBe('{"name":"demo","self":"[Circular]"}');
  });

  it("traceId 格式稳定可注入随机数", () => {
    expect(traceId({ now: () => 1000, random: () => 0.5 })).toMatch(
      /^monitor-1000-[a-z0-9]+$/
    );
  });

  it("读取 cookie 和页面地址时通过参数环境访问", () => {
    expect(getCookie("token", "foo=1; token=abc%20123")).toBe("abc 123");
    expect(getPageUrl({ location: { href: "https://demo.test/home" } })).toBe(
      "https://demo.test/home"
    );
  });

  it("写 cookie 时支持注入 document", () => {
    const doc = { cookie: "" };

    setCookie("token", "abc 123", { document: doc, path: "/", maxAge: 60 });

    expect(doc.cookie).toContain("token=abc%20123");
    expect(doc.cookie).toContain("path=/");
    expect(doc.cookie).toContain("max-age=60");
  });

  it("getXPath 生成节点路径", () => {
    const root: FakeElement = {
      nodeType: 1,
      nodeName: "HTML",
      parentElement: null,
      children: []
    };
    const body: FakeElement = {
      nodeType: 1,
      nodeName: "BODY",
      parentElement: root,
      children: []
    };
    const div: FakeElement = {
      nodeType: 1,
      nodeName: "DIV",
      id: "app",
      parentElement: body,
      children: []
    };
    root.children = [body];
    body.children = [div];

    expect(getXPath(div as unknown as Element)).toBe('//*[@id="app"]');
  });

  it("history 和 hash 路由事件工具支持可注入环境", () => {
    const listeners = new Map<string, EventListener>();
    const env = {
      location: { href: "https://demo.test/a", hash: "#a" },
      addEventListener: vi.fn((name: string, listener: EventListener) => {
        listeners.set(name, listener);
      }),
      removeEventListener: vi.fn(),
      history: {
        pushState: vi.fn(),
        replaceState: vi.fn()
      }
    };
    const onHistory = vi.fn();
    const onHash = vi.fn();

    const stopHistory = createHistoryRouteWatcher(env, onHistory);
    const stopHash = createHashRouteWatcher(env, onHash);
    env.history.pushState({}, "", "/b");
    listeners.get("popstate")?.(new Event("popstate"));
    listeners.get("hashchange")?.(new Event("hashchange"));
    stopHistory();
    stopHash();

    expect(onHistory).toHaveBeenCalledTimes(2);
    expect(onHash).toHaveBeenCalledTimes(1);
    expect(env.removeEventListener).toHaveBeenCalled();
  });

  it("history 路由 watcher 支持多实例独立停止", () => {
    const env = createRouteEnv();
    const first = vi.fn();
    const second = vi.fn();

    const stopFirst = createHistoryRouteWatcher(env, first);
    const stopSecond = createHistoryRouteWatcher(env, second);
    stopFirst();
    env.history.pushState({}, "", "/b");
    stopSecond();
    env.history.pushState({}, "", "/c");

    expect(first).toHaveBeenCalledTimes(0);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("history 路由 watcher 支持相同 handler 重复注册和 stop 幂等", () => {
    const env = createRouteEnv();
    const handler = vi.fn();

    const stopFirst = createHistoryRouteWatcher(env, handler);
    const stopSecond = createHistoryRouteWatcher(env, handler);
    stopFirst();
    env.history.pushState({}, "", "/b");
    stopSecond();
    const stopThird = createHistoryRouteWatcher(env, handler);
    stopFirst();
    env.history.pushState({}, "", "/c");
    stopThird();

    expect(handler).toHaveBeenCalledTimes(2);
  });

  it("UA 工具支持注入环境且不依赖顶层 navigator", () => {
    expect(getUserAgent({ navigator: { userAgent: "MonitorTest" } })).toBe("MonitorTest");
  });
});

function createRouteEnv() {
  const listeners = new Map<string, EventListener>();

  return {
    location: { href: "https://demo.test/a" },
    addEventListener: vi.fn((name: string, listener: EventListener) => {
      listeners.set(name, listener);
    }),
    removeEventListener: vi.fn(),
    history: {
      pushState: vi.fn(),
      replaceState: vi.fn()
    }
  };
}
