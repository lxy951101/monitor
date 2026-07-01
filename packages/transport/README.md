# @monitor/transport

SDK 传输层。提供数据上报的各种通道和批处理队列。

## 架构

```
┌──────────────────────────────────────────────┐
│                 Transport 接口                 │
│         send(req) → Promise<Response>         │
├──────────┬──────────┬──────────┬─────────────┤
│   XHR    │  Beacon  │  Bridge  │ Container   │
│  (http)  │ (beacon) │ (bridge) │BridgeReporter│
├──────────┴──────────┴──────────┴─────────────┤
│              ReportQueue<T>                    │
│     (批量/防抖队列 · 失败回滚 · 重入保护)        │
├──────────────────────────────────────────────┤
│  LocalStorageCache · onPageHide · Types       │
└──────────────────────────────────────────────┘
```

## 核心类型

```typescript
interface Transport {
  send(request: TransportRequest): Promise<TransportResponse>;
}

interface TransportRequest {
  method: "GET" | "POST";
  url: string;
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}

interface TransportResponse {
  ok: boolean;
  status: number;
  body?: string;
}
```

## 传输通道

### XHR (`http.ts`)

标准 `XMLHttpRequest` 封装，返回 Promise。支持依赖注入便于测试。

```typescript
const transport = createXhrTransport({ timeout: 5000 });
const res = await transport.send({ method: "POST", url: "https://...", body: data });
```

### Beacon (`beacon.ts`)

`navigator.sendBeacon` 封装，适用于页面卸载时的"fire-and-forget"上报。始终返回 `{ ok: true, status: 0 }`。

```typescript
const transport = createBeaconTransport();
```

### Bridge (`bridge.ts`)

容器/App 环境中的 Native Bridge 通信。

**`createBridgeTransport`** — 通用桥接，查找到对应方法后包装为 `Transport` 接口。

**`createContainerBridgeReporter`** — 高级桥接上报器：

1. 按优先级尝试 `preferredMethod` + `fallbackMethods`
2. 桥可用 → 先补发缓存 → 发送当前事件
3. 桥不可用 → 写入 `localStorage` 缓存（上限默认 50）

```typescript
const reporter = createContainerBridgeReporter({
  preferredMethod: "ffp.record",
  fallbackMethods: ["sendBabelLog"],
  bridge: window.KNB,
  storage: localStorage,
});
await reporter.send({ method: "POST", url: "bridge://event", body: data });
```

## ReportQueue 批处理队列

可配置的批量/防抖发送队列。

| 参数        | 默认值 | 说明                                  |
| ----------- | ------ | ------------------------------------- |
| `maxLength` | —      | 达到此数量立即 flush                  |
| `delay`     | —      | 防抖延迟，> 0 时实际不低于 `minDelay` |
| `minDelay`  | `1000` | 延迟下限（ms），防止过于频繁的发送    |
| `send`      | —      | 发送回调                              |
| `onFail`    | —      | 发送失败回调                          |

**内部机制：**

- **批量发送：** `add()` 推入内部数组，满 `maxLength` 时触发 flush
- **防抖：** 未满时通过 `setTimeout(delay)` 延迟发送
- **失败回滚：** 发送失败后数据 `unshift` 回队列头部
- **重入保护：** 并发 flush 期间新数据标记 `needsFlush`，当前 flush 完成后继续发送

```typescript
const queue = new ReportQueue({
  maxLength: 20,
  delay: 2000,
  minDelay: 1000,
  send: async (batch) => { await transport.send(...); },
  onFail: (err, batch) => console.error("send failed", err)
});

queue.add({ type: "page", data: ... });
queue.add({ type: "error", data: ... });
await queue.flush(); // 手动 flush
```

## 其他工具

### onPageHide

监听 `visibilitychange` 和 `pagehide` 事件，页面隐藏时触发回调。用于页面离开时 flush 未发送数据。

```typescript
const stop = onPageHide(() => queue.flush());
// stop() 停止监听
```

### LocalStorageCache

localStorage 包装，提供 `get<T>()`、`save(items)`、`clear()`，JSON 序列化异常不抛错。

```typescript
const cache = new LocalStorageCache<string[]>("my_cache_key");
cache.save(["a", "b"]);
const items = cache.get(); // → ["a", "b"]
```
