# Monitor SDK Design

## 背景

本项目要参考 `refer/owl_1.13.5.js`，用 TypeScript、PNPM workspace、Vite 重新实现一套监控 SDK。目标不是把打包后的 bundle 原样复制进仓库，而是把 OWL 1.13.5 的能力源码化、模块化、可测试化，并把域名、接口路径、CDN 地址、正则和默认开关等提取为配置。

用户确认采用完整复刻方向，并要求多子项目拆包。插件需要拆成独立 package，最终由聚合 SDK 组装出与 OWL 兼容的默认实例。

## 目标

1. 提供与 OWL 1.13.5 尽量兼容的浏览器监控能力。
2. 用 PNPM workspace 拆分核心、协议、传输、插件、聚合包和本地验证应用。
3. 将 OWL 中硬编码的生产/测试域名、上报路径、Horn 地址、Logan CDN、资源正则、忽略列表抽离到配置包。
4. 支持本地 mock-server 接收并验证所有主要上报路径。
5. 保持每个源码文件不超过 600 行，每个函数不超过 120 行。

## 非目标

1. 不把 `owl_1.13.5.js` 作为源码直接维护。
2. 不在首轮设计里引入非 TypeScript 技术栈。
3. 不为了完全逐字节一致牺牲模块边界；协议和行为兼容优先，内部实现可以更清晰。

## Workspace 结构

```text
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
  plugin-perf-fsp2/
  plugin-perf-ird/
  plugin-perf-shr/
  plugin-perf-cache/
  sdk/
apps/
  mock-server/
  playground/
```

## Package 职责

### `packages/config`

集中维护从 OWL 提取出的配置：

- 上报域名：生产 `catfront.dianping.com`，测试 `catfront.51ping.com`。
- 上报路径：`/api/log`、`/api/logts`、`/api/speedts`、`/pbbatchts`、`/batchts`、`/rapi/metricjts`、`/api/pvts`、`/raptorapi/fstSpeed`、`/raptorapi/fstLog`。
- Horn 地址：默认 `https://portal-portm.meituan.com/horn?`。
- Logan CDN 前缀：`//www.dpfile.com/app/dp-logan-web/logan_` 和 `//s3.meituan.net/v1/mss_eb9ea9cfff9840198c3ae909b17b4270/production/logan-websdk/logan_`。
- 默认配置：`autoCatch`、`page`、`SPA`、`resource`、`ajax`、`image`、`error`、`metric`、`logan`、`perf`、`bridge`。
- 默认过滤：`resourceReg`、`ignoreList`、环境过滤器名称。

### `packages/protocol`

负责所有上报数据的模型和序列化：

- Error：生成 OWL 兼容错误 JSON，POST body 为 `c=<encoded JSON array>`。
- Page：生成 `speed`、`customspeed` 竖线数组编码。
- Resource/API：维护 OWL 字段顺序，并实现 JSON batch 与 protobuf batch。
- Metric：生成 `{ tvs, datas }`。
- PV：生成 OWL 兼容查询参数。
- Perf：生成 `category/env/logs` 结构和自定义指标结构。

protobuf batch 要独立封装，避免资源插件和传输层直接依赖编码细节。devMode 默认走 `/batchts` JSON，生产默认走 `/pbbatchts` protobuf。

### `packages/transport`

负责发送、缓存和桥接：

- XHR POST/GET。
- `navigator.sendBeacon`。
- localStorage 缓存与失败重发。
- KNB bridge 发送。
- MSI bridge 发送。
- 可注入 endpoint，便于 mock-server 和测试替换真实域名。

传输层不理解业务指标，只处理请求、响应、失败、缓存和远端采样配置回写。

### `packages/core`

提供 SDK 的基础骨架：

- `CfgManager`：配置合并、环境切换、采样、扩展维度、过滤器、API URL 生成。
- `OwlCore`：插件注册、生命周期、API 转发、默认实例创建。
- `EventBus`：内部采集事件，例如 `ajaxCall`、`fetchCall`、`validStateChange`。
- `Logger`：devMode 日志。
- `util`：URL、cookie、UA、traceid、XPath、页面地址、路由变更监听等工具。
- 兼容 `window.owl` 队列和 `window._Owl_` 预采集回放的基础能力。

### `packages/plugin-error`

复刻错误采集：

- `window.onerror`。
- `unhandledrejection`。
- 可选 `console.error`。
- `addError`、`sendErrors`。
- 错误去重、限流、过滤器、ignoreList。
- 页面卸载时 sendBeacon 或 localStorage 缓存。
- 分发 `owlErrDetected` 自定义事件。

### `packages/plugin-resource`

复刻资源和 API 采集：

- XHR 拦截。
- fetch 拦截。
- 静态资源 PerformanceEntry 采集。
- 静态资源加载错误采集。
- `addApi`、`reportApi`、`sendApis`。
- 资源合法性过滤、MTSI forbid 过滤、图片大小和耗时异常。
- resource batch 上报到 `/pbbatchts` 或 `/batchts`。

### `packages/plugin-page`

复刻页面性能和老首屏能力：

- Navigation Timing。
- Paint Timing。
- `addPoint`、`sendPoints`。
- `speed` 和 `customspeed` 编码。
- MutationObserver 首屏 FST 计算。
- 首屏图片资源耗时补偿。
- SPA 路由 FST。
- `fstPerfAnalysis` 慢访问汇总与明细，上报 `/raptorapi/fstSpeed` 和 `/raptorapi/fstLog`。

### `packages/plugin-pv`

复刻 PV 能力：

- 自动 PV。
- `reportPv`。
- `resetPv`。
- SPA 自动 PV。
- 维度和 custom tags 编码。

### `packages/plugin-metric`

复刻自定义指标：

- `MetricManager`。
- `newMetricInst`。
- `setMetric`、`setTags`、`setExtraData`、`report`。
- 上报 `/rapi/metricjts`。
- 失败时通过错误插件上报 SDK 自身告警。

### `packages/plugin-logan`

复刻 Logan 桥接：

- 可使用外部传入 Logan API。
- 可按版本动态加载 Logan SDK。
- 记录 Session、Navigation、Performance、Ajax、Error、Resource 日志。
- 未 ready 前排队，ready 后 flush。

### `packages/plugin-horn`

复刻 Horn 开关：

- 本地缓存 `_sdkHorn_<key>`。
- 缓存过期刷新。
- `useMSI` 开关。
- 支持 mock-server `/horn` 验证。

### `packages/plugin-perf-fsp2`

复刻 Perf 秒开 2.0：

- 使用 `perf.fsp2` 配置。
- 支持采样、禁用、customTags、debug、beforeSend、defer、忽略节点配置。
- 监听页面隐藏、加载、DOM 变化和资源变化。
- 输出秒开成功、失败、超时等状态。
- 浏览器环境走 web transport，容器环境走 KNB/MSI bridge。

### `packages/plugin-perf-ird`

复刻交互响应耗时：

- 使用 `perf.ird` 配置。
- 监听 `touchend`。
- 用 `requestAnimationFrame` 计算交互后下一帧耗时。
- 默认 3 秒超时。
- 浏览器环境上报 `ird_web`，容器环境调用 `ird.record`。

### `packages/plugin-perf-shr`

复刻滚动帧率和掉帧：

- 使用 `perf.shr` 配置。
- 监听滚动事件。
- 用 `requestAnimationFrame` 统计滚动期间帧间隔。
- 计算滚动时长、帧数、掉帧率。
- 浏览器环境上报 web 指标，容器环境调用 `shr.sendScrollStateTime` 和相关上报。

### `packages/plugin-perf-cache`

复刻 Perf 缓存插件：

- 失败数据写入 `__perf_cache`。
- 下次初始化读取并重发。
- beforeunload 时使用 sendBeacon 或 localStorage。

### `packages/sdk`

聚合包，只做默认组装和兼容导出：

- 注册 core 插件和所有默认插件。
- 导出 `Owl` 默认实例。
- 导出 `OWL` 构造器。
- 挂载 `window.Owl`。
- 接管 `window.owl` 队列。
- 保留 `Owl.__version__`、`Owl.errorModel`、`Owl.MetricManager`。
- 提供 Vite library build 输出 ESM、CJS、IIFE。

## 兼容 API

聚合包默认支持以下 OWL API：

- `start(config)`
- `config(config)`
- `getConfig(key)`
- `debug()`
- `addError(err, opts)`
- `sendErrors()`
- `addPoint(point)`
- `sendPoints()`
- `addApi(api)`
- `reportApi(api)`
- `sendApis()`
- `addLog(...args)`
- `createLog()`
- `resetPv(opts)`
- `reportPv(opts)`
- `newMetricInst()`
- `updateFilter(key, fn)`
- `removeFilter(key)`
- `wrap(fn, context, opts)`
- `setDimension(obj)`
- `getDimension(key)`
- `reportFST()`
- `createInstance(config)`
- `SDKMetrics(config)`
- `setTag(tags)`
- `addCustomMetrics(type, value, tags)`
- `reportPerformance(type, value, tags)`

## 数据流

1. 用户调用 `Owl.start(config)`。
2. `packages/sdk` 创建默认实例并注册全量插件。
3. `CfgManager` 合并默认配置、用户配置和维度信息。
4. Horn 插件刷新远端开关，回写 `useMSI` 等配置。
5. Error、Resource、Page、PV、Metric、Perf 插件按配置启动采集。
6. 插件将事件转成 protocol 模型。
7. protocol 序列化为 OWL 兼容格式。
8. transport 发送到配置中的真实域名或 mock-server。
9. 传输成功时回写远端 sampling；失败时按对应缓存策略处理。

## 上报端点

mock-server 需要覆盖以下端点：

- `POST /api/log`
- `POST /api/logts`
- `GET /api/speedts`
- `POST /pbbatchts`
- `POST /batchts`
- `POST /rapi/metricjts`
- `POST /api/pvts`
- `POST /raptorapi/fstSpeed`
- `POST /raptorapi/fstLog`
- `GET /horn`
- `POST /perf`
- `POST /perf/custom`

mock-server 保存原始 query、headers、body、解析结果、接收时间，便于 playground 和自动化测试断言。

## Playground

playground 使用 Vite，提供可操作验证入口：

- 抛出 JS Error。
- 触发 unhandledrejection。
- 触发 console.error。
- 发起成功和失败 XHR。
- 发起成功和失败 fetch。
- 加载失败图片、脚本、样式。
- 手动上报 API。
- 手动上报 error。
- 手动上报 metric。
- 自动 PV 和 resetPv。
- SPA 路由变化。
- 老 FST 和秒开 2.0。
- touchend 响应耗时。
- 滚动帧率和掉帧。
- Horn 开关和 Logan 日志。

## 错误处理

- SDK 内部异常不得影响业务页面。
- 内部异常优先通过 SDK 自身错误实例上报。
- 上报失败时按插件类型选择缓存策略。
- 所有全局 monkey patch 需要幂等，避免重复 patch。
- 每个插件需要提供停止或释放监听的内部能力，便于测试和多实例隔离。

## 测试策略

单元测试使用 Vitest：

- 配置合并、URL 生成、采样命中。
- error/resource/page/pv/metric/perf 协议序列化。
- XHR/fetch monkey patch 幂等性。
- ErrorModel 和 ResourceModel 字段兼容。
- Horn 缓存过期与刷新。
- Perf fsp2/ird/shr 的核心计算函数。

集成测试使用 playground + mock-server：

- 启动 SDK 后自动 PV 到达 mock-server。
- JS error、promise、console error 到达 `/api/logts`。
- XHR/fetch 和静态资源到达 `/pbbatchts` 或 `/batchts`。
- 页面测速到达 `/api/speedts`。
- metric 到达 `/rapi/metricjts`。
- 秒开、响应耗时、滚动指标到达 Perf mock endpoint。
- sendBeacon/localStorage 缓存路径可触发并恢复。

构建验证：

- `pnpm -r typecheck`
- `pnpm -r test`
- `pnpm -r build`
- playground 本地启动后进行浏览器冒烟验证。

## 实施顺序

1. 初始化 pnpm workspace、TypeScript、Vite、Vitest 基础设施。
2. 建立 `config`、`protocol`、`transport`、`core` 的最小骨架。
3. 先用 TDD 实现配置、协议模型和 transport。
4. 逐个实现 error、pv、metric、resource、page 插件。
5. 实现 horn、logan。
6. 实现 perf fsp2、ird、shr、cache 插件。
7. 实现聚合 `sdk` 包和 `window.Owl/window.owl` 兼容入口。
8. 实现 mock-server。
9. 实现 playground。
10. 跑完整验证并整理使用文档。

## 风险和取舍

- 完整复刻 OWL 体量大，必须分阶段交付，否则容易出现一个超大文件或难以测试的模块。
- protobuf batch 是兼容关键点，需要用测试锁定字段顺序和编码结果。
- Perf 秒开 2.0、响应耗时、滚动帧率与浏览器事件循环强相关，单元测试只覆盖核心计算，真实行为需要 playground 冒烟验证。
- KNB/MSI bridge 在普通浏览器不可真实验证，mock-server 和桥 mock 只能验证调用参数。
- Logan 外部脚本地址会被配置化，测试默认使用注入的 mock Logan API，避免依赖网络。

## 验收标准

1. `packages/sdk` 能以 IIFE 方式挂载 `window.Owl` 并执行 `window.owl` 队列。
2. apps/playground 能触发所有核心采集项。
3. apps/mock-server 能接收并解析所有主要 OWL 和 Perf 上报。
4. 默认域名、路径、Logan CDN、Horn 地址都来自 `packages/config`。
5. 源码文件和函数长度满足 AGENTS 约束。
6. `pnpm -r typecheck`、`pnpm -r test`、`pnpm -r build` 通过。
