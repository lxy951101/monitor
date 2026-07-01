# monitor

`monitor` 是一个 TypeScript + PNPM + Vite 的前端监控 SDK 工作区。

## 子项目

- `packages/config`：默认配置、上报地址和远端配置地址。
- `packages/protocol`：PV、错误、资源/API、页面性能、Perf 指标协议模型。
- `packages/transport`：XHR、Beacon、Bridge 传输和缓存队列。
- `packages/core`：配置管理、事件总线、插件生命周期和工具函数。
- `packages/plugin-*`：错误、PV、Metric、资源/API、页面性能、Perf 指标插件。
- `packages/sdk`：聚合入口，导出 `Monitor` 和 `MonitorClient`。
- `apps/mock-server`：本地上报接收服务。
- `apps/playground`：浏览器演示验证应用。

## 安装

```bash
pnpm install
```

## 常用命令

```bash
CI=true pnpm -r typecheck
CI=true pnpm -r test
CI=true pnpm -r build
pnpm check:size
```

- `pnpm build`：构建所有 workspace 子项目。
- `pnpm typecheck`：检查所有 workspace 子项目类型。
- `pnpm test:run`：以一次性模式运行 Vitest workspace。
- `pnpm check:size`：检查源码文件和函数行数约束。

## 本地验证

分别启动 mock 服务和演示应用：

```bash
pnpm --filter mock-server dev
pnpm --filter playground dev
```

默认地址：

- mock-server: `http://localhost:8787`
- playground: `http://localhost:5173`
- 上报记录: `http://localhost:8787/__records`

playground 提供按钮触发 JS Error、unhandledrejection、console.error、XHR/fetch 成功失败、资源加载失败、手动错误、Metric、PV 重置、SPA 路由、touchend 响应耗时和滚动帧率。

## SDK 使用

```ts
import { Monitor } from "@monitor/sdk";

Monitor.start({
  project: "demo",
  devMode: true,
  reportBaseUrl: ""
});
```

全局入口安装后会挂载：

- `window.Monitor`：SDK 命名空间。
- `window.monitor`：队列兼容函数，回放历史 `window.monitor = [["init", config]]`。
- `window._Monitor_`：启动时回放的历史队列。

## 指标覆盖

- 秒开：`@monitor/plugin-perf-fsp`，上报 `fsp_web`。
- 响应率/交互响应耗时：`@monitor/plugin-perf-ird`，上报 `ird_web`。
- 滚动帧率和掉帧：`@monitor/plugin-perf-shr`，上报 `shr_web`。
- 老首屏和页面性能：`@monitor/plugin-page`。
- API、资源、PV、错误、自定义指标分别由对应插件采集。

## TypeScript 配置

- `tsconfig.base.json`：通用严格配置，不绑定浏览器或 Node 运行环境。
- `tsconfig.browser.json`：浏览器包继承使用，包含 DOM 类型和 Bundler 解析。
- `tsconfig.node.json`：Node 应用继承使用，包含 NodeNext 解析和 Node 类型。
