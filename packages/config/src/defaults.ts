import {
  HORN_URL,
  LOGAN_CDN_PREFIXES,
  PERF_DEFAULT_ENDPOINTS,
  getReportBaseUrl
} from "./endpoints";
import type { MonitorConfig } from "./types";

export function createDefaultConfig(): MonitorConfig {
  return {
    project: "",
    devMode: false,
    reportBaseUrl: getReportBaseUrl(false),
    hornUrl: HORN_URL,
    envFilterName: "default",
    filters: {},
    autoCatch: {
      js: true,
      resource: true,
      ajax: true,
      console: false,
      unhandledrejection: true,
      pv: true,
      page: true,
      metric: true
    },
    page: {
      enable: true,
      delay: 0,
      sample: 1,
      points: [],
      fstPerfAnalysis: true
    },
    SPA: {
      enable: true,
      autoPv: true,
      routeMode: "auto"
    },
    resource: {
      enable: true,
      sample: 0.1,
      sampleApi: 0.1,
      batchSize: 20,
      delay: 2000,
      combo: true,
      resourceReg: /\.(js|css|png|jpe?g|gif|webp|svg|woff2?|ttf|eot)(\?.*)?$/i,
      ignoreList: [],
      catchAbort: true,
      catchTimeout: false,
      enableStatusCheck: false,
      ignoreMTSIForbidRequest: true,
      disablePerformanceObserver: false
    },
    ajax: {
      enable: true,
      sample: 1,
      timeout: 15000,
      ignoreList: [],
      withFetch: true,
      withXHR: true,
      invalid: true,
      autoBusinessCode: false,
      parseResponse(res: unknown) {
        const o = res as Record<string, unknown> | null;
        if (!o || typeof o !== "object") return {};
        return { code: (o.code ?? o.status) as string | number | undefined };
      },
      enableLogTrace: false
    },
    image: {
      enable: true,
      maxSize: 2048,
      maxDuration: 30000,
      fileSize: 100,
      filter: null
    },
    error: {
      enable: true,
      sample: 1,
      maxQueueLength: 20,
      ignoreList: [],
      maxRepeat: 5,
      noScriptError: true,
      formatUnhandledRejection: false,
      combo: false,
      maxNum: 100,
      maxTime: 60000,
      delay: 1000,
      maxSize: 10240,
      disableCache: true
    },
    metric: {
      enable: true,
      sample: 1,
      tags: {}
    },
    logan: {
      enable: false,
      version: "1.0.0",
      cdnPrefixes: [...LOGAN_CDN_PREFIXES],
      autoLoad: false
    },
    perf: createDefaultPerfConfig(),
    bridge: {
      enable: true,
      preferredMethod: "ffp.record"
    },
    compat: {
      legacyOwlAlias: false,
      monitorQueue: true
    }
  };
}

function createDefaultPerfConfig(): MonitorConfig["perf"] {
  return {
    enable: true,
    fsp2: {
      enable: true,
      sample: 1,
      endpoint: PERF_DEFAULT_ENDPOINTS.fsp2,
      timeout: 10000,
      debug: false,
      useIgnore: false,
      defer: true,
      fspClsEnable: true,
      customTags: {}
    },
    ird: createDefaultPerfFeature(PERF_DEFAULT_ENDPOINTS.ird),
    shr: createDefaultPerfFeature(PERF_DEFAULT_ENDPOINTS.shr),
    cache: {
      enable: true,
      key: "__perf_cache",
      maxLength: 50
    }
  };
}

function createDefaultPerfFeature(endpoint: string): MonitorConfig["perf"]["ird"] {
  return {
    enable: true,
    sample: 1,
    endpoint,
    timeout: 3000,
    debug: false,
    useIgnore: false,
    defer: true,
    fspClsEnable: false,
    customTags: {}
  };
}
