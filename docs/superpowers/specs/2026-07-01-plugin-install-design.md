# Plugin 自由安装 & IIFE 全家桶 设计

## 背景

当前插件系统存在两个问题：

1. **ES 模式下无法按需安装插件**：`MonitorClient` 构造函数默认调用 `registerDefaultPlugins()`，强制注册全部 8 个插件。用户只能通过 `registerDefaults: false` 跳过再手动安装，但这不是默认路径，也缺乏文档。

2. **`plugin-error` 不是自执行的**：其他 7 个插件包都在自身包内导出 `createXxxPlugin()` 工厂函数，只有 `plugin-error` 把工厂函数放在了 `sdk/src/error-plugin.ts` 里。这意味着 `plugin-error` 不是一个完整的插件包。

3. **IIFE bundle 的副作用 import 是空操作**：bundle 入口 import 了所有插件包，但这些包只导出工厂函数，没有副作用。插件实际生效靠的是 SDK 内部的 `registerDefaultPlugins()`。

## 目标

- **ES / SDK 模式**：用户按需 `import` 插件工厂函数，显式调用 `.use()` 安装。SDK 默认不带任何插件，完全 tree-shakeable。
- **IIFE / CDN 模式**：`window.Monitor.start()` 一键启动，所有插件开箱即用，无需手动安装。

## 设计原则

- 职责分离：SDK (`@monitor/sdk`) = 纯容器 + 工具函数；Bundle (`@monitor/bundle`) = 全家桶组装
- 每个 `@monitor/plugin-*` 包必须自足——导出完整的 `createXxxPlugin()` 返回 `Plugin` 对象
- 破坏性变更只影响依赖了 `registerDefaults: true`（原默认值）的代码路径

---

## 详细改动

### 1. `plugin-error`：放入 `createErrorPlugin`，实现自足

**现状**：`plugin-error/src/index.ts` 只 re-export `cache`、`capture`、`error-manager`。工厂函数在 `sdk/src/error-plugin.ts`。

**改动**：

- 将 `sdk/src/error-plugin.ts` 的 `createErrorPlugin` 函数移入 `packages/plugin-error/src/`，新建 `create-error-plugin.ts`
- `plugin-error/src/index.ts` 新增导出：`export { createErrorPlugin, type ErrorPluginOptions } from "./create-error-plugin"`
- 工厂函数签名不变，依赖保持对 `@monitor/core` 的 peer/直接依赖

**注意**：`createErrorPlugin` 依赖了 `getPageUrl`（来自 `@monitor/core`）。`plugin-error` 的 `package.json` 已经依赖 `@monitor/core`，无需新增依赖。

### 2. `sdk`：去默认注册 + 删除 error-plugin.ts

**改动点**：

#### 2.1 `monitor-client.ts`

- 从构造函数选项中删除 `registerDefaults` 字段
- 构造函数不再调用 `registerDefaultPlugins(this)`
- 类型 import 删除 `ErrorManager`、`PvManager`、`MetricManager`（移到 `register-defaults.ts` 所需处）

```ts
// MonitorClientOptions: 删除 registerDefaults
export interface MonitorClientOptions {
  config?: CoreConfigPatch;
  transport?: Transport;
}

// constructor: 删除自动注册
constructor(options: MonitorClientOptions = {}) {
  this.core = new MonitorCore(options.config, {
    transport: options.transport ?? createXhrTransport(),
  });
}
```

**向后兼容说明**：依赖 `new MonitorClient()` 自动注册插件的代码需要改为显式调用 `registerDefaultPlugins(client)` 或手动 `.use()` 每个插件。

#### 2.2 删除 `error-plugin.ts`

文件 `packages/sdk/src/error-plugin.ts` 整体删除。

#### 2.3 `register-defaults.ts`

将 error plugin 的 import 改为从 `@monitor/plugin-error` 导入：

```ts
// 旧：
import { createErrorPlugin } from "./error-plugin";
// 新：
import { createErrorPlugin } from "@monitor/plugin-error";
```

`registerDefaultPlugins` 函数本身逻辑不变，保留导出作为纯工具函数。

#### 2.4 `sdk/src/index.ts`

- 新增 re-export：`export { createErrorPlugin, type ErrorPluginOptions } from "@monitor/plugin-error"`，标记 `@deprecated`，引导用户直接从 `@monitor/plugin-error` import
- `registerDefaultPlugins` 继续导出

#### 2.5 `global.ts` / `installGlobal`

`installGlobal` 内部调用 `createMonitorNamespace()`，后者现在创建的是无插件的 client。这是预期行为——`installGlobal` 是 ES 模式的全局安装方案，用户需自行注册插件。示例：

```ts
import { installGlobal, registerDefaultPlugins } from "@monitor/sdk";
const ns = installGlobal();
if (ns) registerDefaultPlugins(ns.client);
ns?.start({ project: "demo" });
```

### 3. `bundle`：显式组装全家桶

**现状**：`bundle/src/index.ts` 有 9 行副作用 import（所有插件包），但这些 import 实际上没有副作用。

**改动**：

```ts
import { createMonitorNamespace, MonitorClient, registerDefaultPlugins } from "@monitor/sdk";

// 创建 client 并注册全部插件
const client = new MonitorClient();
registerDefaultPlugins(client);

// 用已注册的 client 创建 namespace
const monitor = createMonitorNamespace(client);

(window as any).Monitor = monitor;
export { monitor as Monitor };
```

副作用 import 全部删除。构建时 Vite 会通过 `registerDefaultPlugins` 的静态 import 链把所有插件打包进 IIFE。

**注意**：`createMonitorNamespace` 已经接受可选的 `client` 参数，默认行为是 `new MonitorClient()`。传入外部 client 可以复用，无需修改函数签名。

### 4. 不改动的包

| 包                  | 说明                              |
| ------------------- | --------------------------------- |
| `plugin-pv`         | 已有 `createPvPlugin`，自足       |
| `plugin-metric`     | 已有 `createMetricPlugin`，自足   |
| `plugin-page`       | 已有 `createPagePlugin`，自足     |
| `plugin-resource`   | 已有 `createResourcePlugin`，自足 |
| `plugin-perf-fsp`   | 已有 `createFspPlugin`，自足      |
| `plugin-perf-ird`   | 已有 `createIrdPlugin`，自足      |
| `plugin-perf-shr`   | 已有 `createShrPlugin`，自足      |
| `plugin-perf-cache` | 工具包，无 Plugin 工厂            |
| `core`              | `Plugin` 接口不变                 |
| `transport`         | 不变                              |
| `protocol`          | 不变                              |
| `build-config`      | 不变                              |
| `config`            | 不变                              |

---

## 用户 API 变化

### ES / SDK 模式

```ts
// 之前（隐性全装）
import { Monitor } from "@monitor/sdk";
Monitor.start({ project: "demo" });

// 之后（显式安装）
import { MonitorClient } from "@monitor/sdk";
import { createErrorPlugin } from "@monitor/plugin-error";
import { createPvPlugin } from "@monitor/plugin-pv";

const client = new MonitorClient();
client
  .use(createErrorPlugin({ onReady: (m) => client.attachErrorManager(m) }))
  .use(createPvPlugin({ onReady: (m) => client.attachPvManager(m) }));
client.start({ project: "demo" });

// 或者一键全装
import { registerDefaultPlugins } from "@monitor/sdk";
registerDefaultPlugins(client);
client.start({ project: "demo" });
```

### IIFE / CDN 模式（不变）

```html
<script src="monitor.iife.js"></script>
<script>
  window.Monitor.start({ project: "demo" });
  // 所有插件已就绪
</script>
```

---

## 测试要点

1. **plugin-error 单测**：验证 `createErrorPlugin` 返回的 Plugin 对象能正常 `start`/`stop`
2. **SDK 单测**：验证 `new MonitorClient()` 不自动注册任何插件；验证 `registerDefaultPlugins(client)` 注册全部 8 个插件
3. **Bundle 集成测试**：验证 `window.Monitor` 存在且 `start()` 后所有插件生效
4. **Tree-shaking 验证**：ES 模式只 import 部分插件时，bundle 体积应相应减小
5. **TypeScript 类型检查**：所有包的 `tsc --noEmit` 通过
6. **现有测试回归**：全量 `pnpm test` 通过（可能需要更新部分测试用例中对默认注册行为的假设）

---

## 迁移指南

对现有用户的影响：

| 使用方式                                                     | 是否受影响           | 迁移方法                                                          |
| ------------------------------------------------------------ | -------------------- | ----------------------------------------------------------------- |
| `import { Monitor } from "@monitor/sdk"` + `Monitor.start()` | **是**               | 改为显式安装插件，或调用 `registerDefaultPlugins(Monitor.client)` |
| `new MonitorClient({ registerDefaults: false })`             | **是**（选项被删除） | 删除 `registerDefaults: false`，现在默认就是 false                |
| `new MonitorClient()` + 手动 `.use()`                        | 否                   | 无变化                                                            |
| IIFE `<script src="monitor.iife.js">`                        | 否                   | 无变化                                                            |

### 迁移示例（最简）

```ts
// 旧代码
import { Monitor } from "@monitor/sdk";
Monitor.start({ project: "demo" });

// 新代码（最小改动，恢复旧行为）
import { Monitor, registerDefaultPlugins } from "@monitor/sdk";
registerDefaultPlugins(Monitor.client);
Monitor.start({ project: "demo" });
```
