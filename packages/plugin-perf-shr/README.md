# @monitor/plugin-perf-shr

滚动性能（Scroll Health Report）监控插件，通过追踪 `scroll` 事件期间的帧率变化来评估页面滚动流畅度。

## 实现原理

### 核心思路

滚动性能无法用单一的浏览器 API 直接测量，插件通过组合三个基础能力来间接评估：

1. **scroll 事件** — 感知滚动的开始与结束
2. **requestAnimationFrame** — 在滚动期间逐帧采样时间戳
3. **idle 超时** — 判定滚动动作结束

```
scroll 触发 → 开始 rAF 循环 → 逐帧记录时间戳
                                    ↓
              滚动停止（150ms 无变化）→ 计算指标 → 上报
```

### 关键设计

#### 1. 滚动检测（两种目标）

`onScroll` 处理两种滚动的目标：

- **window / document** — 页面级滚动，取 `window.scrollY`
- **可滚动容器**（如 `overflow: scroll` 的 div）— 容器内滚动，取 `element.scrollTop`

每次 `scroll` 事件触发时比较当前滚动值与上次值，若不同则刷新 `lastScrollChangeTime`。

#### 2. 帧追踪

`requestAnimationFrame` 在浏览器每帧渲染前触发回调（理想 60fps，即每帧约 16.7ms）。

每帧记录时间戳到 `frameTimes[]` 数组，同时检查滚动值是否变化以更新最后活跃时间。

#### 3. 滚动结束判定（idle 检测）

当 `now - lastScrollChangeTime > idleDelay`（150ms，对齐 owl.js）时判定滚动结束。不依赖 `scrollend` 事件以获得更好的兼容性。

#### 4. 指标计算

```
duration       = endTime - startTime                            // 滚动持续时长 (ms)
frames         = frameTimes.length                               // 采样帧数
fps            = (frames × 1000) / duration                      // 每秒帧数
gap_i          = max(0, frameTimes[i] - frameTimes[i-1] - 16.7) // 第 i 帧的超额间隔
frameDropRate  = (Σ gap_i / duration) × 1000                     // 掉帧率 (0~1000)
```

`frameDropRate` 取值范围 0~1000：
- **0** — 每帧都在预算内（16.7ms），无掉帧
- **1000** — 所有帧都超预算，相当于完全卡死

只累加正向的超额间隔（`max(0, gap)`），即"提前帧"不会抵消"掉帧"，确保掉帧率反映真实卡顿。

#### 5. 采样

通过 `sample`（0~1 小数，如 0.05 = 5%）控制上报比例，避免全量上报对服务端造成压力。采样在 `report()` 入口处判定，未命中则跳过整个上行。

#### 6. 双通道上报

| 运行环境 | 上报方式 |
|---------|---------|
| **Browser（纯 Web）** | POST 到 `perf.shr.endpoint`，body 为 `{ category: "shr_web", env, logs: [metrics] }` |
| **Container（混合架构）** | 通过 bridge 调用 `shr.sendScrollStateTime`，由客户端侧完成采集后回传 |

Container 模式下插件只上报 `scrollStartTime` / `scrollEndTime`，实际的掉帧率由客户端计算。

#### 7. 自身耗时追踪（costMs）

每次 `onScroll` 和 `trackFrame` 回调的执行耗时被累加，上报时附带 `costMs` 字段，用于评估插件自身对页面的性能影响。

#### 8. 运行时抽象

通过 `ShrRuntime` 接口将浏览器 API 抽象，便于单测注入 mock：

```ts
interface ShrRuntime {
  addEventListener(...)
  removeEventListener(...)
  requestAnimationFrame(...)
  cancelAnimationFrame?(...)
  now()                    // 时间源
  getScrollValue?(target)  // 滚动值获取
}
```

生产环境通过 `getRuntime()` 绑定 `window` / `performance` 原生方法。

### 数据流

```
scroll 事件 (capture 阶段)
  │
  ├─ 首次触发: reportScrollState(startTime, 0) → bridge 通知客户端滚动开始
  │             启动 rAF 循环
  │
  └─ 每帧 trackFrame(time):
       ├─ frameTimes.push(time)
       ├─ 更新 lastScrollChangeTime
       ├─ idle 判定: now - lastScrollChangeTime > 150ms?
       │   ├─ 是 → report({ startTime, endTime, frameTimes })
       │   │       → calculateScrollMetrics() → send ─→ /perf/shr
       │   │       重置状态，停止 rAF
       │   └─ 否 → 继续 requestAnimationFrame(trackFrame)
       └─ 累加 costMs
```

### 配置项

```ts
interface ShrPluginOptions {
  idleDelay?: number;         // 滚动停止判定阈值 (ms)，默认 150
  cache?: PerfCache;           // 离线缓存实例
  random?: () => number;       // 随机数生成器（采样用）
  runtime?: ShrRuntime;        // 运行时注入（测试用）
  containerBridge?: BridgeLike; // 容器桥接对象
  metadata?: PerfPluginMetadata;
}
```

通过 `@monitor/core` 的 `CfgManager` 读取：

```ts
context.cfgManager.getConfig("perf.shr")
// → { enable, endpoint, sample, timeout, customTags }
```

### 与 owl.js 的对齐

本插件是 owl.js（`refer/owl_1.13.5.js`）`PluginShr` 的重写版本，核心行为已对齐：

| 项 | owl.js | plugin-perf-shr |
|---|---|---|
| idle 阈值 | 150ms | 150ms ✅ |
| 事件捕获 | `capture: true` | `capture: true` ✅ |
| 日志 | `[shr]` 前缀 | `[shr]` 前缀 ✅ |
| costMs | 追踪 | 追踪 ✅ |
| 技术栈标识 | Browser: `queue.add` / Container: `knb` | Browser: HTTP POST / Container: `container` |
