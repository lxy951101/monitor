import { Monitor } from "@monitor/sdk";

// 副作用导入 — 触发所有插件注册
import "@monitor/plugin-error";
import "@monitor/plugin-pv";
import "@monitor/plugin-metric";
import "@monitor/plugin-resource";
import "@monitor/plugin-page";
import "@monitor/plugin-perf-fsp";
import "@monitor/plugin-perf-ird";
import "@monitor/plugin-perf-shr";
import "@monitor/plugin-perf-cache";

(window as any).Monitor = Monitor;

export { Monitor };
