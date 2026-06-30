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
      sample: 1,
      batchSize: 20,
      delay: 1000,
      resourceReg: /\.(js|css|png|jpe?g|gif|webp|svg|woff2?|ttf|eot)(\?.*)?$/i,
      ignoreList: []
    },
    ajax: {
      enable: true,
      sample: 1,
      timeout: 15000,
      ignoreList: [],
      withFetch: true,
      withXHR: true
    },
    image: {
      enable: true,
      maxSize: 2048,
      maxDuration: 30000
    },
    error: {
      enable: true,
      sample: 1,
      maxQueueLength: 20,
      ignoreList: [],
      maxRepeat: 5
    },
    metric: {
      enable: true,
      sample: 1,
      tags: {}
    },
    logan: {
      enable: false,
      version: "1.0.0",
      cdnPrefixes: LOGAN_CDN_PREFIXES,
      autoLoad: false
    },
    perf: {
      enable: true,
      fsp2: {
        enable: true,
        sample: 1,
        endpoint: PERF_DEFAULT_ENDPOINTS.fsp2,
        timeout: 10000,
        debug: false,
        customTags: {}
      },
      ird: {
        enable: true,
        sample: 1,
        endpoint: PERF_DEFAULT_ENDPOINTS.ird,
        timeout: 3000,
        debug: false,
        customTags: {}
      },
      shr: {
        enable: true,
        sample: 1,
        endpoint: PERF_DEFAULT_ENDPOINTS.shr,
        timeout: 3000,
        debug: false,
        customTags: {}
      },
      cache: {
        enable: true,
        key: "__perf_cache",
        maxLength: 50
      }
    },
    bridge: {
      enable: true,
      useKNB: true,
      useMSI: true
    },
    compat: {
      legacyOwlAlias: false,
      monitorQueue: true
    }
  };
}
