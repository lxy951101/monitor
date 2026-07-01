export type FilterFn = (value: unknown) => boolean;

export interface AutoCatchConfig {
  js: boolean;
  resource: boolean;
  ajax: boolean;
  console: boolean;
  unhandledrejection: boolean;
  pv: boolean;
  page: boolean;
  metric: boolean;
}

export interface PageConfig {
  enable: boolean;
  delay: number;
  sample: number;
  points: string[];
  fstPerfAnalysis: boolean;
}

export interface SpaConfig {
  enable: boolean;
  autoPv: boolean;
  routeMode: "history" | "hash" | "auto";
}

export interface ResourceConfig {
  enable: boolean;
  sample: number;
  sampleApi: number;
  batchSize: number;
  delay: number;
  combo: boolean;
  resourceReg: RegExp;
  ignoreList: Array<string | RegExp>;
  catchAbort: boolean;
  catchTimeout: boolean;
  enableStatusCheck: boolean;
  ignoreMTSIForbidRequest: boolean;
  disablePerformanceObserver: boolean;
}

export interface AjaxConfig {
  enable: boolean;
  sample: number;
  timeout: number;
  ignoreList: Array<string | RegExp>;
  withFetch: boolean;
  withXHR: boolean;
  invalid: boolean;
  autoBusinessCode: boolean;
  parseResponse: (res: unknown) => { code?: string | number };
  enableLogTrace: boolean;
}

export interface ImageConfig {
  enable: boolean;
  maxSize: number;
  maxDuration: number;
  fileSize: number;
  filter: ((url: string) => boolean) | null;
}

export interface ErrorConfig {
  enable: boolean;
  sample: number;
  maxQueueLength: number;
  ignoreList: Array<string | RegExp>;
  maxRepeat: number;
  noScriptError: boolean;
  formatUnhandledRejection: boolean;
  combo: boolean;
  maxNum: number;
  maxTime: number;
  delay: number;
  maxSize: number;
  disableCache: boolean;
}

export interface MetricConfig {
  enable: boolean;
  sample: number;
  tags: Record<string, string>;
}

export interface PerfFeatureConfig {
  enable: boolean;
  sample: number;
  endpoint: string;
  timeout: number;
  debug: boolean;
  useIgnore: boolean;
  defer: boolean;
  fspClsEnable: boolean;
  customTags: Record<string, string>;
}

export interface PerfConfig {
  enable: boolean;
  fsp2: PerfFeatureConfig;
  ird: PerfFeatureConfig;
  shr: PerfFeatureConfig;
  cache: {
    enable: boolean;
    key: string;
    maxLength: number;
  };
}

export interface BridgeConfig {
  enable: boolean;
  preferredMethod: string;
}

export interface CompatConfig {
  legacyOwlAlias: boolean;
  monitorQueue: boolean;
}

export interface MonitorConfig {
  project: string;
  devMode: boolean;
  reportBaseUrl: string;
  envFilterName: string;
  filters: Record<string, FilterFn>;
  disabledFilters: string[];
  /** web 版本号，会附加到 API 请求的 query 中 */
  webVersion: string;
  /** 自定义维度回调，每次上报时调用，返回的 kv 合并到上报数据 */
  setCustomTags: (() => Record<string, string>) | null;
  /** 全局禁用 localStorage 缓存 */
  disableCache: boolean;
  autoCatch: AutoCatchConfig;
  page: PageConfig;
  SPA: SpaConfig;
  resource: ResourceConfig;
  ajax: AjaxConfig;
  image: ImageConfig;
  error: ErrorConfig;
  metric: MetricConfig;
  perf: PerfConfig;
  bridge: BridgeConfig;
  compat: CompatConfig;
}

export type DeepPartial<T> = {
  [Key in keyof T]?: T[Key] extends (...args: never[]) => unknown
    ? T[Key]
    : T[Key] extends RegExp
      ? T[Key]
      : T[Key] extends readonly unknown[]
        ? T[Key]
        : T[Key] extends object
          ? DeepPartial<T[Key]>
          : T[Key];
};

export type ResourceConfigPatch = DeepPartial<Omit<ResourceConfig, "resourceReg">> & {
  resourceReg?: RegExp | string;
};

export type MonitorConfigPatch = DeepPartial<Omit<MonitorConfig, "resource">> & {
  resource?: ResourceConfigPatch;
};
