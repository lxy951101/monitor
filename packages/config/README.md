# @monitor/config

监控 SDK 的配置类型定义、默认值和合并工具。纯数据层，不包含任何运行时行为。

## 用途

- 定义 `MonitorConfig` 及其子配置的完整 TypeScript 类型
- 提供 `createDefaultConfig()` 工厂函数，输出一份含所有默认值的完整配置
- `mergeMonitorConfig(base, patch)` 深度合并用户配置，支持函数、RegExp、数组等特化处理

## 配置结构

```
MonitorConfig
├── project: string              项目名
├── devMode: boolean             开发模式（切换上报域名）
├── reportBaseUrl: string        上报域名
├── envFilterName: string        环境过滤器名
├── filters: Record<string, fn>  命名过滤器集合
├── disabledFilters: string[]    禁用的内置过滤器名
├── webVersion: string           web 版本号（附加到 API query）
├── setCustomTags: fn | null     自定义维度回调
├── disableCache: boolean        全局禁用 localStorage 缓存
├── autoCatch: { js, resource, ajax, console, unhandledrejection, pv, page, metric }
├── page:     { enable, delay, sample, points, fstPerfAnalysis }
├── SPA:      { enable, autoPv, routeMode }
├── resource: { enable, sample, sampleApi, batchSize, delay, combo, resourceReg, ... }
├── ajax:     { enable, sample, timeout, withFetch, withXHR, parseResponse, ... }
├── image:    { enable, maxSize, maxDuration, fileSize, filter }
├── error:    { enable, sample, maxQueueLength, ignoreList, maxRepeat, noScriptError, ... }
├── metric:   { enable, sample, tags }
├── perf:     { fsp2, ird, shr, cache }
├── bridge:   { enable, preferredMethod }
└── compat:   { monitorQueue }
```

## 关键常量 `endpoints.ts`

| 常量 | 说明 |
|------|------|
| `SDK_VERSION` | SDK 版本号 |
| `REPORT_BASE_URLS.production` | 生产环境上报域名 |
| `REPORT_BASE_URLS.development` | 测试环境上报域名 |
| `API_PATHS` | 各数据类型的 API 路径映射 |
| `PERF_DEFAULT_ENDPOINTS` | Perf (FSP2/IRD/SHR) 默认端点 |

## 使用示例

```typescript
import { createDefaultConfig, mergeMonitorConfig } from "@monitor/config";

// 获取完整默认配置
const defaults = createDefaultConfig();

// 合并用户配置
const merged = mergeMonitorConfig(defaults, {
  project: "my-app",
  devMode: true,
  error: { sample: 0.5 }
});
```

## 合并规则

| 类型 | 行为 |
|------|------|
| `undefined` | 不覆盖已有值 |
| 普通对象 | 递归合并 |
| 数组 | 直接替换 |
| 函数 | 直接替换 |
| `RegExp` | 直接替换；`resourceReg` 支持传字符串自动 `new RegExp(s)` |
