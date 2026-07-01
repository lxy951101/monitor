# @monitor/core

前端监控 SDK 核心库。提供配置管理、事件总线、插件生命周期、日志，以及一组与浏览器环境解耦的通用工具函数。

## 架构概览

```
┌─────────────────────────────────────────────────┐
│                  MonitorCore                     │
│  (插件注册 · start/stop 生命周期 · 依赖注入)        │
├──────────────┬──────────────┬───────────────────┤
│  CfgManager  │  EventBus    │  Logger           │
│  配置中心     │  类型安全事件  │  devMode 门控日志  │
├──────────────┴──────────────┴───────────────────┤
│                 Plugin[]                         │
│  (name · start(context) · stop?(context))        │
├─────────────────────────────────────────────────┤
│                  Transport                       │
│  (send) ── 数据上报通道                           │
└─────────────────────────────────────────────────┘
```

`MonitorCore` 不包含任何业务逻辑（不自动捕获错误、不自动采集性能）。所有能力由外部插件通过 `use()` 注入，通过 `start()` 统一启动。

---

## 核心类

### MonitorCore

SDK 顶层编排器。管理插件生命周期和配置同步。

```typescript
import { MonitorCore } from "@monitor/core";

const core = new MonitorCore(
  { project: "my-app", devMode: false },  // CoreConfigPatch
  { transport: myTransport }               // MonitorCoreOptions
);

core.use(errorPlugin);
core.use(pagePlugin);
core.start();
```

| 方法 | 说明 |
|------|------|
| `use(plugin)` | 注册插件。若已 start 则立即启动该插件，返回 `this` 支持链式调用 |
| `start(config?)` | 启动所有插件（按注册顺序）。可选传入配置 patch。幂等——重复调用无副作用 |
| `stop()` | 停止所有插件（按注册逆序），清空 EventBus。可再次 `start()` |
| `config(patch)` | 更新配置并同步 devMode 到 Logger |
| `setConfig(key, value)` | 单项配置更新 |
| `getConfig()` / `getConfig(key)` | 读取配置（返回 deep clone） |
| `isStarted()` | 查询启动状态 |

**生命周期顺序：**

```
constructor → use() × N → start() → [运行] → stop() → start() → ...
                            ↑                     │
                    插件按序 start()    插件逆序 stop() → eventBus.clear()
```

### CfgManager

配置管理中心。支持采样决策、自定义维度（extensions）、过滤器、API URL 构造、远程采样回写。

#### 采样机制

采用**随机采样**，支持三级优先级：

```
远程采样 > 本地配置采样 > 默认值(1，即 100%)
```

```typescript
cfg.isSampled("page");    // → boolean
cfg.isSampled("custom-key"); // 也支持自定义 key（从 custom 桶查询）
```

- `sample >= 1` → 直接返回 `true`
- `sample <= 0` → 直接返回 `false`
- `0 < sample < 1` → 比较 `random() < sample`
- `random` 函数可注入（`setRandom`），便于测试

`SampleKey` 标准集合：`page | resource | ajax | api | error | metric`

#### 远程采样 Key 映射

服务端下发的采样 key 可能与本地 `SampleKey` 不一致。`CfgManager` 内置了默认映射表：

| 远程 key | 本地 SampleKey |
|----------|---------------|
| `performance` | `page` |
| `request` | `api` |
| `log` | `error` |
| `resource` | `resource` |

已知的 `SampleKey` 直接透传，未识别的 key 落入 `custom` 桶。映射表可通过 `CfgManagerOptions.remoteSamplingKeyMap` 覆盖。

```typescript
cfg.applyRemoteSampling({
  performance: 0.3,   // → page
  request: 0.5,        // → api
  my_feature: 0.1      // → custom["my_feature"]
});
cfg.isSampled("my_feature"); // 从 custom 桶查找
```

#### API URL 构造

`getApiPath(key, extraQuery)` 按以下步骤构造请求 URL：

1. 查 `config.endpoints[key]`，未配置则回退到内置 `API_PATHS`
2. 拼接到 `config.reportBaseUrl` 后
3. 附加 query 参数：`project`、所有 `extensions`、`webVersion`（若有）
4. 每个 project 首次请求附加 `st=1`

#### Extensions（自定义维度）

全局键值对，自动附加到每个 API 请求的 query 中：

```typescript
cfg.setExtension("region", "east");
cfg.setExtension("region", undefined); // 删除
cfg.getExtensions(); // → { ... }
```

#### Filters（过滤器）

命名过滤器函数，通过 `runFilter` 安全执行（异常返回 `true`，不阻断流程）：

```typescript
cfg.addFilter("block-spam", (url) => !url.includes("spam"));
cfg.runFilter("block-spam", someUrl); // false 表示被拦截
cfg.removeFilter("block-spam");
```

### EventBus

类型安全的泛型发布-订阅事件总线，供插件间解耦通信。

```typescript
import { EventBus } from "@monitor/core";

type MyEvents = {
  error: [message: string, code: number];
  ready: [];
};

const bus = new EventBus<MyEvents>();

const unsub = bus.on("error", (msg, code) => { ... });
bus.once("ready", () => console.log("fired once"));
bus.emit("error", "timeout", 408);
unsub();                          // 取消订阅
bus.off("error");                 // 移除该事件全部监听器
bus.clear();                      // 清空所有事件
```

**内部机制：**

| 特性 | 实现方式 |
|------|---------|
| 故障隔离 | `emit` 中每个 listener 包裹 try-catch，单个异常不阻断后续 listener |
| 迭代安全 | `emit` 前对 listener 集合做快照 `[...set]`，避免遍历中增删导致的问题 |
| once | 创建 wrapper 函数，触发时自动 `off` 并调用原始 listener |
| 内存 | `off` 删除 listener 且 Set 为空时清理 Map 条目 |

### Logger

`devMode` 门控的轻量日志器，默认不输出。

```typescript
const logger = new Logger(false);        // 静默
logger.setDevMode(true);
logger.log("debug info");                // 此时才输出
logger.warn("warning");
```

支持注入 `ConsoleLike` 接口用于测试或自定义输出。

### Plugin 接口

```typescript
export interface Plugin {
  name: string;
  start: (context: MonitorContext) => void;
  stop?: (context?: MonitorContext) => void;
}

export interface MonitorContext {
  cfgManager: CfgManager;
  eventBus: EventBus;
  transport: Transport;
  logger: Logger;
}
```

插件通过 `context` 接收依赖，不直接依赖全局变量，可测试、可替换。

---

## 工具函数

### 环境检测 `util/env`

| 函数 | 说明 |
|------|------|
| `isBrowserEnv()` | `typeof window !== "undefined" && typeof document !== "undefined"` |
| `getUserAgent(navigatorLike?)` | 读取 UA，支持注入便于测试 |
| `isMobileUserAgent(ua?)` | 正则匹配 `android\|iphone\|ipad\|ipod\|mobile` |
| `checkIsSpider(ua?, patterns?)` | 爬虫检测，默认匹配 14 种常见 bot（Baiduspider, Googlebot 等），patterns 可自定义 |
| `getOsByUA(ua?)` | 从 UA 提取操作系统：`iOS` / `Android` / `Mac` / `Windows` / `Linux` |
| `getConnectionType()` | `navigator.connection.effectiveType`，降级到 UA 中 `NetType/` 字段 |

### URL 工具 `util/url`

| 函数 | 说明 |
|------|------|
| `stringifyQuery(query)` | 将对象转为 URL query string，自动 `encodeURIComponent`，过滤 `undefined` |
| `replaceParam(url, key, value)` | 替换/添加/删除（`value=undefined`）URL 参数，使用 `URLSearchParams` 标准解析，保留 hash |
| `getFullUrl(url, base?)` | 解析协议相对路径 `//` 和根路径 `/` 为完整 URL |
| `checkSameOrigin(url, origin?)` | 使用 `URL` 构造函数判断同源，SSR 安全 |

### 路由监听 `util/route`

#### 路径去重原理

`parseRoutePath(url)` 从 URL 中提取纯路由路径（去除协议、host、query）：

```
"https://demo.test/a?x=1"  →  "/a"
"/page?q=v"                 →  "/page"
"/page#/route?id=1"         →  "/page#/route?id=1"  (保留 hash 中的 query)
```

`createHistoryRouteWatcher` 通过 monkey-patch `history.pushState` / `history.replaceState` + 监听 `popstate` 实现 History API 路由变更检测。内部维护 `lastPath` 变量追踪上次通知路径，**相同路径不重复通知**。

```typescript
const stop = createHistoryRouteWatcher(
  env,
  (url) => console.log("route changed:", url),
  (err) => console.error("handler error:", err)  // 可选异常回调
);
stop(); // 恢复原始 history 方法
```

**实现细节：**

- 使用模块级 `WeakMap<history, State>` 确保**同一 `history` 对象共享同一套 monkey-patch**，避免重复包装
- 所有订阅者退出后自动恢复原始 `pushState`/`replaceState`，移除 `popstate` 监听
- handler 执行包裹 try-catch，异常通过可选的 `onError` 回调处理，不中断其他订阅者

`createHashRouteWatcher` 基于 `hashchange` 事件，更简单直接。

### Cookie `util/cookie`

```typescript
getCookie("token");                          // 解码值
getCookie("token", { raw: true });           // 原始值，不解码
getCookie("token", { cookie: "a=1; b=2" });  // 注入 cookie 字符串（SSR/测试）

setCookie("token", "abc 123", {
  path: "/", maxAge: 3600, domain: ".example.com",
  sameSite: "Lax", secure: true
});
```

### 性能元数据 `util/perf-metadata`

一次调用采集当前页面的完整运行时快照：

```typescript
const meta = createPerfMetadata({
  project: "my-app",
  version: "1.0.0",
  sdkVersion: "2.0.0",
  runEnv: "browser",
  runtime: myCustomRuntime  // 可选注入，默认读取 window.*
});

// meta = { project, version, pageUrl, ua, screen: "1920x1080",
//          visitId: "1719845678123-a1b2c3d4e5f6", networkType: "4g",
//          isOffline: false, pageNavStart: 1719845678123, ... }
```

**visitId 生成：** 优先使用 `crypto.getRandomValues`（6 字节随机 hex），不可用时降级到 `Math.random`。格式：`{Date.now()}-{12位随机hex}`。

### 其他工具

| 文件 | 导出 | 说明 |
|------|------|------|
| `util/guid` | `guid()` | UUID v4 格式随机 ID（优先 crypto），适用于 pageId 等 |
| `util/trace` | `traceId(options?)` | 格式 `monitor-{timestamp}-{base36随机数}`，支持注入 now/random |
| `util/json` | `safeJsonStringify(value)` | JSON.stringify 防循环引用，遇到循环输出 `"[Circular]"` |
| `util/xpath` | `getXPath(element)` | 生成元素的 XPath 表达式，有 id 时简化为 `//*[@id="..."]`，否则走标签+位置索引 |
| `util/page` | `getPageUrl(env?)` | 读取当前页面完整 URL，SSR 安全 |
| `util/deep-copy` | `deepCopy(value)` | 递归深拷贝（Array + 纯对象），不处理 Date/Map/Set 等特殊类型 |
| `util/tags` | `formatTags(tags)` | 将 mixed 值转为 `Record<string, string>`：primitive 直转 string，复杂类型 JSON.stringify，null/undefined 跳过 |

---

## 目录结构

```
packages/core/src/
├── index.ts              # 顶层 re-export
├── config-manager.ts     # CfgManager — 配置中心 + 采样 + 远程配置
├── event-bus.ts          # EventBus — 泛型发布-订阅
├── logger.ts             # Logger — devMode 门控日志
├── monitor-core.ts       # MonitorCore — 顶层编排器
├── plugin.ts             # Plugin 接口 + MonitorContext 类型
└── util/
    ├── index.ts          # util 子模块 re-export
    ├── cookie.ts         # getCookie / setCookie
    ├── deep-copy.ts      # deepCopy
    ├── env.ts            # isBrowserEnv / getUserAgent / checkIsSpider / getOsByUA / getConnectionType
    ├── guid.ts           # guid (UUID v4)
    ├── json.ts           # safeJsonStringify (防循环)
    ├── page.ts           # getPageUrl
    ├── perf-metadata.ts  # createPerfMetadata
    ├── route.ts          # parseRoutePath / createHistoryRouteWatcher / createHashRouteWatcher
    ├── tags.ts           # formatTags
    ├── trace.ts          # traceId
    ├── url.ts            # stringifyQuery / replaceParam / getFullUrl / checkSameOrigin
    └── xpath.ts          # getXPath
```
