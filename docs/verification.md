# 验证记录

验证日期：2026-07-01

## 命令验证

以下命令已在 `monitor-sdk-implementation` worktree 中通过：

```bash
CI=true pnpm -r typecheck
CI=true pnpm -r test
CI=true pnpm -r build
CI=true pnpm check:size
```

结果摘要：

- `typecheck`：18 个可执行 workspace 项目全部通过。
- `test`：Vitest 测试全部通过，playground 当前无单元测试，仅输出占位信息。
- `build`：所有包和应用构建通过，SDK 产出 ESM、CJS、IIFE。
- `check:size`：117 个 TypeScript 源文件通过文件行数和函数行数检查。

## 本地服务验证方式

启动 mock-server：

```bash
pnpm --filter mock-server dev
```

启动 playground：

```bash
pnpm --filter playground dev
```

打开：

- `http://localhost:5173`
- `http://localhost:8787/__records`

playground 中应逐项触发：

- JS Error
- unhandledrejection
- console.error
- XHR 成功/失败
- fetch 成功/失败
- 资源加载失败
- 手动 API
- 手动 error
- metric
- resetPv
- SPA 路由
- touchend
- 滚动

触发后在 `GET /__records` 中确认对应请求进入 mock-server 记录列表。

## 本地冒烟结果

已启动：

```bash
CI=true pnpm --filter mock-server dev
CI=true pnpm --filter playground dev -- --host 127.0.0.1
```

HTTP 冒烟结果：

- `GET http://localhost:5173/` 返回 `200`。
- `POST http://127.0.0.1:8787/api/logts` 返回 `{"ok":true,"id":1}`。
- `GET http://127.0.0.1:8787/__records` 可读取到 `/api/logts` 上报记录。

## 已知验证边界

- 浏览器 Web 指标、XHR/fetch、资源错误、PV、Metric、Perf Web 路径可通过 playground 和 mock-server 验证。
- 容器 Bridge 能力需要真实容器环境或宿主注入对象验证，本地 mock-server 不覆盖真实容器桥接行为。
- Logan CDN 动态加载在单元测试中通过注入 loader 和全局 API 验证；真实 CDN 可用性需要线上网络环境验证。
