import type { MonitorClient } from "@monitor/sdk";

export interface PlaygroundAction {
  id: string;
  label: string;
  run: () => void | Promise<void>;
}

export function createActions(
  client: MonitorClient,
  writeLog: (message: string) => void,
): PlaygroundAction[] {
  return [
    { id: "js-error", label: "JS Error", run: () => triggerJsError() },
    { id: "rejection", label: "unhandledrejection", run: () => triggerUnhandledRejection() },
    {
      id: "console-error",
      label: "console.error",
      run: () => console.error("playground console error"),
    },
    { id: "xhr-ok", label: "XHR 成功", run: () => requestWithXhr("/api/pv?source=xhr-ok") },
    { id: "xhr-fail", label: "XHR 失败", run: () => requestWithXhr("/__missing") },
    {
      id: "fetch-ok",
      label: "fetch 成功",
      run: () => fetch("/api/pv?source=fetch-ok", { method: "POST" }),
    },
    { id: "fetch-fail", label: "fetch 失败", run: () => fetch("/__missing", { method: "POST" }) },
    { id: "resource-error", label: "资源加载失败", run: () => triggerResourceError() },
    {
      id: "manual-api",
      label: "手动 API",
      run: () => fetch("/rapi/metricjts", createJsonRequest({ manual: true })),
    },
    {
      id: "manual-error",
      label: "手动 error",
      run: () => client.reportError(new Error("manual playground error")),
    },
    { id: "metric", label: "metric", run: async () => reportMetric(client) },
    {
      id: "reset-pv",
      label: "resetPv",
      run: () => client.resetPv({ pageId: "playground-reset" }).reportPv(),
    },
    { id: "spa-route", label: "SPA 路由", run: () => pushRoute(writeLog) },
    { id: "touchend", label: "touchend", run: () => window.dispatchEvent(new Event("touchend")) },
    { id: "scroll", label: "滚动", run: () => triggerScroll() },
  ];
}

function triggerJsError(): void {
  setTimeout(() => {
    throw new Error("playground js error");
  }, 0);
}

function triggerUnhandledRejection(): void {
  void Promise.reject(new Error("playground unhandled rejection"));
}

function requestWithXhr(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.onload = () => resolve();
    xhr.onerror = () => reject(new Error("xhr failed"));
    xhr.send("playground=1");
  });
}

function triggerResourceError(): void {
  const image = new Image();
  image.src = `/missing-${Date.now()}.png`;
  document.body.appendChild(image);
  setTimeout(() => image.remove(), 3000);
}

async function reportMetric(client: MonitorClient): Promise<void> {
  client.setMetric("playground_click", 1, { source: "button" });
  await client.reportMetric();
}

function pushRoute(writeLog: (message: string) => void): void {
  const next = `/playground/${Date.now().toString(36)}`;
  history.pushState({ next }, "", next);
  window.dispatchEvent(new PopStateEvent("popstate"));
  writeLog(`route: ${next}`);
}

function triggerScroll(): void {
  const scroller = document.querySelector<HTMLElement>("[data-scroll-zone]");
  if (!scroller) {
    return;
  }

  scroller.scrollTop = scroller.scrollTop > 20 ? 0 : 160;
  window.dispatchEvent(new Event("scroll"));
}

function createJsonRequest(body: unknown): RequestInit {
  return {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
}
