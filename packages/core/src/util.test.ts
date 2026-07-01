import { describe, expect, it, vi } from "vitest";
import {
  createHashRouteWatcher,
  createHistoryRouteWatcher,
  getCookie,
  getPageUrl,
  getUserAgent,
  getXPath,
  parseRoutePath,
  replaceParam,
  safeJsonStringify,
  setCookie,
  stringifyQuery,
  traceId,
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
      "https://a.test/path?x=2#hash",
    );
    expect(replaceParam("/path?redirect=/a?b=1#tab#inner", "q", "v")).toBe(
      "/path?redirect=%2Fa%3Fb%3D1&q=v#tab#inner",
    );
    expect(replaceParam("/path", "q", "v")).toBe("/path?q=v");
  });

  it("safeJsonStringify 能处理循环引用", () => {
    const value: { name: string; self?: unknown } = { name: "demo" };
    value.self = value;

    expect(safeJsonStringify(value)).toBe('{"name":"demo","self":"[Circular]"}');
  });

  it("traceId 格式稳定可注入随机数", () => {
    expect(traceId({ now: () => 1000, random: () => 0.5 })).toMatch(/^monitor-1000-[a-z0-9]+$/);
  });

  it("读取 cookie 和页面地址时通过参数环境访问", () => {
    expect(getCookie("token", { cookie: "foo=1; token=abc%20123" })).toBe("abc 123");
    expect(getPageUrl({ location: { href: "https://demo.test/home" } })).toBe(
      "https://demo.test/home",
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
      children: [],
    };
    const body: FakeElement = {
      nodeType: 1,
      nodeName: "BODY",
      parentElement: root,
      children: [],
    };
    const div: FakeElement = {
      nodeType: 1,
      nodeName: "DIV",
      id: "app",
      parentElement: body,
      children: [],
    };
    root.children = [body];
    body.children = [div];

    expect(getXPath(div as unknown as Element)).toBe('//*[@id="app"]');
  });

  it("history 和 hash 路由事件工具支持可注入环境", () => {
    const listeners = new Map<string, EventListener>();
    const location = { href: "https://demo.test/a", hash: "#a" };
    const env = {
      get location() {
        return location;
      },
      addEventListener: vi.fn((name: string, listener: EventListener) => {
        listeners.set(name, listener);
      }),
      removeEventListener: vi.fn(),
      history: {
        pushState: vi.fn((_d: unknown, _t: string, url?: string | URL | null) => {
          if (url) location.href = new URL(String(url), location.href).href;
        }),
        replaceState: vi.fn(),
      },
    };
    const onHistory = vi.fn();
    const onHash = vi.fn();

    const stopHistory = createHistoryRouteWatcher(env, onHistory);
    const stopHash = createHashRouteWatcher(env, onHash);
    // pushState 改变路径 → 触发通知
    env.history.pushState({}, "", "/b");
    // popstate 触发但路径未变（pushState 已更新 href）→ 去重抑制
    listeners.get("popstate")?.(new Event("popstate"));
    // pushState 到另一个路径 → 触发通知
    env.history.pushState({}, "", "/c");
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

  it("history 路由 watcher 相同路径不重复通知", () => {
    const env = createRouteEnv();
    const onHistory = vi.fn();

    createHistoryRouteWatcher(env, onHistory);
    // 第一次 push /b
    env.history.pushState({}, "", "/b");
    // 第二次 push /b（相同路径）→ 去重抑制
    env.history.pushState({}, "", "/b");

    expect(onHistory).toHaveBeenCalledTimes(1);
  });

  it("parseRoutePath 提取路径去 query 和 hash", () => {
    expect(parseRoutePath("https://demo.test/a?x=1")).toBe("/a");
    expect(parseRoutePath("/page?q=v")).toBe("/page");
    expect(parseRoutePath("/page#section")).toBe("/page");
    // hash 中包含 query 时保留 hash
    expect(parseRoutePath("/page#/route?id=1")).toBe("/page#/route?id=1");
  });

  it("getCookie raw 选项返回未解码值", () => {
    expect(getCookie("token", { cookie: "token=abc%20123", raw: true })).toBe("abc%20123");
    expect(getCookie("token", { cookie: "token=abc%20123" })).toBe("abc 123");
  });

  it("replaceParam 传 undefined 删除参数", () => {
    expect(replaceParam("https://a.test/path?a=1&b=2", "a", undefined)).toBe(
      "https://a.test/path?b=2",
    );
    expect(replaceParam("https://a.test/path?a=1", "a", undefined)).toBe("https://a.test/path");
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
    expect(getUserAgent({ userAgent: "MonitorTest" })).toBe("MonitorTest");
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
      replaceState: vi.fn(),
    },
  };
}
