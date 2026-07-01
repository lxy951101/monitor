import { LOGAN_CDN_PREFIXES } from "@monitor/config";
import { loadLoganScript, type ScriptDocument } from "./load-script";

export interface LoganApi {
  log: (message: string, type: string) => void;
}

export interface LoganManagerOptions {
  api?: LoganApi;
  version?: string;
  cdnPrefixes?: readonly string[];
  autoLoad?: boolean;
  document?: ScriptDocument;
  loadScript?: () => Promise<void>;
  getGlobalApi?: () => LoganApi | undefined;
}

interface LoganRecord {
  type: string;
  payload: unknown;
}

export class LoganManager {
  private api: LoganApi | undefined;
  private readonly options: LoganManagerOptions;
  private readonly queue: LoganRecord[] = [];

  constructor(options: LoganManagerOptions = {}) {
    this.options = options;
    this.api = options.api;
  }

  async start(): Promise<void> {
    if (this.api || !this.options.autoLoad) {
      return;
    }

    await this.load();
  }

  async load(): Promise<void> {
    const loader = this.options.loadScript ?? (() => loadLoganScript({
      version: this.options.version ?? "1.0.0",
      cdnPrefixes: this.options.cdnPrefixes ?? LOGAN_CDN_PREFIXES,
      document: this.options.document
    }));
    await loader();
    const api = this.getGlobalApi();
    if (api) {
      this.setReady(api);
    }
  }

  setReady(api: LoganApi): void {
    this.api = api;
    this.flush();
  }

  log(type: string, payload: unknown): void {
    const record = { type, payload };
    if (!this.api) {
      this.queue.push(record);
      return;
    }

    this.send(record);
  }

  flush(): void {
    if (!this.api) {
      return;
    }

    for (const record of this.queue.splice(0, this.queue.length)) {
      this.send(record);
    }
  }

  session(payload: unknown): void {
    this.log("Session", payload);
  }

  navigation(payload: unknown): void {
    this.log("Navigation", payload);
  }

  performance(payload: unknown): void {
    this.log("Performance", payload);
  }

  ajax(payload: unknown): void {
    this.log("Ajax", payload);
  }

  error(payload: unknown): void {
    this.log("Error", payload);
  }

  resource(payload: unknown): void {
    this.log("Resource", payload);
  }

  private send(record: LoganRecord): void {
    this.api?.log(JSON.stringify(record.payload), record.type);
  }

  private getGlobalApi(): LoganApi | undefined {
    return this.options.getGlobalApi?.() ?? getRuntimeLoganApi();
  }
}

function getRuntimeLoganApi(): LoganApi | undefined {
  const candidate = (globalThis as { Logan?: LoganApi }).Logan;
  return candidate && typeof candidate.log === "function" ? candidate : undefined;
}
