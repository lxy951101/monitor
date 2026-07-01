export interface FetchCall {
  method: string;
  url: string;
  statusCode: number | string;
  duration: number;
  requestbyte: number;
  responsebyte: number;
  type: "fetch";
  firstCategory?: string;
  logContent?: string;
  xForbidReason?: string;
  traceid?: string;
}

export interface FetchInterceptorOptions {
  window: { fetch: typeof fetch };
  onCall: (call: FetchCall) => void;
  shouldIgnore?: (url: string) => boolean;
  now?: () => number;
  /** 是否注入 M-TRACEID + M-APPKEY 请求头 */
  enableLogTrace?: boolean;
  /** 项目名，用于构造 M-APPKEY */
  project?: string;
  /** 是否自动解析业务码 */
  autoBusinessCode?: boolean;
  /** 业务码解析器 */
  parseResponse?: (res: unknown) => { code?: string | number };
  /** 是否忽略 MTSI 反爬拦截 */
  ignoreMTSIForbid?: boolean;
}

export interface FetchInterceptor {
  start: () => void;
  stop: () => void;
  isStarted: () => boolean;
}

export function createFetchInterceptor(options: FetchInterceptorOptions): FetchInterceptor {
  const originalFetch = options.window.fetch;
  const now = options.now ?? Date.now;
  let started = false;

  return {
    start() {
      if (started) return;
      started = true;
      options.window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = getFetchUrl(input);

        // 跳过 HEAD / no-cors
        if (init?.method === "HEAD" || init?.mode === "no-cors") {
          return originalFetch(input, init);
        }

        const method = init?.method ?? getFetchMethod(input);
        const startedAt = now();

        // trace 注入
        let traceid: string | undefined;
        if (options.enableLogTrace && options.project && isSameOrigin(url)) {
          try {
            traceid = generateTraceId();
            const headers = new Headers(init?.headers);
            headers.append("M-TRACEID", traceid);
            headers.append("M-APPKEY", `fe_${options.project}`);
            init = { ...init, headers };
          } catch {
            // ignore
          }
        }

        try {
          const response = await originalFetch(input, init);
          // Body clone + Content-Type 过滤 + x-forbid-reason
          if (response && typeof response.clone === "function" && !options.shouldIgnore?.(url)) {
            const copy = response.clone();
            const contentType = copy.headers.get("content-type");
            const xForbidReason = copy.headers.get("x-forbid-reason") ?? undefined;

            // MTSI 反爬检测
            if (options.ignoreMTSIForbid && xForbidReason && copy.status === 403) {
              return response;
            }

            if (contentType && !/(text)|(json)/.test(contentType)) {
              return response;
            }

            // 异步读取 body 用于业务码解析
            copy
              .text()
              .then((responseText) => {
                notifyFetchCall(options, {
                  method,
                  url,
                  statusCode: buildFetchStatusCode(
                    true,
                    copy.ok,
                    copy.status,
                    options,
                    responseText,
                  ),
                  duration: Math.max(0, now() - startedAt),
                  requestbyte: estimateBodySize(init?.body),
                  responsebyte: readContentLength(response),
                  type: "fetch",
                  firstCategory: copy.ok ? "" : "ajaxError",
                  logContent: copy.ok ? "" : `${copy.status} ${copy.statusText || ""}`,
                  xForbidReason,
                  traceid,
                });
              })
              .catch(() => undefined);
          }

          return response;
        } catch (error) {
          // 失败分类
          if (!options.shouldIgnore?.(url)) {
            options.onCall({
              method,
              url,
              statusCode: "500|",
              duration: Math.max(0, now() - startedAt),
              requestbyte: estimateBodySize(init?.body),
              responsebyte: 0,
              type: "fetch",
              firstCategory: "ajaxError",
              logContent: error instanceof Error ? (error.stack ?? error.message) : String(error),
              traceid,
            });
          }
          throw error;
        }
      };
    },
    stop() {
      if (!started) return;
      options.window.fetch = originalFetch;
      started = false;
    },
    isStarted() {
      return started;
    },
  };
}

function notifyFetchCall(options: FetchInterceptorOptions, call: FetchCall): void {
  if (!options.shouldIgnore?.(call.url)) {
    options.onCall(call);
  }
}

function buildFetchStatusCode(
  isSuccess: boolean,
  ok: boolean,
  status: number,
  options: FetchInterceptorOptions,
  responseText?: string,
): string {
  const defaultCode = ok ? 200 : 404;
  const httpCode = status || defaultCode;
  let businessCode: string | number | undefined;

  if (isSuccess && ok && options.autoBusinessCode && options.parseResponse && responseText) {
    try {
      const parsed = JSON.parse(responseText);
      const result = options.parseResponse(parsed);
      businessCode = result?.code;
    } catch {
      // ignore
    }
  }

  return `${httpCode}|${businessCode ?? ""}`;
}

function getFetchUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  return input instanceof URL ? input.href : input.url;
}

function getFetchMethod(input: RequestInfo | URL): string {
  if (typeof Request !== "undefined" && input instanceof Request) {
    return input.method;
  }
  return "GET";
}

function readContentLength(response: Response): number {
  const value = response.headers.get("content-length");
  return value ? Number(value) || 0 : 0;
}

function estimateBodySize(body: unknown): number {
  if (body === undefined || body === null) return 0;
  return typeof body === "string" ? body.length : JSON.stringify(body).length;
}

function isSameOrigin(url: string): boolean {
  try {
    const target = new URL(url, location.origin);
    return target.origin === location.origin;
  } catch {
    return false;
  }
}

function generateTraceId(): string {
  const s4 = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}
