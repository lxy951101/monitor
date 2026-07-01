# @monitor/protocol

Monitor SDK 的数据协议层，定义各上报通道的数据模型、字段顺序和编码格式，与后端接口及 `refer/` (v1.13.5) 保持一致。

## 目录

- [Error（错误上报）](#error错误上报)
- [Metric（自定义指标）](#metric自定义指标)
- [Resource（资源测速）](#resource资源测速)
- [Page Speed（页面测速）](#page-speed页面测速)
- [PV（页面访问）](#pv页面访问)
- [Perf（性能日志）](#perf性能日志)
- [Query（URL 参数编码）](#queryurl-参数编码)

---

## Error（错误上报）

**文件**: `src/error.ts`

**用途**: 定义 JS 运行时错误、资源加载错误、Promise 未处理拒绝等异常数据的模型与编码格式。

### 数据模型

`ErrorModel` 包含 11 个固定字段 + 1 个可选动态字段：

| 字段            | 类型    | 说明                                                           |
| --------------- | ------- | -------------------------------------------------------------- |
| `project`       | string  | 项目标识                                                       |
| `pageUrl`       | string  | 错误聚合页面地址                                               |
| `realUrl`       | string  | 错误真实地址                                                   |
| `resourceUrl`   | string  | 出错资源 URL（脚本/图片等）                                    |
| `category`      | string  | 错误类型，默认 `"jsError"`，可选 `resourceError` / `ajaxError` |
| `sec_category`  | string  | 错误名称，用于聚合归类，默认 `"default"`                       |
| `level`         | string  | 错误级别，默认 `"error"`，可选 `info` / `debug` / `warn`       |
| `unionId`       | string  | 业务 unionId                                                   |
| `timestamp`     | number  | 错误发生时间戳 (ms)                                            |
| `content`       | string  | 错误详细日志（stack trace 等）                                 |
| `traceid`       | string  | 请求追踪 ID                                                    |
| `dynamicMetric` | object? | 仅 `jsError` 类别时包含 `rowNum`/`colNum`，`tags` 始终包含     |

### 编码格式

`encodeErrorBody(models)` 将错误数组编码为 URL-encoded 表单格式：

```
c=%5B%7B%22project%22%3A...%7D%5D
```

即 `c=` + `encodeURIComponent(JSON.stringify(models))`，与 `encodeDataBeforeSend` 完全一致。

### 堆栈解析

`parseErrorStack(stack)` 从 `Error.stack` 中正则提取：

- `resourceUrl` — 脚本 URL（匹配 `https?://...\.js`）
- `rowNum` / `colNum` — 行列号（匹配 `:行:列`）

---

## Metric（自定义指标）

**文件**: `src/metric.ts`

**用途**: 定义业务自定义指标（counter/gauge）的数据模型与编码格式。

**对应 **: `MetricManager.setMetric()` + `report()` 的 POST 上报格式。

### 数据模型

三层结构：

```
MetricPayload { tvs, datas }
  └─ MetricData[] { key, vs, tvs, extra?, ts }
```

| 字段    | 类型       | 说明                                                      |
| ------- | ---------- | --------------------------------------------------------- |
| `key`   | string     | 指标名称                                                  |
| `vs`    | number[]   | 指标值数组（通常单元素）                                  |
| `tvs`   | MetricMap  | 本指标的维度标签                                          |
| `ts`    | number     | **秒级**时间戳                                            |
| `extra` | MetricMap? | 全局额外维度（由 `setExtraData` 设置，透传到每条 metric） |

`MetricPayload` 外层 `tvs` 为全局维度标签，会被合并到每条 metric 的维度中。

### 关键实现细节

1. **时间戳单位是秒**而非毫秒：`Math.floor(Date.now() / 1000)`，的 `parseInt(+new Date() / 1000)`
2. **`extra` 是 payload 级别的**：`setExtraData()` → `report()` 注入到每条 metric
3. **输入输出字段映射**：

| 输入 (MetricItemInput) | 输出 (MetricData) |
| ---------------------- | ----------------- |
| `name`                 | `key`             |
| `value`                | `vs: [value]`     |
| `tags`                 | `tvs`             |
| `timestamp` (ms)       | `ts` (秒)         |

### 上报方式

POST JSON 到 `/rapi/metricjts`，Content-Type 为 `application/json;charset=UTF-8`。

---

## Resource（资源测速）

**文件**: `src/resource.ts`

**用途**: 定义页面资源（JS/CSS/图片/API 等）加载性能的数据模型、批量编码及资源类型识别工具。

**对应 **: `ResourceModel` 类 + `ResourceManager.send()` 的三种编码方式。

### 数据模型

`ResourceModel` 包含 17 个字段，顺序与 完全一致：

| 字段             | 类型   | 说明                       |
| ---------------- | ------ | -------------------------- |
| `resourceUrl`    | string | 资源 URL                   |
| `connectType`    | string | 连接类型 (http/https)      |
| `type`           | string | 资源类型 (js/css/img/ajax) |
| `timestamp`      | string | 时间戳                     |
| `requestbyte`    | string | 请求体大小                 |
| `responsebyte`   | string | 响应体大小                 |
| `responsetime`   | string | 响应耗时 (ms)              |
| `project`        | string | 项目标识                   |
| `pageUrl`        | string | 页面 URL                   |
| `realUrl`        | string | 真实页面 URL               |
| `statusCode`     | string | HTTP 状态码                |
| `firstCategory`  | string | 一级分类                   |
| `secondCategory` | string | 二级分类                   |
| `logContent`     | string | 资源出错时的详情日志       |
| `traceid`        | string | 请求追踪 ID                |
| `ctags`          | string | 自定义标签 (JSON string)   |

批量结构 `ResourceBatch` 在 `infos` 之外还携带 7 个可选的环境维度字段：`region`、`operator`、`network`、`container`、`os`、`connectType`、`unionId`。

### 三种编码方式

| 方法                           | 编码格式          | 用途                      |
| ------------------------------ | ----------------- | ------------------------- |
| `encodeResourceTextBatch`      | JSON string       | devMode / 调试            |
| `encodeResourceJsonBatchBytes` | JSON → Uint8Array | protobuf fallback         |
| `encodeResourceProtobufBatch`  | Protobuf 二进制   | 生产环境（减小体积 ~40%） |

### Protobuf 编码原理

实现了与 完全兼容的最小化 protobuf 编码器 (`ProtobufWriter`)，无需外部依赖。

**ProtobufWriter 实现**:

- **varint 编码** (`uint32`): 每字节低 7 位为数据，最高位为 continuation bit
- **length-delimited string** (`string`): `varint(byteLength)` + UTF-8 bytes
- **nested message** (`fork/ldelim`): 子消息独立编码后以 length-delimited 形式嵌入父消息

**消息结构**:

```
Batch (外层)
├── infos: repeated BatchInfo [field 1, tag=10]
│   └── 每条 BatchInfo 包含 17 个 string 字段
│       (project, pageUrl, realUrl, type, resourceUrl, connectType,
│        requestbyte, responsetime, responsebyte, statusCode, timestamp,
│        resourceType, firstCategory, secondCategory, content, traceid, ctags)
└── batch 选项: region[2], operator[3], network[4], container[5],
    os[6], connectType[7], unionId[8]
```

**字段 tag 映射**: 完全的 `lenArr`，例如 `project` → tag 10（field 1 wire type 2）、`pageUrl` → tag 18（field 2 wire type 2），依此类推。

### 资源类型识别

| 正则          | 用途     | 匹配示例                                                                                     |
| ------------- | -------- | -------------------------------------------------------------------------------------------- |
| `IMG_PATTERN` | 图片资源 | `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webp`, `.ico`, `.bmp`, `.tiff`（含 query string） |
| `JS_PATTERN`  | JS 资源  | `.js`（含 query string）                                                                     |
| `CSS_PATTERN` | CSS 资源 | `.css`（含 query string）                                                                    |

`getImageDomain(url)` 将图片完整 URL 截取为域名 + `/images` 路径，用于数据脱敏聚合。

---

## Page Speed（页面测速）

**文件**: `src/page.ts`

**用途**: 定义 W3C Navigation Timing + Paint Timing + FST 页面性能数据模型与编码。

**对应 **: `PageManager.parsePageTime()` 的 `perfMap` 点位体系和 `report()` 的 `speed`/`customspeed` 查询参数。

### 点位索引体系

使用固定位置数组上报性能数据，`points[索引] = 值`，最终以 `|` 拼接。索引定义如下：

| 索引范围 | 内容                   | 说明                                                 |
| -------- | ---------------------- | ---------------------------------------------------- |
| 0        | 预留                   | 始终为 0                                             |
| 1-19     | W3C Navigation Timing  | `PERF_INDEX` 映射，相对于 `navigationStart` 的偏移量 |
| 20       | DNS 耗时               | `domainLookupEnd - domainLookupStart`                |
| 21       | TCP 耗时               | `connectEnd - connectStart`                          |
| 22       | 下载耗时               | `responseEnd - requestStart`                         |
| 23       | First Paint            | `performance.getEntriesByType("paint")`              |
| 24       | First Contentful Paint | 同上                                                 |
| 25       | FST（首屏时间）        | 由 FST 检测插件填入                                  |
| 26       | FCP（首屏内容绘制）    | 同上                                                 |

### 编码格式

`encodePageSpeed(model)` 输出 27 元素的 pipe 字符串：

```
|0|0|5|3|10|15|20|12|30|...  (共 27 段)
```

- 派生指标（20-22）优先使用预计算值，否则从 timing 字段自动推算
- Paint/FST 指标（23-26）仅在有值时填充

`encodeCustomSpeed(model)` 输出自定义点位的 pipe 字符串，`customspeed` 参数。

### 上报方式

将 `speed` 和 `customspeed` 作为 GET 请求的 URL 查询参数发送，项目标识 (`project`)、页面地址 (`pageurl`) 等元数据作为独立参数，不再嵌入编码字符串内部。

---

## PV（页面访问）

**文件**: `src/pv.ts`

**用途**: 定义页面访问 (Page View) 上报的数据模型与 URL 查询参数编码。

**对应 **: `PvManager.report()` 的 URL query 参数结构。

### 数据模型

| 字段        | 类型   | 说明                              |
| ----------- | ------ | --------------------------------- |
| `project`   | string | 项目标识                          |
| `pageurl`   | string | 页面 URL                          |
| `pageId`    | string | 页面实例 ID（SPA 路由切换时不变） |
| `timestamp` | number | 访问时间戳 (ms)                   |
| `region`    | string | 地区                              |
| `operator`  | string | 运营商                            |
| `network`   | string | 网络类型                          |
| `container` | string | 容器环境                          |
| `os`        | string | 操作系统                          |
| `unionid`   | string | 业务 unionId                      |
| `ctags`     | string | 自定义标签 (JSON string)          |

### 编码格式

`encodePvQuery(model)` 将模型转为 URL 查询字符串：

```
project=demo&pageurl=%2Fhome&pageId=abc&timestamp=1234567890&...
```

`formatCtags` 支持传入 string 或 object，object 自动 `JSON.stringify`。

### 上报方式

使用 GET 请求，所有 PV 数据作为 URL 查询参数发送，不携带请求体。

---

## Perf（性能日志）

**文件**: `src/perf.ts`

**用途**: 定义通用性能日志和 FSP（秒开）容器桥事件的 payload 结构。

**对应 **: Perf 插件 + FSP Bridge 事件上报。

### 核心类型

**PerfLogPayload** — 通用性能日志：

```typescript
{
  category: string;     // 日志分类
  env: PerfEnv;         // 环境维度 (Record<string, PerfValue>)
  logs: PerfLog[];      // 日志条目数组
}
```

**FspBridgeEvent** — 秒开 容器桥事件：

| 字段            | 说明                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------ |
| `eType`         | 事件类型：`start` / `success` / `interact` / `timeout` / `notsupport` / `error` / `hidden` |
| `createMs`      | 事件创建时间 (ms)                                                                          |
| `appId`         | 应用 ID                                                                                    |
| `reachBottom`   | 是否触底：`"reached"` / `"notReached"`                                                     |
| `renderRate`    | 渲染率 (0-1)                                                                               |
| `mutationCount` | DOM 变更数                                                                                 |
| `$sr`           | 采样率 (0-1]                                                                               |

当存在 `pageLoadedTime` 时，额外携带 FFP (First Frame Paint) 相关字段：`detect_cls`、`calibrateEndType`、`ffp_*` 系列。

### 构造器方法

| 方法                      | 用途                                       |
| ------------------------- | ------------------------------------------ |
| `createPerfLogPayload`    | 构建通用日志 payload（多条日志）           |
| `createPerfCustomPayload` | 构建通用日志 payload（单条日志 + metrics） |
| `createFspBridgeEvent`    | 构建 FSP 容器桥事件                        |

---

## Query（URL 参数编码）

**文件**: `src/query.ts`

**用途**: 通用的 URL 查询参数编码工具，用于所有 GET 请求的参数拼接。

### 核心函数

**`encodeQueryParams(params)`**:

- 过滤 `undefined` 值
- 对 key 和 value 分别 `encodeURIComponent`
- 返回 `key1=value1&key2=value2` 格式

**`appendQueryParams(url, params)`**:

- 保留 URL 中已有的 `?` 查询参数（追加 `&`）
- 正确处理 `#` fragment（查询参数插入在 fragment 之前）
- 无参数时返回原 URL

### 与 的差异

的 `Url.stringify` 不做 `encodeURIComponent` 且不处理 fragment。Protocol 的实现更健壮，在实际使用中不影响兼容性（服务端框架通常自动解码）。

---

## 协议模块一览

| 协议模块   | 数据模型         | 编码方式           |
| ---------- | ---------------- | ------------------ | ----------------------- | ------ |
| Error      | ✅ 字段顺序一致  | ✅ `c=` + JSON     |
| Metric     | ✅ key/vs/tvs/ts | ✅ JSON POST       |
| Resource   | ✅ 17 字段一致   | ✅ JSON + Protobuf |
| Page Speed | ✅ 27 点位一致   | ✅ `\|` 拼接       |
| PV         | ✅ 字段一致      | ✅ URL query       |
| Perf       | — (新增)         | JSON               |
| Query      | `Url.stringify`  | —                  | ✅ `encodeURIComponent` | 更健壮 |
