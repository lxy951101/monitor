export interface FetchCall {
  method: string;
  url: string;
  statusCode: number;
  duration: number;
  requestbyte: number;
  responsebyte: number;
  type: "fetch";
}

export interface FetchInterceptorOptions {
  window: { fetch: typeof fetch };
  onCall: (call: FetchCall) => void;
  shouldIgnore?: (url: string) => boolean;
  now?: () => number;
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
      if (started) {
        return;
      }

      started = true;
      options.window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const startedAt = now();
        const url = getFetchUrl(input);
        const method = init?.method ?? getFetchMethod(input);

        try {
          const response = await originalFetch(input, init);
          notifyFetchCall(options, {
            method,
            url,
            statusCode: response.status,
            duration: Math.max(0, now() - startedAt),
            requestbyte: estimateBodySize(init?.body),
            responsebyte: readContentLength(response),
            type: "fetch"
          });
          return response;
        } catch (error) {
          notifyFetchCall(options, {
            method,
            url,
            statusCode: 0,
            duration: Math.max(0, now() - startedAt),
            requestbyte: estimateBodySize(init?.body),
            responsebyte: 0,
            type: "fetch"
          });
          throw error;
        }
      };
    },
    stop() {
      if (!started) {
        return;
      }

      options.window.fetch = originalFetch;
      started = false;
    },
    isStarted() {
      return started;
    }
  };
}

function notifyFetchCall(options: FetchInterceptorOptions, call: FetchCall): void {
  if (!options.shouldIgnore?.(call.url)) {
    options.onCall(call);
  }
}

function getFetchUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }

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
  if (body === undefined || body === null) {
    return 0;
  }

  return typeof body === "string" ? body.length : JSON.stringify(body).length;
}
