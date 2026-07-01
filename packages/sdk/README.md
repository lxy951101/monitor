# @monitor/sdk

监控 SDK 入口层。将 `@monitor/core` 与各 `@monitor/plugin-*` 组合为可直接使用的完整 SDK。

## 架构

```
┌──────────────────────────────────────┐
│           MonitorNamespace            │
│  create · init · start · stop · debug│
│  wrap · client                       │
├──────────────────────────────────────┤
│           MonitorClient               │
│  use · init · start · stop · config  │
│  reportError · reportPv · resetPv    │
│  setMetric · setTag · setTags        │
│  debug · wrap                        │
├──────────┬───────────────────────────┤
│  Plugin  │  registerDefaultPlugins   │
│  System  │  (error/page/resource/pv  │
│  (core)  │   metric/fsp/ird/shr)    │
├──────────┴───────────────────────────┤
│  Transport · Config · EventBus       │
│  (from @monitor/core/transport)      │
└──────────────────────────────────────┘
```

## 两种使用方式

### 1. 全局安装 (推荐)

```typescript
import { installGlobal } from "@monitor/sdk";

installGlobal({
  config: { project: "my-app" }
});

// 后续任意位置直接使用
window.Monitor.debug();
window.Monitor.client.reportError(new Error("something wrong"));
```

`installGlobal` 会：
- 挂载 `window.Monitor`（namespace 对象）
- 挂载 `window.monitor`（函数分发器，支持 `window.monitor('start', config)`）
- 处理预加载队列：SDK 加载前 `window.monitor = [...]` 中的调用会被重放
- 处理 `window._Monitor_` 队列（异步加载器兼容）

### 2. 编程式使用

```typescript
import { MonitorClient } from "@monitor/sdk";

const client = new MonitorClient({
  config: { project: "my-app", devMode: false }
});

client.use(myCustomPlugin);
client.start();
```

## MonitorClient API

### 生命周期

| 方法 | 说明 |
|------|------|
| `use(plugin)` | 注册插件 |
| `init(config?)` | `start()` 的别名 |
| `start(config?)` | 启动所有插件（含爬虫检测，bot 则跳过） |
| `stop()` | 停止所有插件 |
| `config(patch)` | 批量更新配置 |
| `setConfig(key, value)` | 单项更新 |
| `getConfig()` / `getConfig(key)` | 读取配置 |

### 数据上报

| 方法 | 说明 |
|------|------|
| `reportError(error, opts?)` | 上报自定义错误 |
| `reportPv(opts?)` | 上报 Page View |
| `resetPv(opts?)` | 重置 PV（URL 变化时调用） |
| `setMetric(name, value, tags?)` | 设置指标值 |
| `setExtraData(data)` | 设置附加数据 |
| `setTags(tags)` | 批量设置指标标签 |
| `setTag(key, value)` | 设置单个指标标签 |
| `reportMetric()` | 手动触发指标上报 |

### 工具

| 方法 | 说明 |
|------|------|
| `debug()` | 开启 devMode，控制台输出调试信息 |
| `wrap(fn)` | 用 try-catch 包裹函数，异常时自动上报 error 然后继续抛出。防重复包裹 |

```typescript
// 包裹第三方回调，异常不会静默丢失
const safeHandler = client.wrap(thirdPartyCallback);
```

## 预加载模式

在 SDK 脚本加载之前放置以下代码，所有调用将在 SDK 就绪后重放：

```html
<script>
window.monitor = window.monitor || [];
window.monitor.push(["start", { project: "my-app" }]);
window.monitor.push(function(m) { m.debug(); });
</script>
<script src="monitor-sdk.js"></script>
```

## MonitorNamespace

全局对象 `window.Monitor` 的类型：

| 属性/方法 | 说明 |
|-----------|------|
| `__version__` | SDK 版本字符串 |
| `client` | 共享的 `MonitorClient` 实例 |
| `create(config?)` | 创建全新的 `MonitorClient`（不影响全局实例） |
| `init(config?)` / `start(config?)` | 启动全局实例 |
| `stop()` | 停止全局实例 |
| `debug()` | 开启调试模式 |
| `wrap(fn)` | 函数异常安全包裹 |
