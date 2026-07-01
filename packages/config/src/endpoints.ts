export const SDK_VERSION = "0.0.0";

export const REPORT_BASE_URLS = {
 production: "https://report.example.com",
 development: "https://report-dev.example.com"
} as const;

export const API_PATHS = {
 log: "/api/log",
 logTs: "/api/logts",
 speedTs: "/api/speedts",
 pbBatchTs: "/api/pbbatchts",
 batchTs: "/api/batchts",
 metricJTs: "/api/metricjts",
 pvTs: "/api/pvts",
 fstSpeed: "/api/fstSpeed",
 fstLog: "/api/fstLog"
} as const;

export const PERF_DEFAULT_ENDPOINTS = {
 fsp2: "/api/fsp2",
 ird: "/api/ird",
 shr: "/api/shr"
} as const;

export function getReportBaseUrl(devMode: boolean): string {
 return devMode ? REPORT_BASE_URLS.development : REPORT_BASE_URLS.production;
}
