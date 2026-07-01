# Plugin 自由安装 & IIFE 全家桶 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** SDK 默认零插件（ES 按需安装），IIFE bundle 显式组装全家桶，`plugin-error` 自足化。

**Architecture:** 将 `createErrorPlugin` 从 SDK 迁入 `plugin-error` 使其自足；`MonitorClient` 移除 `registerDefaults` 自动注册；`registerDefaultPlugins` 保留为纯工具函数；IIFE bundle 入口显式调用 `registerDefaultPlugins` 后导出 `window.Monitor`。

**Tech Stack:** TypeScript, Vitest, Vite (createLibConfig), pnpm workspace

## Global Constraints

- 所有 `@monitor/plugin-*` 包必须导出完整的 `createXxxPlugin()` 返回 `Plugin` 对象
- `MonitorClient` 默认不注册任何插件
- IIFE `window.Monitor.start()` 行为不变（全插件开箱即用）
- 现有测试全量回归通过

---

### Task 1: 将 `createErrorPlugin` 迁入 `plugin-error`

**Files:**
- Create: `packages/plugin-error/src/create-error-plugin.ts`
- Modify: `packages/plugin-error/src/index.ts`
- Create: `packages/plugin-error/src/create-error-plugin.test.ts`

**Interfaces:**
- Produces: `createErrorPlugin(options?: ErrorPluginOptions): Plugin`, `ErrorPluginOptions` — 从 `@monitor/plugin-error` 导出

#### Step 1: 创建 `create-error-plugin.ts`

将 `sdk/src/error-plugin.ts` 的代码迁入，内部 import 改为相对路径：

```ts
import { getPageUrl, type MonitorContext, type Plugin } from "@monitor/core";
import { createErrorCapture, type ErrorCapture } from "./capture";
import { ErrorManager, type ErrorManagerOptions } from "./error-manager";

export interface ErrorPluginOptions extends Omit<
  Partial<ErrorManagerOptions>,
  "send" | "cfgManager"
> {
  onReady?: (manager: ErrorManager) => void;
}

export function createErrorPlugin(options: ErrorPluginOptions = {}): Plugin {
  let manager: ErrorManager | undefined;
  let capture: ErrorCapture | undefined;

  return {
    name: "@monitor/plugin-error",
    start(context: MonitorContext) {
      const config = context.cfgManager.getConfig();

      manager = new ErrorManager({
        ...options,
        cfgManager: context.cfgManager,
        send: context.transport.send.bind(context.transport),
        pageUrl: options.pageUrl ?? getPageUrl(),
        maxNum: options.maxNum ?? config.error.maxQueueLength,
        maxTime: options.maxTime ?? config.error.maxTime,
        delay: options.delay ?? config.error.delay,
        maxSize: options.maxSize ?? config.error.maxSize,
        noScriptError: options.noScriptError ?? config.error.noScriptError,
        formatUnhandledRejection:
          options.formatUnhandledRejection ?? config.error.formatUnhandledRejection,
        ignoreList: options.ignoreList ?? config.error.ignoreList,
      });
      options.onReady?.(manager);

      manager.checkCache();

      manager.detectLeave();

      if (config.autoCatch.js || config.autoCatch.unhandledrejection || config.autoCatch.console) {
        capture = createErrorCapture({
          addError: manager.addError.bind(manager),
          onWindowError: manager.parseWindowError.bind(manager),
          onUnhandledRejection: manager.parsePromiseUnhandled.bind(manager),
          onConsoleError: manager.parseConsoleError.bind(manager),
          captureConsoleError: config.autoCatch.console,
        });
        capture.start();
      }
    },
    stop() {
      capture?.stop();
      capture = undefined;
      manager = undefined;
    },
  };
}
```

#### Step 2: 更新 `plugin-error/src/index.ts`

在现有 exports 后新增：

```ts
export { createErrorPlugin, type ErrorPluginOptions } from "./create-error-plugin";
```

完整文件变为：

```ts
export * from "./cache";
export * from "./capture";
export * from "./error-manager";
export { createErrorPlugin, type ErrorPluginOptions } from "./create-error-plugin";

export const packageName = "@monitor/plugin-error";
```

#### Step 3: 编写测试 `create-error-plugin.test.ts`

```ts
import { CfgManager, EventBus, Logger } from "@monitor/core";
import type { MonitorContext } from "@monitor/core";
import { describe, expect, it, vi } from "vitest";
import { createErrorPlugin } from "./create-error-plugin";

function createMockContext(overrides: Partial<MonitorContext> = {}): MonitorContext {
  const cfgManager = new CfgManager();
  return {
    cfgManager,
    eventBus: new EventBus(),
    transport: { send: vi.fn().mockResolvedValue({ ok: true, status: 204 }) },
    logger: new Logger(false),
    ...overrides,
  };
}

describe("createErrorPlugin", () => {
  it("返回一个 name 为 @monitor/plugin-error 的 Plugin", () => {
    const plugin = createErrorPlugin();
    expect(plugin.name).toBe("@monitor/plugin-error");
    expect(typeof plugin.start).toBe("function");
    expect(typeof plugin.stop).toBe("function");
  });

  it("start 时创建 ErrorManager 并调用 onReady", () => {
    const onReady = vi.fn();
    const plugin = createErrorPlugin({ onReady });
    const ctx = createMockContext();

    plugin.start(ctx);

    expect(onReady).toHaveBeenCalledTimes(1);
    expect(onReady.mock.calls[0][0]).toBeDefined();
  });

  it("start + stop 不抛错", () => {
    const plugin = createErrorPlugin();
    const ctx = createMockContext();

    expect(() => plugin.start(ctx)).not.toThrow();
    expect(() => plugin.stop()).not.toThrow();
  });

  it("start 时启动 error capture（默认配置 autoCatch 全开）", () => {
    const plugin = createErrorPlugin();
    const ctx = createMockContext();

    plugin.start(ctx);

    // 默认 autoCatch 下 capture 会 patch window.onerror
    // 验证 patch 成功
    expect(typeof window.onerror).toBe("function");

    plugin.stop();
  });
});
```

#### Step 4: 运行 plugin-error 测试

```bash
pnpm --filter @monitor/plugin-error test
```

Expected: 4 new tests PASS，原有 20+ tests 不变。

#### Step 5: 运行 plugin-error typecheck

```bash
pnpm --filter @monitor/plugin-error typecheck
```

Expected: PASS

#### Step 6: Commit

```bash
git add packages/plugin-error/src/create-error-plugin.ts \
        packages/plugin-error/src/create-error-plugin.test.ts \
        packages/plugin-error/src/index.ts
git commit -m "feat(plugin-error): 迁入 createErrorPlugin 实现插件自足"
```

---

### Task 2: `MonitorClient` 移除 `registerDefaults` 自动注册

**Files:**
- Modify: `packages/sdk/src/monitor-client.ts`
- Modify: `packages/sdk/src/index.test.ts`

**Interfaces:**
- Consumes: `createErrorPlugin` from Task 1 (already exported by `@monitor/plugin-error`)
- Produces: `MonitorClientOptions` 不再包含 `registerDefaults`；`new MonitorClient()` 不注册任何插件

#### Step 1: 修改 `monitor-client.ts`

改动点：
1. 删除 `registerDefaults` 选项
2. 删除构造函数中的 `registerDefaultPlugins(this)` 调用
3. 删除 `import { registerDefaultPlugins } from "./register-defaults"`

```ts
import {
  checkIsSpider,
  MonitorCore,
  type CoreConfig,
  type CoreConfigPatch,
  type Plugin,
} from "@monitor/core";
import type { ErrorManager } from "@monitor/plugin-error";
import type { MetricManager } from "@monitor/plugin-metric";
import type { PvManager, PvReportOptions, PvResetOptions } from "@monitor/plugin-pv";
import type { MetricMap } from "@monitor/protocol";
import { createXhrTransport, type Transport } from "@monitor/transport";

export interface MonitorClientOptions {
  config?: CoreConfigPatch;
  transport?: Transport;
}

export class MonitorClient {
  readonly core: MonitorCore;
  private errorManager: ErrorManager | undefined;
  private metricManager: MetricManager | undefined;
  private pvManager: PvManager | undefined;

  constructor(options: MonitorClientOptions = {}) {
    this.core = new MonitorCore(options.config, {
      transport: options.transport ?? createXhrTransport(),
    });
  }

  use(plugin: Plugin): this {
    this.core.use(plugin);
    return this;
  }

  init(config?: CoreConfigPatch): this {
    return this.start(config);
  }

  start(config?: CoreConfigPatch): this {
    if (checkIsSpider()) {
      return this;
    }
    this.core.start(config);
    return this;
  }

  debug(): this {
    this.core.setConfig("devMode", true);
    return this;
  }

  wrap<T extends (...args: never[]) => unknown>(fn: T): T {
    if ((fn as unknown as { __monitor_wrapped__?: boolean }).__monitor_wrapped__) {
      return fn;
    }
    const client = this;
    const wrapped = function (this: unknown, ...args: Parameters<T>): ReturnType<T> {
      try {
        return fn.apply(this, args) as ReturnType<T>;
      } catch (error) {
        client.reportError(error);
        throw error;
      }
    } as T;
    Object.defineProperty(wrapped, "__monitor_wrapped__", { value: true });
    return wrapped;
  }

  stop(): this {
    this.core.stop();
    return this;
  }

  config(config: CoreConfigPatch): this {
    this.core.config(config);
    return this;
  }

  setConfig<Key extends keyof CoreConfig>(key: Key, value: CoreConfig[Key]): this {
    this.core.setConfig(key, value);
    return this;
  }

  getConfig(): CoreConfig;
  getConfig<Key extends keyof CoreConfig>(key: Key): CoreConfig[Key];
  getConfig<Key extends keyof CoreConfig>(key?: Key): CoreConfig | CoreConfig[Key] {
    return key === undefined ? this.core.getConfig() : this.core.getConfig(key);
  }

  reportError(error: unknown, options?: Parameters<ErrorManager["addError"]>[1]): this {
    this.errorManager?.addError(error, options);
    return this;
  }

  reportPv(options?: PvReportOptions): this {
    void this.pvManager?.report(options);
    return this;
  }

  resetPv(options?: PvResetOptions): this {
    this.pvManager?.resetPv(options);
    return this;
  }

  setMetric(name: string, value: number, tags?: MetricMap): this {
    this.metricManager?.setMetric(name, value, tags);
    return this;
  }

  setExtraData(data: MetricMap): this {
    this.metricManager?.setExtraData(data);
    return this;
  }

  setTags(tags: MetricMap): this {
    this.metricManager?.setTags(tags);
    return this;
  }

  setTag(key: string, value: string | number | boolean): this {
    this.metricManager?.setTag(key, value);
    return this;
  }

  async reportMetric(): Promise<void> {
    await this.metricManager?.report();
  }

  attachErrorManager(manager: ErrorManager): void {
    this.errorManager = manager;
  }

  attachMetricManager(manager: MetricManager): void {
    this.metricManager = manager;
  }

  attachPvManager(manager: PvManager): void {
    this.pvManager = manager;
  }
}
```

#### Step 2: 更新 `index.test.ts`

需要更新测试中引用 `registerDefaults: false` 的地方——删除此选项（现在默认就是 false）。同时现有测试通过 `new MonitorClient({ registerDefaults: false })` 创建无插件 client，现在这个行为是默认的，所以直接删除 `registerDefaults: false`。

找到测试文件中 3 处 `registerDefaults: false`，全部删除该字段：

```ts
// 第一处：第 12 行附近
const client = new MonitorClient({
  // registerDefaults: false,  ← 删除
  transport: { send },
  config: { project: "demo" },
});

// 第二处：第 27 行附近
const client = new MonitorClient({
  // registerDefaults: false,  ← 删除
});
```

#### Step 3: 运行 SDK 测试

```bash
pnpm --filter @monitor/sdk test
```

Expected: 3 tests PASS

#### Step 4: 运行 SDK typecheck

```bash
pnpm --filter @monitor/sdk typecheck
```

Expected: PASS

#### Step 5: Commit

```bash
git add packages/sdk/src/monitor-client.ts \
        packages/sdk/src/index.test.ts
git commit -m "refactor(sdk): MonitorClient 移除 registerDefaults 自动注册"
```

---

### Task 3: 删除 `sdk/src/error-plugin.ts`，更新 `register-defaults.ts`

**Files:**
- Delete: `packages/sdk/src/error-plugin.ts`
- Modify: `packages/sdk/src/register-defaults.ts`

**Interfaces:**
- Consumes: `createErrorPlugin` from `@monitor/plugin-error` (Task 1)
- Produces: `registerDefaultPlugins` 行为不变（8 个插件，同顺序）

#### Step 1: 删除 `error-plugin.ts`

```bash
rm packages/sdk/src/error-plugin.ts
```

#### Step 2: 修改 `register-defaults.ts`

将 error plugin import 从本地路径改为 `@monitor/plugin-error`：

```ts
import { createErrorPlugin } from "@monitor/plugin-error";
import { createMetricPlugin, type MetricManager } from "@monitor/plugin-metric";
import { createPagePlugin } from "@monitor/plugin-page";
import { PerfCache } from "@monitor/plugin-perf-cache";
import { createFspPlugin, type FspManager } from "@monitor/plugin-perf-fsp";
import { createIrdPlugin } from "@monitor/plugin-perf-ird";
import { createShrPlugin } from "@monitor/plugin-perf-shr";
import { createPvPlugin, type PvManager } from "@monitor/plugin-pv";
import { createResourcePlugin } from "@monitor/plugin-resource";
import type { MonitorClient } from "./monitor-client";

export interface DefaultPluginRefs {
  metric?: MetricManager;
  pv?: PvManager;
  fsp?: FspManager;
}

export function registerDefaultPlugins(client: MonitorClient): DefaultPluginRefs {
  const refs: DefaultPluginRefs = {};
  const perfCache = new PerfCache();

  client
    .use(createErrorPlugin({ onReady: (manager) => client.attachErrorManager(manager) }))
    .use(createPagePlugin())
    .use(createResourcePlugin())
    .use(
      createPvPlugin({
        onReady: (manager) => {
          refs.pv = manager;
          client.attachPvManager(manager);
        },
      }),
    )
    .use(
      createMetricPlugin({
        onReady: (manager) => {
          refs.metric = manager;
          client.attachMetricManager(manager);
        },
      }),
    )
    .use(
      createFspPlugin({
        cache: perfCache,
        onReady: (manager) => {
          refs.fsp = manager;
        },
      }),
    )
    .use(createIrdPlugin({ cache: perfCache }))
    .use(createShrPlugin({ cache: perfCache }));

  return refs;
}
```

唯一改动是第一行：`import { createErrorPlugin } from "./error-plugin"` → `import { createErrorPlugin } from "@monitor/plugin-error"`。

#### Step 3: 运行 SDK 测试确认无误

```bash
pnpm --filter @monitor/sdk test
```

Expected: 3 tests PASS

#### Step 4: Commit

```bash
git add packages/sdk/src/register-defaults.ts
git rm packages/sdk/src/error-plugin.ts
git commit -m "refactor(sdk): 删除 error-plugin.ts，改为从 @monitor/plugin-error 导入"
```

---

### Task 4: 更新 `sdk/src/index.ts` — deprecated re-export

**Files:**
- Modify: `packages/sdk/src/index.ts`

**Interfaces:**
- Produces: `createErrorPlugin`, `ErrorPluginOptions` 从 SDK re-export（标记 deprecated）

#### Step 1: 修改 `index.ts`

在文件末尾新增 deprecated re-export：

```ts
/** @deprecated 直接从 @monitor/plugin-error 导入 */
export { createErrorPlugin, type ErrorPluginOptions } from "@monitor/plugin-error";
```

完整文件变为：

```ts
import type { CoreConfigPatch } from "@monitor/core";
import { MonitorClient } from "./monitor-client";

export const packageName = "@monitor/sdk";
export const version = "0.0.0";

export interface MonitorNamespace {
  __version__: string;
  create: (config?: CoreConfigPatch) => MonitorClient;
  init: (config?: CoreConfigPatch) => MonitorClient;
  start: (config?: CoreConfigPatch) => MonitorClient;
  stop: () => MonitorClient;
  debug: () => MonitorClient;
  wrap: <T extends (...args: never[]) => unknown>(fn: T) => T;
  client: MonitorClient;
}

export function createMonitorNamespace(client = new MonitorClient()): MonitorNamespace {
  return {
    __version__: version,
    client,
    create(config?: CoreConfigPatch) {
      return new MonitorClient({ config });
    },
    init(config?: CoreConfigPatch) {
      return client.init(config);
    },
    start(config?: CoreConfigPatch) {
      return client.start(config);
    },
    stop() {
      return client.stop();
    },
    debug() {
      return client.debug();
    },
    wrap<T extends (...args: never[]) => unknown>(fn: T): T {
      return client.wrap(fn);
    },
  };
}

export const Monitor = createMonitorNamespace();

export { installGlobal, type InstallGlobalOptions, type MonitorGlobalTarget } from "./global";
export { MonitorClient, type MonitorClientOptions } from "./monitor-client";
export { registerDefaultPlugins, type DefaultPluginRefs } from "./register-defaults";

/** @deprecated 直接从 @monitor/plugin-error 导入 */
export { createErrorPlugin, type ErrorPluginOptions } from "@monitor/plugin-error";
```

#### Step 2: 运行 SDK typecheck + test 确认

```bash
pnpm --filter @monitor/sdk typecheck && pnpm --filter @monitor/sdk test
```

Expected: typecheck PASS, 3 tests PASS

#### Step 3: Commit

```bash
git add packages/sdk/src/index.ts
git commit -m "refactor(sdk): 添加 createErrorPlugin deprecated re-export"
```

---

### Task 5: 重写 IIFE bundle 入口

**Files:**
- Modify: `packages/bundle/src/index.ts`

**Interfaces:**
- Consumes: `createMonitorNamespace`, `MonitorClient`, `registerDefaultPlugins` from `@monitor/sdk`
- Produces: `window.Monitor`（全插件 IIFE）

#### Step 1: 重写 `bundle/src/index.ts`

```ts
import { createMonitorNamespace, MonitorClient, registerDefaultPlugins } from "@monitor/sdk";

const client = new MonitorClient();
registerDefaultPlugins(client);

const Monitor = createMonitorNamespace(client);

(window as any).Monitor = Monitor;

export { Monitor };
```

删除全部 9 行副作用 import。

#### Step 2: 验证构建

```bash
pnpm --filter @monitor/bundle build
```

Expected: 成功产出 `dist/monitor.iife.js`

#### Step 3: 快速验证 IIFE 功能

创建一个临时 HTML 验证 `window.Monitor` 可用（不需要浏览器，确认产物中包含所有插件模块即可）：

```bash
# 确认产物中有插件关键字符串
grep -c "plugin-error" packages/bundle/dist/monitor.iife.js
grep -c "plugin-pv" packages/bundle/dist/monitor.iife.js
```

Expected: 每个 grep 至少命中 1 次（插件被打包进去）

#### Step 4: Commit

```bash
git add packages/bundle/src/index.ts
git commit -m "refactor(bundle): 显式 registerDefaultPlugins 组装 IIFE 全家桶"
```

---

### Task 6: 全量回归验证

**Files:**
- (验证所有包，不改文件)

#### Step 1: 全量 typecheck

```bash
pnpm typecheck
```

Expected: 全部包 PASS

#### Step 2: 全量 lint

```bash
pnpm lint
```

Expected: PASS

#### Step 3: 全量 format check

```bash
pnpm format
```

Expected: PASS

#### Step 4: 全量测试

```bash
pnpm test
```

Expected: 全部 test PASS（plugin-error 新增 4 个，SDK 现有 3 个，其他包不变）

#### Step 5: 全量构建

```bash
pnpm build
```

Expected: 全部包 build 成功

#### Step 6: Commit（如有 format 变更）

```bash
git add -A && git diff --cached --quiet || git commit -m "chore: 全量回归验证通过"
```
