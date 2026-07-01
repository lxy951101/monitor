export const SDK_VERSION = "0.0.0";

export const REPORT_BASE_URLS = {
  production: "https://report.example.com",
  development: "https://report-dev.example.com"
} as const;

export const API_PATHS = {
  log: "/api/log",
  logTs: "/api/logts",
  speedTs: "/api/speedts",
  pbBatchTs: "/pbbatchts",
  batchTs: "/batchts",
  metricJTs: "/rapi/metricjts",
  pvTs: "/api/pvts",
  fstSpeed: "/raptorapi/fstSpeed",
  fstLog: "/raptorapi/fstLog"
} as const;

export const PERF_DEFAULT_ENDPOINTS = {
  fsp2: "/perf/api/fsp2",
  ird: "/perf/api/ird",
  shr: "/perf/api/shr"
} as const;

export function getReportBaseUrl(devMode: boolean): string {
  return devMode ? REPORT_BASE_URLS.development : REPORT_BASE_URLS.production;
}
