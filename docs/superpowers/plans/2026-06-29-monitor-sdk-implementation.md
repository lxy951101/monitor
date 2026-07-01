# 监控 SDK 实施计划

> **面向代理执行者：** 必需子技能：实现本计划时使用 `superpowers:subagent-driven-development`（推荐）或 `superpowers:executing-plans`。每个任务按复选框逐步推进；每个行为变更必须先写失败测试，再写实现。

**目标：** 按已确认设计实现一个以 `Monitor` 命名、协议和行为尽量兼容 OWL 1.13.5 的 TypeScript 多包监控 SDK。

**架构：** 使用 PNPM workspace 拆分配置、协议、传输、核心、插件、聚合 SDK、mock-server 和演示验证应用。`packages/sdk` 只做默认组装和全局入口，采集能力全部在独立插件包中实现；默认暴露 `window.Monitor`、`window.monitor`、`window._Monitor_`，旧 `Owl` 命名只作为显式兼容别名。

**技术栈：** TypeScript、PNPM、Vite、Vitest、Node HTTP 服务、浏览器原生 Performance API、MutationObserver、XMLHttpRequest、fetch、sendBeacon。

---

## 全局执行规则

- 所有新增源码文件保持 600 行以内，函数保持 120 行以内。
- 每个任务先写测试，运行并确认失败，再写最小实现，最后运行相关测试。
- 每个任务独立提交，提交信息使用中文或规范英文均可，但要能说明变更范围。
- 不修改 `refer/owl_1.13.5.js`。
- 不覆盖用户已有改动；当前已知 `AGENTS.MD` 有未提交改动，执行计划时继续避开它。
- 技术名词和包名可保留英文，说明文字使用中文。

## 文件结构总览

执行完成后应形成如下主要结构：

```text
apps/
  mock-server/
    package.json
    src/
      index.ts
      parser.ts
      store.ts
  playground/
    index.html
    package.json
    src/
      main.ts
      style.css
packages/
  config/
  protocol/
  transport/
  core/
  plugin-error/
  plugin-resource/
  plugin-page/
  plugin-pv/
  plugin-metric/
  plugin-logan/
  plugin-horn/
  plugin-perf-fsp/
  plugin-perf-ird/
  plugin-perf-shr/
  plugin-perf-cache/
  sdk/
```

每个 `packages/*` 子项目至少包含：

```text
package.json
src/index.ts
tsconfig.json
vitest.config.ts
```

测试文件与源码同包放置在 `src/**/*.test.ts`。

## 任务 1：初始化工作区与公共构建配置

**文件：**
- 创建：`package.json`
- 创建：`pnpm-workspace.yaml`
- 创建：`tsconfig.base.json`
- 创建：`vitest.workspace.ts`
- 创建：`scripts/check-size.mjs`
- 修改：`README.md`

- [ ] **步骤 1：写失败测试或失败检查**

运行：

```bash
pnpm -r test
```

预期：失败，原因是根项目尚未声明 workspace 和测试脚本。

- [ ] **步骤 2：创建根工作区配置**

`package.json` 要包含：

```json
{
  "name": "monitor-workspace",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "pnpm -r build",
    "typecheck": "pnpm -r typecheck",
    "test": "vitest --workspace vitest.workspace.ts",
    "test:run": "vitest run --workspace vitest.workspace.ts",
    "check:size": "node scripts/check-size.mjs"
  },
  "devDependencies": {
    "@types/node": "^20.14.0",
    "typescript": "^5.5.0",
    "vite": "^5.4.0",
    "vitest": "^2.0.0"
  },
  "packageManager": "pnpm@9.0.0"
}
```

`pnpm-workspace.yaml` 要覆盖：

```yaml
packages:
  - "packages/*"
  - "apps/*"
```

- [ ] **步骤 3：创建 TypeScript 与 Vitest 基线**

`tsconfig.base.json` 要启用严格模式、DOM 类型和 ES2022 输出；`vitest.workspace.ts` 要扫描 `packages/*` 与 `apps/*`。

- [ ] **步骤 4：创建尺寸检查脚本**

`scripts/check-size.mjs` 检查 `packages/**/src/**/*.ts` 与 `apps/**/src/**/*.ts` 文件行数不超过 600，并用简单语法扫描约束普通函数、类方法和箭头函数主体不超过 120 行。脚本发现超限时输出文件路径、函数名和行号。

- [ ] **步骤 5：验证**

运行：

```bash
pnpm install
pnpm test:run
pnpm check:size
```

预期：安装成功；测试命令因暂时无测试文件而通过或提示无测试；尺寸检查通过。

- [ ] **步骤 6：提交**

```bash
git add package.json pnpm-workspace.yaml tsconfig.base.json vitest.workspace.ts scripts/check-size.mjs README.md
git commit -m "chore: 初始化监控 SDK 工作区"
```

## 任务 2：创建所有子项目壳与包依赖关系

**文件：**
- 创建：`packages/*/package.json`
- 创建：`packages/*/tsconfig.json`
- 创建：`packages/*/vite.config.ts`
- 创建：`packages/*/vitest.config.ts`
- 创建：`packages/*/src/index.ts`
- 创建：`apps/mock-server/package.json`
- 创建：`apps/playground/package.json`

- [ ] **步骤 1：写失败检查**

运行：

```bash
pnpm -r typecheck
```

预期：失败，原因是子项目尚不存在。

- [ ] **步骤 2：创建包命名规则**

所有包使用 `@monitor/*` 命名，例如：

```json
{
  "name": "@monitor/core",
  "version": "0.0.0",
  "type": "module",
  "main": "dist/index.cjs",
  "module": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "vite build",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  }
}
```

- [ ] **步骤 3：声明依赖方向**

依赖方向必须保持单向：

```text
config <- protocol <- transport <- core <- plugins <- sdk
```

`protocol` 可以依赖 `config`；`transport` 可以依赖 `config` 和 `protocol`；插件可以依赖 `core`、`protocol`、`transport`；`sdk` 依赖所有插件。

- [ ] **步骤 4：创建最小导出**

每个 `src/index.ts` 暂时导出包名常量，例如：

```ts
export const packageName = "@monitor/core";
```

- [ ] **步骤 5：验证**

运行：

```bash
pnpm -r typecheck
pnpm -r build
```

预期：所有空壳包通过类型检查和构建。

- [ ] **步骤 6：提交**

```bash
git add packages apps
git commit -m "chore: 创建监控 SDK 多包结构"
```

## 任务 3：实现配置包

**文件：**
- 创建：`packages/config/src/defaults.ts`
- 创建：`packages/config/src/endpoints.ts`
- 创建：`packages/config/src/types.ts`
- 创建：`packages/config/src/merge.ts`
- 创建：`packages/config/src/index.ts`
- 创建：`packages/config/src/config.test.ts`

- [ ] **步骤 1：写失败测试**

测试覆盖：

```ts
import { describe, expect, it } from "vitest";
import { createDefaultConfig, getReportBaseUrl, mergeMonitorConfig } from "./index";

describe("配置包", () => {
  it("默认使用生产上报域名", () => {
    expect(getReportBaseUrl(false)).toBe("https://catfront.dianping.com");
  });

  it("开发模式使用测试上报域名", () => {
    expect(getReportBaseUrl(true)).toBe("https://catfront.51ping.com");
  });

  it("深合并用户配置且保留 compat 默认值", () => {
    const config = mergeMonitorConfig(createDefaultConfig(), {
      project: "demo",
      compat: { legacyOwlAlias: true },
      page: { delay: 10 }
    });
    expect(config.project).toBe("demo");
    expect(config.compat.legacyOwlAlias).toBe(true);
    expect(config.page.delay).toBe(10);
    expect(config.autoCatch.js).toBe(true);
  });
});
```

运行：

```bash
pnpm --filter @monitor/config test
```

预期：失败，提示导出不存在。

- [ ] **步骤 2：实现默认配置**

实现 `MonitorConfig`、`AutoCatchConfig`、`PerfConfig` 等类型；默认配置包含设计文档列出的 `autoCatch`、`page`、`SPA`、`resource`、`ajax`、`image`、`error`、`metric`、`logan`、`perf`、`bridge`、`compat`。

- [ ] **步骤 3：实现地址配置**

`endpoints.ts` 导出生产/测试域名、api path、Horn 地址、Logan CDN 前缀、Perf 默认端点。

- [ ] **步骤 4：实现配置合并**

`mergeMonitorConfig` 对普通对象做浅层递归合并；数组、正则、函数直接覆盖；`resourceReg` 支持字符串转 `RegExp`。

- [ ] **步骤 5：验证**

运行：

```bash
pnpm --filter @monitor/config test
pnpm --filter @monitor/config typecheck
```

预期：全部通过。

- [ ] **步骤 6：提交**

```bash
git add packages/config
git commit -m "feat: 实现监控默认配置包"
```

## 任务 4：实现协议模型与序列化

**文件：**
- 创建：`packages/protocol/src/error.ts`
- 创建：`packages/protocol/src/page.ts`
- 创建：`packages/protocol/src/resource.ts`
- 创建：`packages/protocol/src/metric.ts`
- 创建：`packages/protocol/src/pv.ts`
- 创建：`packages/protocol/src/perf.ts`
- 创建：`packages/protocol/src/query.ts`
- 创建：`packages/protocol/src/index.ts`
- 创建：`packages/protocol/src/*.test.ts`

- [ ] **步骤 1：写错误协议失败测试**

测试：

```ts
import { describe, expect, it } from "vitest";
import { createErrorModel, encodeErrorBody } from "./index";

describe("错误协议", () => {
  it("生成 OWL 兼容错误体", () => {
    const model = createErrorModel({
      project: "demo",
      pageUrl: "/home",
      realUrl: "https://example.com/home",
      category: "jsError",
      sec_category: "boom",
      level: "error",
      content: "stack"
    });
    const body = encodeErrorBody([model]);
    expect(body.startsWith("c=")).toBe(true);
    expect(decodeURIComponent(body.slice(2))).toContain("\"sec_category\":\"boom\"");
  });
});
```

运行：

```bash
pnpm --filter @monitor/protocol test
```

预期：失败，提示协议函数不存在。

- [ ] **步骤 2：写资源协议失败测试**

覆盖字段顺序：

```ts
import { describe, expect, it } from "vitest";
import { RESOURCE_FIELD_ORDER, createResourceModel, encodeResourceTextBatch } from "./index";

describe("资源协议", () => {
  it("按固定字段顺序编码资源", () => {
    expect(RESOURCE_FIELD_ORDER.slice(0, 4)).toEqual(["resourceUrl", "connectType", "type", "timestamp"]);
    const item = createResourceModel({
      resourceUrl: "https://example.com/a.js",
      connectType: "https",
      type: "js",
      project: "demo",
      pageUrl: "/home",
      realUrl: "https://example.com/home",
      responsetime: "12",
      statusCode: "200|"
    });
    const text = encodeResourceTextBatch({ infos: [item] });
    expect(text).toContain("https://example.com/a.js");
    expect(text).toContain("\"infos\"");
  });
});
```

- [ ] **步骤 3：实现错误、页面、PV、metric、resource、perf 模型**

每个模型只负责字段默认值、字段清洗和编码，不发请求，不读取浏览器全局状态。

- [ ] **步骤 4：实现 protobuf batch 的接口壳**

先实现 `encodeResourceProtobufBatch(data): Uint8Array`，内部可用最小 writer 覆盖字段顺序。测试先断言返回 `Uint8Array` 且非空；后续对照参考文件补更细的二进制快照。

- [ ] **步骤 5：验证**

运行：

```bash
pnpm --filter @monitor/protocol test
pnpm --filter @monitor/protocol typecheck
```

预期：全部通过。

- [ ] **步骤 6：提交**

```bash
git add packages/protocol
git commit -m "feat: 实现监控上报协议模型"
```

## 任务 5：实现传输层

**文件：**
- 创建：`packages/transport/src/http.ts`
- 创建：`packages/transport/src/beacon.ts`
- 创建：`packages/transport/src/cache.ts`
- 创建：`packages/transport/src/bridge.ts`
- 创建：`packages/transport/src/queue.ts`
- 创建：`packages/transport/src/index.ts`
- 创建：`packages/transport/src/*.test.ts`

- [ ] **步骤 1：写队列失败测试**

测试：

```ts
import { describe, expect, it, vi } from "vitest";
import { ReportQueue } from "./index";

describe("ReportQueue", () => {
  it("达到阈值时立即发送并清空缓存", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const queue = new ReportQueue({ maxLength: 2, delay: 1000, send });
    queue.add({ type: "a" });
    queue.add({ type: "b" });
    await queue.flush();
    expect(send).toHaveBeenCalledTimes(1);
    expect(queue.size()).toBe(0);
  });
});
```

运行：

```bash
pnpm --filter @monitor/transport test
```

预期：失败，提示 `ReportQueue` 不存在。

- [ ] **步骤 2：实现 XHR/fetch 无关的发送接口**

定义 `TransportRequest`、`TransportResponse`、`Transport`。浏览器 XHR 发送、sendBeacon 发送和 bridge 发送都实现同一接口。

- [ ] **步骤 3：实现 localStorage 缓存管理**

缓存管理支持 `get`、`save`、`clear`，并捕获 storage 异常；测试用内存 storage mock。

- [ ] **步骤 4：实现通用容器 bridge 包装**

只封装调用参数和缓存队列，不假设真实容器存在；容器 API 由注入对象提供。

- [ ] **步骤 5：验证**

运行：

```bash
pnpm --filter @monitor/transport test
pnpm --filter @monitor/transport typecheck
```

预期：全部通过。

- [ ] **步骤 6：提交**

```bash
git add packages/transport
git commit -m "feat: 实现监控传输层"
```

## 任务 6：实现核心包

**文件：**
- 创建：`packages/core/src/config-manager.ts`
- 创建：`packages/core/src/event-bus.ts`
- 创建：`packages/core/src/logger.ts`
- 创建：`packages/core/src/monitor-core.ts`
- 创建：`packages/core/src/plugin.ts`
- 创建：`packages/core/src/util/*.ts`
- 创建：`packages/core/src/index.ts`
- 创建：`packages/core/src/*.test.ts`

- [ ] **步骤 1：写核心失败测试**

测试：

```ts
import { describe, expect, it, vi } from "vitest";
import { MonitorCore } from "./index";

describe("MonitorCore", () => {
  it("按顺序启动插件并暴露 API", () => {
    const start = vi.fn();
    const monitor = new MonitorCore({ project: "demo" });
    monitor.use({ name: "demo", start });
    monitor.start();
    expect(start).toHaveBeenCalledTimes(1);
    expect(monitor.getConfig("project")).toBe("demo");
  });
});
```

运行：

```bash
pnpm --filter @monitor/core test
```

预期：失败，提示 `MonitorCore` 不存在。

- [ ] **步骤 2：实现 `CfgManager`**

包含配置读取、配置更新、API URL 生成、采样判断、扩展维度、过滤器管理、远端 sampling 回写。

- [ ] **步骤 3：实现 `EventBus` 和插件接口**

插件接口包含 `name`、`start(context)`、可选 `stop()`；context 提供 cfgManager、eventBus、transport、logger。

- [ ] **步骤 4：实现工具函数**

拆分为 URL、cookie、UA、traceid、XPath、路由监听、JSON 安全 stringify。每个工具文件单一职责。

- [ ] **步骤 5：验证**

运行：

```bash
pnpm --filter @monitor/core test
pnpm --filter @monitor/core typecheck
```

预期：全部通过。

- [ ] **步骤 6：提交**

```bash
git add packages/core
git commit -m "feat: 实现监控核心运行时"
```

## 任务 7：实现错误插件

**文件：**
- 创建：`packages/plugin-error/src/error-manager.ts`
- 创建：`packages/plugin-error/src/capture.ts`
- 创建：`packages/plugin-error/src/cache.ts`
- 创建：`packages/plugin-error/src/index.ts`
- 创建：`packages/plugin-error/src/*.test.ts`

- [ ] **步骤 1：写失败测试**

测试：

```ts
import { describe, expect, it, vi } from "vitest";
import { ErrorManager } from "./index";

describe("ErrorManager", () => {
  it("解析 Error 并发送 c= 编码请求体", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const manager = new ErrorManager({
      project: "demo",
      pageUrl: "/home",
      send
    });
    manager.addError(new Error("boom"));
    await manager.flush();
    expect(send.mock.calls[0][0].body).toContain("c=");
    expect(decodeURIComponent(send.mock.calls[0][0].body)).toContain("boom");
  });
});
```

运行：

```bash
pnpm --filter @monitor/plugin-error test
```

预期：失败，提示 `ErrorManager` 不存在。

- [ ] **步骤 2：实现手动错误上报**

支持 `addError`、`sendErrors`、错误去重、maxSize、maxNum、maxTime、ignoreList、过滤器。

- [ ] **步骤 3：实现自动采集**

接管 `window.onerror`、`unhandledrejection`、可选 `console.error`；patch 要幂等并保留原始处理函数。

- [ ] **步骤 4：实现页面离开缓存**

按 `useSendBeacon` 与 `disableCache` 决定 sendBeacon 或 localStorage 缓存。

- [ ] **步骤 5：验证**

运行：

```bash
pnpm --filter @monitor/plugin-error test
pnpm --filter @monitor/plugin-error typecheck
```

预期：全部通过。

- [ ] **步骤 6：提交**

```bash
git add packages/plugin-error
git commit -m "feat: 实现错误采集插件"
```

## 任务 8：实现 PV 与自定义指标插件

**文件：**
- 创建：`packages/plugin-pv/src/pv-manager.ts`
- 创建：`packages/plugin-pv/src/spa.ts`
- 创建：`packages/plugin-pv/src/index.ts`
- 创建：`packages/plugin-metric/src/metric-manager.ts`
- 创建：`packages/plugin-metric/src/index.ts`
- 创建：`packages/plugin-pv/src/*.test.ts`
- 创建：`packages/plugin-metric/src/*.test.ts`

- [ ] **步骤 1：写 PV 失败测试**

测试：

```ts
import { describe, expect, it, vi } from "vitest";
import { PvManager } from "./index";

describe("PvManager", () => {
  it("发送 Monitor 命名下的 PV 参数", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const manager = new PvManager({ project: "demo", pageUrl: "/home", send });
    await manager.report({ ctags: { scene: "case" } });
    const url = send.mock.calls[0][0].url;
    expect(url).toContain("/api/pvts");
    expect(url).toContain("project=demo");
    expect(url).toContain("ctags=");
  });
});
```

- [ ] **步骤 2：写 metric 失败测试**

覆盖 `setMetric`、`setTags`、`report` 生成 `{ tvs, datas }`。

- [ ] **步骤 3：实现 PV**

支持自动 PV、`reportPv`、`resetPv`、SPA 自动 PV、维度与 custom tags 编码。

- [ ] **步骤 4：实现 metric**

支持采样、combo 延迟、失败时通过错误插件上报 SDK 告警。

- [ ] **步骤 5：验证**

运行：

```bash
pnpm --filter @monitor/plugin-pv test
pnpm --filter @monitor/plugin-metric test
pnpm --filter @monitor/plugin-pv typecheck
pnpm --filter @monitor/plugin-metric typecheck
```

预期：全部通过。

- [ ] **步骤 6：提交**

```bash
git add packages/plugin-pv packages/plugin-metric
git commit -m "feat: 实现 PV 和自定义指标插件"
```

## 任务 9：实现资源与 API 插件

**文件：**
- 创建：`packages/plugin-resource/src/ajax.ts`
- 创建：`packages/plugin-resource/src/fetch.ts`
- 创建：`packages/plugin-resource/src/resource-manager.ts`
- 创建：`packages/plugin-resource/src/resource-observer.ts`
- 创建：`packages/plugin-resource/src/index.ts`
- 创建：`packages/plugin-resource/src/*.test.ts`

- [ ] **步骤 1：写 XHR patch 失败测试**

测试 patch 幂等和事件触发：

```ts
import { describe, expect, it, vi } from "vitest";
import { createAjaxInterceptor } from "./index";

describe("ajax 拦截", () => {
  it("重复启动只 patch 一次", () => {
    const win = { XMLHttpRequest: class FakeXHR {} } as unknown as Window;
    const onCall = vi.fn();
    const interceptor = createAjaxInterceptor({ window: win, onCall });
    interceptor.start();
    interceptor.start();
    expect(interceptor.isStarted()).toBe(true);
  });
});
```

- [ ] **步骤 2：实现 XHR/fetch 拦截**

保留原始方法，记录耗时、状态码、traceid，过滤自身上报请求。

- [ ] **步骤 3：实现资源 PerformanceEntry 采集**

解析 script、link、img、css；支持图片大小和耗时异常；支持 PerformanceObserver 与回退轮询。

- [ ] **步骤 4：实现资源加载错误**

监听捕获阶段 error，处理 script/link/img，并按协议上报 API 或错误。

- [ ] **步骤 5：验证**

运行：

```bash
pnpm --filter @monitor/plugin-resource test
pnpm --filter @monitor/plugin-resource typecheck
```

预期：全部通过。

- [ ] **步骤 6：提交**

```bash
git add packages/plugin-resource
git commit -m "feat: 实现资源和 API 采集插件"
```

## 任务 10：实现页面性能与老首屏插件

**文件：**
- 创建：`packages/plugin-page/src/page-manager.ts`
- 创建：`packages/plugin-page/src/navigation-timing.ts`
- 创建：`packages/plugin-page/src/first-screen.ts`
- 创建：`packages/plugin-page/src/route-fst.ts`
- 创建：`packages/plugin-page/src/fst-analysis.ts`
- 创建：`packages/plugin-page/src/index.ts`
- 创建：`packages/plugin-page/src/*.test.ts`

- [ ] **步骤 1：写页面测速失败测试**

测试：

```ts
import { describe, expect, it } from "vitest";
import { encodePageSpeedFromTiming } from "./index";

describe("页面测速", () => {
  it("把 navigation timing 转成 speed 数组", () => {
    const speed = encodePageSpeedFromTiming({
      navigationStart: 100,
      fetchStart: 110,
      responseEnd: 180,
      domInteractive: 220,
      loadEventStart: 300,
      loadEventEnd: 320
    });
    expect(speed.split("|")[5]).toBe("10");
    expect(speed.split("|")[12]).toBe("80");
  });
});
```

- [ ] **步骤 2：实现 Navigation Timing 和 Paint Timing**

生成与参考 SDK 一致的位置数组，负数和 NaN 归零。

- [ ] **步骤 3：实现 MutationObserver 首屏计算**

拆出可测试的权重计算函数；DOM 监听只做采集和停止条件。

- [ ] **步骤 4：实现 SPA 路由 FST 与慢访问分析**

支持路由切换后重新监听；`fstPerfAnalysis` 上报汇总和明细。

- [ ] **步骤 5：验证**

运行：

```bash
pnpm --filter @monitor/plugin-page test
pnpm --filter @monitor/plugin-page typecheck
```

预期：全部通过。

- [ ] **步骤 6：提交**

```bash
git add packages/plugin-page
git commit -m "feat: 实现页面性能和首屏插件"
```

## 任务 11：实现 Horn 与 Logan 插件

**文件：**
- 创建：`packages/plugin-horn/src/horn-manager.ts`
- 创建：`packages/plugin-horn/src/index.ts`
- 创建：`packages/plugin-logan/src/logan-manager.ts`
- 创建：`packages/plugin-logan/src/load-script.ts`
- 创建：`packages/plugin-logan/src/index.ts`
- 创建：`packages/plugin-horn/src/*.test.ts`
- 创建：`packages/plugin-logan/src/*.test.ts`

- [ ] **步骤 1：写 Horn 失败测试**

覆盖缓存读取、过期刷新和远端配置解析。

- [ ] **步骤 2：写 Logan 失败测试**

覆盖未 ready 前排队、ready 后 flush、外部 Logan API 注入。

- [ ] **步骤 3：实现 Horn**

实现 `_sdkHorn_<key>` storage 格式、URL 构建、缓存过期、远端配置读取。

- [ ] **步骤 4：实现 Logan**

实现 CDN 地址配置化、动态加载、Session/Navigation/Performance/Ajax/Error/Resource 日志方法。

- [ ] **步骤 5：验证**

运行：

```bash
pnpm --filter @monitor/plugin-horn test
pnpm --filter @monitor/plugin-logan test
pnpm --filter @monitor/plugin-horn typecheck
pnpm --filter @monitor/plugin-logan typecheck
```

预期：全部通过。

- [ ] **步骤 6：提交**

```bash
git add packages/plugin-horn packages/plugin-logan
git commit -m "feat: 实现 Horn 和 Logan 插件"
```

## 任务 12：实现 Perf 插件组

**文件：**
- 创建：`packages/plugin-perf-fsp/src/*.ts`
- 创建：`packages/plugin-perf-ird/src/*.ts`
- 创建：`packages/plugin-perf-shr/src/*.ts`
- 创建：`packages/plugin-perf-cache/src/*.ts`
- 创建：`packages/plugin-perf-*/src/*.test.ts`

- [ ] **步骤 1：写 ird 失败测试**

测试 `touchend` 后下一帧耗时计算：

```ts
import { describe, expect, it } from "vitest";
import { calculateInteractionDelay } from "./index";

describe("交互响应耗时", () => {
  it("计算 touchend 到下一帧的耗时", () => {
    expect(calculateInteractionDelay(100, 148)).toBe(48);
  });
});
```

- [ ] **步骤 2：写 shr 失败测试**

覆盖滚动时长、帧数、掉帧率计算。

- [ ] **步骤 3：写 fsp2 失败测试**

覆盖秒开状态、采样、beforeSend、页面隐藏停止。

- [ ] **步骤 4：实现 perf 基础队列与缓存**

浏览器环境走 web endpoint；容器环境走 bridge；失败缓存写入 `__perf_cache`。

- [ ] **步骤 5：实现 fsp2、ird、shr**

各插件只依赖 core context 和 transport，不互相依赖。浏览器 API 监听逻辑与计算函数分离。

- [ ] **步骤 6：验证**

运行：

```bash
pnpm --filter @monitor/plugin-perf-fsp test
pnpm --filter @monitor/plugin-perf-ird test
pnpm --filter @monitor/plugin-perf-shr test
pnpm --filter @monitor/plugin-perf-cache test
pnpm --filter "@monitor/plugin-perf-*" typecheck
```

预期：全部通过。

- [ ] **步骤 7：提交**

```bash
git add packages/plugin-perf-fsp packages/plugin-perf-ird packages/plugin-perf-shr packages/plugin-perf-cache
git commit -m "feat: 实现 Perf 指标插件组"
```

## 任务 13：实现聚合 SDK 和全局入口

**文件：**
- 创建：`packages/sdk/src/monitor-client.ts`
- 创建：`packages/sdk/src/global.ts`
- 创建：`packages/sdk/src/register-defaults.ts`
- 创建：`packages/sdk/src/index.ts`
- 创建：`packages/sdk/src/*.test.ts`
- 创建：`packages/sdk/vite.config.ts`

- [ ] **步骤 1：写失败测试**

测试默认入口：

```ts
import { describe, expect, it } from "vitest";
import { Monitor, MonitorClient } from "./index";

describe("聚合 SDK", () => {
  it("默认导出 Monitor 和 MonitorClient", () => {
    expect(Monitor).toBeDefined();
    expect(MonitorClient).toBeDefined();
    expect(Monitor.__version__).toMatch(/\d+\.\d+\.\d+/);
  });
});
```

- [ ] **步骤 2：实现 `MonitorClient`**

封装 core，并暴露设计文档列出的所有兼容接口。

- [ ] **步骤 3：实现默认插件注册**

`register-defaults.ts` 按顺序注册 Horn、Logan、Error、Page、Resource、PV、Metric、Perf 插件。

- [ ] **步骤 4：实现全局入口**

默认挂载 `window.Monitor`、接管 `window.monitor` 队列、回放 `window._Monitor_`；仅 `compat.legacyOwlAlias` 为 true 时挂载旧别名。

- [ ] **步骤 5：验证**

运行：

```bash
pnpm --filter @monitor/sdk test
pnpm --filter @monitor/sdk typecheck
pnpm --filter @monitor/sdk build
```

预期：全部通过并生成 ESM、CJS、IIFE。

- [ ] **步骤 6：提交**

```bash
git add packages/sdk
git commit -m "feat: 实现 Monitor 聚合 SDK"
```

## 任务 14：实现 mock-server

**文件：**
- 创建：`apps/mock-server/src/index.ts`
- 创建：`apps/mock-server/src/parser.ts`
- 创建：`apps/mock-server/src/store.ts`
- 创建：`apps/mock-server/src/parser.test.ts`

- [ ] **步骤 1：写解析失败测试**

测试：

```ts
import { describe, expect, it } from "vitest";
import { parseLogtsBody } from "./parser";

describe("mock-server 解析器", () => {
  it("解析 /api/logts 的 c= 请求体", () => {
    const payload = [{ project: "demo", sec_category: "boom" }];
    const body = "c=" + encodeURIComponent(JSON.stringify(payload));
    expect(parseLogtsBody(body)).toEqual(payload);
  });
});
```

- [ ] **步骤 2：实现 HTTP 服务**

使用 Node `http` 模块或轻量框架；端点覆盖设计文档列出的所有路径。

- [ ] **步骤 3：实现存储与查看接口**

内存保存最近 200 条请求，提供 `GET /__records` 和 `DELETE /__records`。

- [ ] **步骤 4：验证**

运行：

```bash
pnpm --filter mock-server test
pnpm --filter mock-server typecheck
pnpm --filter mock-server build
```

预期：全部通过。

- [ ] **步骤 5：提交**

```bash
git add apps/mock-server
git commit -m "feat: 实现监控 mock 上报服务"
```

## 任务 15：实现演示验证应用

**文件：**
- 创建：`apps/playground/index.html`
- 创建：`apps/playground/src/main.ts`
- 创建：`apps/playground/src/style.css`
- 创建：`apps/playground/src/actions.ts`

- [ ] **步骤 1：写最小构建失败检查**

运行：

```bash
pnpm --filter playground build
```

预期：失败，原因是应用尚未创建。

- [ ] **步骤 2：实现测试按钮**

页面提供按钮触发：JS Error、unhandledrejection、console.error、XHR 成功/失败、fetch 成功/失败、资源加载失败、手动 API、手动 error、metric、resetPv、SPA 路由、touchend、滚动。

- [ ] **步骤 3：接入 Monitor**

启动时调用：

```ts
Monitor.start({
  project: "monitor-playground",
  devMode: true,
  pageUrl: "/playground",
  perf: {
    project: "monitor-playground",
    version: "0.0.0",
    common: { dev: true, delay: 1000 }
  }
});
```

- [ ] **步骤 4：验证**

运行：

```bash
pnpm --filter playground typecheck
pnpm --filter playground build
```

预期：全部通过。

- [ ] **步骤 5：提交**

```bash
git add apps/playground
git commit -m "feat: 实现监控演示验证应用"
```

## 任务 16：端到端验证与文档收口

**文件：**
- 修改：`README.md`
- 创建：`docs/verification.md`

- [ ] **步骤 1：运行全量验证**

运行：

```bash
pnpm -r typecheck
pnpm -r test
pnpm -r build
pnpm check:size
```

预期：全部通过。

- [ ] **步骤 2：启动本地验证**

分别启动 mock-server 和演示验证应用：

```bash
pnpm --filter mock-server dev
pnpm --filter playground dev
```

在浏览器中触发所有按钮，并在 `GET /__records` 中确认对应记录到达。

- [ ] **步骤 3：记录验证结果**

`docs/verification.md` 记录命令输出摘要、浏览器验证项目、尚未真实验证的容器 bridge 限制。

- [ ] **步骤 4：更新 README**

README 增加安装、开发、构建、测试、mock-server、playground、全局命名说明。

- [ ] **步骤 5：提交**

```bash
git add README.md docs/verification.md
git commit -m "docs: 补充监控 SDK 验证说明"
```

## 自查结果

- 设计文档中的工作区结构、配置包、协议包、传输层、核心包、全部插件、聚合 SDK、mock-server、演示验证应用都已有对应任务。
- 秒开 2.0、交互响应耗时、滚动帧率和掉帧位于任务 12。
- `Monitor` 命名要求位于任务 6 和任务 13，并在全局入口验证。
- 每个实现任务都有先失败测试、再实现、再验证、再提交的步骤。
- 本计划没有要求修改 `AGENTS.MD`。
