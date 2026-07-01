import { Monitor } from "@monitor/sdk";
import { createActions } from "./actions";
import "./style.css";

const client = Monitor.start({
  project: "monitor-playground",
  devMode: true,
  reportBaseUrl: "",
  page: { sample: 1 },
  metric: { sample: 1 },
  resource: { sample: 1 },
  ajax: { sample: 1 },
  error: { sample: 1 },
  perf: {
    enable: true,
    fsp2: { enable: true, endpoint: "/perf/api/fsp2", sample: 1, timeout: 1000 },
    ird: { enable: true, endpoint: "/perf/api/ird", sample: 1 },
    shr: { enable: true, endpoint: "/perf/api/shr", sample: 1 }
  }
});

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) {
  throw new Error("#app is missing");
}
const appRoot = app;

const logs: string[] = [];
render();

function render(): void {
  appRoot.innerHTML = `
    <main class="shell">
      <header class="topbar">
        <div>
          <h1>Monitor Playground</h1>
          <p>project: monitor-playground</p>
        </div>
        <button class="secondary" data-action="refresh-records">刷新记录</button>
      </header>
      <section class="workspace">
        <div class="panel actions">
          <h2>触发项</h2>
          <div class="action-grid" data-actions></div>
        </div>
        <div class="panel">
          <h2>本地日志</h2>
          <ol class="log-list" data-log-list></ol>
        </div>
        <div class="panel records">
          <h2>mock-server 记录</h2>
          <pre data-records>[]</pre>
        </div>
      </section>
      <section class="scroll-zone" data-scroll-zone>
        <div></div>
      </section>
    </main>
  `;
  bindActions();
}

function bindActions(): void {
  const actions = createActions(client, writeLog);
  const container = document.querySelector<HTMLElement>("[data-actions]");
  if (!container) {
    return;
  }

  container.innerHTML = actions.map((action) => {
    return `<button type="button" data-action="${action.id}">${action.label}</button>`;
  }).join("");

  for (const action of actions) {
    const button = container.querySelector<HTMLButtonElement>(`[data-action="${action.id}"]`);
    button?.addEventListener("click", () => runAction(action.id, action.run));
  }

  document.querySelector<HTMLButtonElement>("[data-action='refresh-records']")?.addEventListener("click", () => {
    void refreshRecords();
  });
}

function runAction(id: string, run: () => void | Promise<void>): void {
  writeLog(`run: ${id}`);
  Promise.resolve(run())
    .then(() => writeLog(`done: ${id}`))
    .catch((error: unknown) => writeLog(`fail: ${id} ${String(error)}`));
}

function writeLog(message: string): void {
  logs.unshift(`${new Date().toLocaleTimeString()} ${message}`);
  logs.splice(20);
  const list = document.querySelector<HTMLElement>("[data-log-list]");
  if (list) {
    list.innerHTML = logs.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  }
}

async function refreshRecords(): Promise<void> {
  const target = document.querySelector<HTMLElement>("[data-records]");
  if (!target) {
    return;
  }

  const response = await fetch("/__records");
  target.textContent = JSON.stringify(await response.json(), null, 2);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    };
    return map[char];
  });
}
