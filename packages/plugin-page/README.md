# plugin-page 实现原理

> 对齐  中 `PageManager` + `FirstScreenManager` 的核心能力，
> 按 monitor 项目架构模块化拆分为独立可测试的单元。

## 整体架构

```
┌─────────────────────────────────────────────────────┐
│                   createPagePlugin()                │
│                     (index.ts)                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────┐  ┌──────────────────────────────┐ │
│  │ PageManager  │  │  FirstScreenObserver         │ │
│  │ 页面测速管理  │  │  (first-screen.ts)           │ │
│  │ 27点位组装   │  │  MutationObserver +          │ │
│  │ 防抖/缓存    │  │  PerformanceObserver         │ │
│  └──────┬───────┘  │  定时停止 / 首屏外检测       │ │
│         │          └──────────────────────────────┘ │
│         │                                           │
│  ┌──────┴───────┐  ┌──────────────────────────────┐ │
│  │ nav-timing   │  │  RouteFirstScreenManager      │ │
│  │ W3C 计时解析 │  │  (route-fst.ts)               │ │
│  │ FP/FCP 采集  │  │  SPA 路由 FST                 │ │
│  └──────────────┘  └──────────────────────────────┘ │
│                                                     │
│  ┌─────────────────────────────────────────────────┐│
│  │  fst-analysis.ts                                ││
│  │  首屏资源汇总 + 慢访问个案                       ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

## 一、Navigation Timing 测速点位 (navigation-timing.ts)

### 点位映射

与 保持 27 点位数组一致：

| 索引 | 含义 | 来源 |
|------|------|------|
| 0 | 占位（始终为 0） | - |
| 1-19 | W3C Navigation Timing 各阶段偏移 | `performance.timing` |
| 20 | DNS 耗时 | `domainLookupEnd - domainLookupStart` |
| 21 | TCP 耗时 | `connectEnd - connectStart` |
| 22 | 下载耗时 | `responseEnd - requestStart` |
| 23 | FP (First Paint) | `performance.getEntriesByType("paint")` |
| 24 | FCP (First Contentful Paint) | 同上 |
| 25 | FST (首屏时间) | FirstScreenObserver 计算填入 |
| 26 | FCP（首屏级） | FirstScreenObserver 计算填入 |

### 核心函数

- **`encodePageSpeedFromTiming(timing)`** — 将 W3C timing 转为竖线分隔的字符串（兼容旧接口）
- **`buildSpeedPoints(timing, paint?)`** — 组装完整 27 点位数组，含 DNS/TCP/Download 计算及 FP/FCP
- **`getPaintEntries()`** — 从浏览器 `performance.getEntriesByType("paint")` 读取 paint 条目

## 二、PageManager 页面测速管理器 (page-manager.ts)

### 核心职责

1. **采集**：从 `performance.timing` + `performance.getEntriesByType("paint")` 组装 27 点位
2. **缓存检测**：通过关键资源的 `transferSize` 判定 `noCache`
3. **防抖上报**：`delay` 配置控制上报间隔，重复调用重置计时器
4. **用户就绪**：`setUserReady()` / `getUserReady()` 确保 FST 异步计算完成前不发送

### 关键方法

```
setInitConfig({pageUrl?, project?})
    └── 存储初始 pageUrl/project，FST 异步计算期间用户修改配置不影响上报

parsePageTime(senseTime?)
    ├── getPerformanceTiming() → { perf, paint }
    ├── buildSpeedPoints(perf, paint) → 27 点位
    ├── 合并 senseTime.FST → points[25], senseTime.FCP → points[26]
    ├── getMainResourceTiming() → 缓存检测 → noCache
    ├── setReady() + report()

report(reportNow?)
    ├── 检查: autoCatch.page && isReady && userReady && points 非空
    ├── delay > 0 → setTimeout 防抖
    └── doSend() → GET /api/speedts?project=&pageurl=&speed=&noCache=...
```

### 缓存检测原理

```
getMainResourceTiming()
  └── 筛选 initiatorType === "link" | "script" 的资源（或自定义 isMainResource）
      └── 检查 transferSize:
          - transferSize > 0 → 非缓存 → noCache = "true"
          - transferSize === 0 && duration > timeThreshold → 非缓存 → noCache = "true"
          - 否则保持 noCache = "false"
```

### 防抖机制

```
report()                    report()                 report()
   │                           │                        │
   ├─ clearTimeout()           ├─ clearTimeout()        ├─ clearTimeout()
   └─ setTimeout(doSend, T)    └─ setTimeout(doSend, T) └─ setTimeout(doSend, T)
                                                           │
                                                    doSend() 执行
```

每次 `report()` 调用会清除之前的计时器并重新计时，确保在 DOM 稳定后只发送一次。

## 三、首屏观察器 (first-screen.ts)

### 工作流程

```
startFirstScreenObserver({ env, onResult, stopTime, maxOutCount, ignoreAttr })
  │
  ├── 1. 创建 MutationObserver → 监听 document.body (childList + subtree)
  │      ├── 每次 DOM 变化 → mutaCallback()
  │      │   ├── 过滤: 非视觉标签(SCRIPT/STYLE/LINK...)、IFRAME、已断开节点、ignoreAttr
  │      │   ├── 记录: { nodes: Element[], startTime: number }
  │      │   ├── 模拟 FCP: 首个含文本或图片的节点时间
  │      │   ├── 首屏外检测: rect.top >= viewportHeight → outCount++
  │      │   └── outCount >= maxOutCount → 提前停止
  │      └── 重置 domTimer → stopTime 内无变化自动停止
  │
  ├── 2. 创建 PerformanceObserver → 监听 resource 条目
  │      └── 每次资源请求 → 重置 perfTimer → stopTime 内无请求自动停止
  │
  ├── 3. 用户交互停止 (可选 interactToStopObserver)
  │      └── document 捕获阶段 click/focus/wheel/touchmove → 立即停止
  │
  ├── 4. 轮询检查 (500ms interval)
  │      └── domDone && perfDone → computeFST() → onResult()
  │
  └── 5. 超时保护
         ├── fstTimer: 8s 全局超时 → 强制停止并回调
         └── perfTimer: 8s 资源监听超时 → 停止 PerformanceObserver
```

### 节点评分算法

```
elementScore = visibleArea × ELEMENT_WEIGHT + DEP_WEIGHT
visibleArea  = min(elementHeight, viewportHeight - max(0, elementTop)) × elementWidth

recordScore  = Σ elementScore (同一批 mutation 中所有有效节点的评分之和)
过滤条件: recordScore > MIN_SCORE (3)
```

### FST 计算

```
FST = max(validRecords.map(r => r.startTime))  // 最后一个有意义 DOM 变化的时间
```

## 四、SPA 路由首屏 (route-fst.ts)

### RouteFirstScreenManager

为每个路由路径维护独立的观察状态：

```
routes: Map<path, {
  start: number,           // 路由切换时刻
  observer: MutationObserver,
  mutaRecords: [...],      // 该路由下的 DOM 变化记录
  domTimer: Timer,         // 超时停止计时器
  domDone: boolean,        // 是否已停止
  outCount: number,        // 首屏外节点计数
  fst: number,             // 计算结果
}>
```

### 路由切换流程

```
startRoute(path)                      stopRoute(oldPath)
  ├── new MutationObserver(body)        ├── domDone = true
  ├── 启动 domTimer (stopTime)          ├── observer.disconnect()
  └── 绑定用户交互停止                   ├── computeRouteFst()
                                        │   └── onResult({ fst, path })
                                        └── routes.delete(path)
```

**典型集成方式**：

```typescript
const routeFst = new RouteFirstScreenManager(
  (result) => pageManager.reportRouteFst(result.fst, result.path),
  { stopTime: 3000, maxOutCount: 15 }
);

startRouteFst({
  routeMode: "auto",
  onRoute: (path, prevPath) => {
    routeFst.switchRoute(prevPath, path);
  }
});
```

## 五、首屏性能分析 (fst-analysis.ts)

### fstPerfAnalysis

基础分析：判断 FST 是否超过阈值，输出 slow 标记和摘要。

### analyzeFirstScreenResources

`parseFirstScreenPerf`，提供资源维度的深度分析：

```
输入: fst (首屏时间), resEntries (performance.getEntriesByType("resource"))
输出: {
  sumInfo: { picCount, picSize, jsCount, jsSize, cssCount, cssSize, ajaxCount },
  slowView?: { js: {}, css: {}, img: {}, ajax: {} },  // 慢访问个案
  fst
}
```

采样策略（）：
- **汇总数据**：按 `fstPerfSample` 采样率上报
- **慢访问个案**：FST > 1s 时，按阶梯采样率（<2s: 5%, ≥2s: 10%）记录每个资源的详细耗时

## 六、插件入口 (index.ts)

```typescript
createPagePlugin(options: PagePluginOptions): Plugin
```

启动时：
1. 创建 `PageManager` 实例
2. 调用 `setInitConfig()` 保存初始 pageUrl/project
3. 调用 `setUserReady()` 标记就绪
4. 若传入 timing 则直接调用 `reportNavigationTiming(timing)`

暴露 `manager` 属性供外部调用：
- `manager.addPoint({ position, duration })` — 自定义测速点
- `manager.reportRouteFst(fst, pageUrl)` — 路由 FST 上报
- `manager.parsePageTime(senseTime)` — 手动触发完整测速解析

## 七、与 的差异总结

| 维度 | | plugin-page |
|------|--------|-------------|
| 上报方式 | GET + QueryString | POST（兼容旧）+ GET（新增完整点位） |
| 点位覆盖 | 27 + Titans | 27 完整覆盖 |
| Paint Timing | ✅ | ✅ |
| 缓存检测 | ✅ | ✅ |
| 防抖延迟 | ✅ | ✅ |
| 用户就绪 | ✅ | ✅ |
| FST MutationObserver | ✅ | ✅ |
| FST PerformanceObserver | ✅ | ✅ |
| 首屏外停止 | ✅ | ✅ |
| 用户交互停止 | ✅ | ✅ |
| 元素 ignore 属性 | ✅ monitor-ignore | ✅ 可配置 |
| SPA 路由 FST | ✅ | ✅ RouteFirstScreenManager |
| 资源汇总分析 | ✅ | ✅ analyzeFirstScreenResources |
| 慢访问个案 | ✅ | ✅ |
| Titans 集成 | ✅ | ❌ (平台特有) |

## 八、上报数据格式

### 完整上报 (parsePageTime 路径)

```
GET /api/speedts?project=<proj>&pageurl=<url>&speed=<27points|>&customspeed=<custom|>&timestamp=<ts>&noCache=true|false
```

- `speed`: 竖线分隔的 27 个点位值（-1 表示无数据的位置）
- `customspeed`: 用户自定义点位（addPoint 填入）
- `noCache`: 是否命中缓存（"true" / "false"）

### 路由 FST 上报

```
GET /api/speedts?...&speed=|||||||||||||||||||||||||||<fst>|
```

点位 27 = FST 值（ms）。
