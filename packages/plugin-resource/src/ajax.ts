export interface AjaxCall {
 method: string;
 url: string;
 statusCode: number | string;
 duration: number;
 requestbyte: number;
 responsebyte: number;
 type: "ajax";
 firstCategory?: string;
 logContent?: string;
 traceid?: string;
}

export interface AjaxInterceptorOptions {
 window: { XMLHttpRequest: new () => XMLHttpRequest };
 onCall: (call: AjaxCall) => void;
 shouldIgnore?: (url: string) => boolean;
 now?: () => number;
 /** 是否捕获 abort 事件 */
 catchAbort?: boolean;
 /** 是否捕获 timeout 事件 */
 catchTimeout?: boolean;
 /** 是否注入 M-TRACEID + M-APPKEY 请求头 */
 enableLogTrace?: boolean;
 /** 项目名，用于构造 M-APPKEY */
 project?: string;
 /** 是否启用 HTTP 状态码检测 */
 enableStatusCheck?: boolean;
 /** 是否自动解析业务码 */
 autoBusinessCode?: boolean;
 /** 业务码解析器 */
 parseResponse?: (res: unknown) => { code?: string | number };
}

export interface AjaxInterceptor {
 start: () => void;
 stop: () => void;
 isStarted: () => boolean;
}

export function createAjaxInterceptor(
 options: AjaxInterceptorOptions
): AjaxInterceptor {
 const OriginalXHR = options.window.XMLHttpRequest;
 const now = options.now ?? Date.now;
 let started = false;

 return {
  start() {
   if (started) return;
   started = true;
   options.window.XMLHttpRequest = createPatchedXHR(OriginalXHR, options, now);
  },
  stop() {
   if (!started) return;
   options.window.XMLHttpRequest = OriginalXHR;
   started = false;
  },
  isStarted() {
   return started;
  }
 };
}

function createPatchedXHR(
 OriginalXHR: new () => XMLHttpRequest,
 options: AjaxInterceptorOptions,
 now: () => number
): new () => XMLHttpRequest {
 function PatchedXMLHttpRequest(): XMLHttpRequest {
  const xhr = new OriginalXHR();
  patchInstance(xhr, options, now);
  return xhr;
 }
 PatchedXMLHttpRequest.prototype = OriginalXHR.prototype;
 return PatchedXMLHttpRequest as unknown as new () => XMLHttpRequest;
}

function patchInstance(
 xhr: XMLHttpRequest,
 options: AjaxInterceptorOptions,
 now: () => number
): void {
 const originalOpen = xhr.open;
 const originalSend = xhr.send;
 let method = "GET";
 let url = "";
 let startTime = 0;

 xhr.open = function patchedOpen(
  this: XMLHttpRequest,
  nextMethod: string,
  nextUrl: string | URL
 ) {
  method = nextMethod;
  url = String(nextUrl);
  // trace 注入 
  if (
   options.enableLogTrace &&
   options.project &&
   isSameOrigin(url)
  ) {
   try {
    const id = generateTraceId();
    if (id) {
     xhr.setRequestHeader("M-TRACEID", id);
     xhr.setRequestHeader("M-APPKEY", `fe_${options.project}`);
     (xhr as unknown as Record<string, unknown>).traceid = id;
    }
   } catch {
    // ignore
   }
  }
  return originalOpen.apply(
   this,
   arguments as unknown as Parameters<XMLHttpRequest["open"]>
  );
 } as XMLHttpRequest["open"];

 xhr.send = function patchedSend(
  this: XMLHttpRequest,
  body?: Document | XMLHttpRequestBodyInit | null
 ) {
  startTime = now();

  const dispatchEvent = (event: Event & { type: string }) => {
   if (!event) return;
   if (options.shouldIgnore?.(url)) return;

   const duration = Math.max(0, now() - startTime);
   const target = xhr;
   const status = target.status;
   const state = event.type;

   // 错误分级 
   const resCfg = options.enableStatusCheck;
   let isSuccess: boolean;
   let httpCode: number;
   let businessCode: string | number | undefined;

   if (resCfg) {
    httpCode = status || (state === "load" ? 200 : 500);
    isSuccess =
     (state === "load" || state === "readystatechange") &&
     ((httpCode >= 200 && httpCode < 300) || httpCode === 304);
   } else {
    isSuccess =
     state === "load" ||
     (state === "readystatechange" && status === 200);
    httpCode = isSuccess ? 200 : 500;
   }

   // 业务码解析 
   if (
    isSuccess &&
    options.autoBusinessCode &&
    typeof target.getResponseHeader === "function" &&
    typeof options.parseResponse === "function"
   ) {
    try {
     const contentType = target.getResponseHeader("Content-Type");
     if (contentType && /(text)|(json)/.test(contentType)) {
      let response = target.responseText ?? target.response;
      if (response) {
       try {
        response =
         typeof response === "string"
          ? JSON.parse(response)
          : response;
       } catch {
        // not JSON, keep as-is
       }
       const result = options.parseResponse(response);
       businessCode = result?.code;
      }
     }
    } catch {
     // ignore
    }
   }

   const statusCode = `${httpCode}|${businessCode ?? ""}`;
   const firstCategory = isSuccess ? "" : "ajaxError";
   const logContent = isSuccess
    ? ""
    : `from: xhr ${state}.${target.statusText ? ` ${httpCode} ${target.statusText}` : ""}`;

   options.onCall({
    method,
    url,
    statusCode,
    duration,
    requestbyte: estimateBodySize(body),
    responsebyte: estimateBodySize(target.responseText),
    type: "ajax",
    firstCategory,
    logContent,
    traceid: (target as unknown as Record<string, unknown>).traceid as string | undefined
   });
  };

  // 事件监听 
  const EVENT_LISTENER = "addEventListener";
  const STATE_CHANGE = "onreadystatechange";

  if (EVENT_LISTENER in xhr) {
   xhr.addEventListener("load", dispatchEvent as EventListener);
   xhr.addEventListener("error", dispatchEvent as EventListener);
   if (options.catchAbort) {
    xhr.addEventListener("abort", dispatchEvent as EventListener);
   }
   if (options.catchTimeout) {
    xhr.addEventListener("timeout", dispatchEvent as EventListener);
   }
  } else {
   // IE fallback
   const raw = xhr as unknown as Record<string, unknown>;
   const originStateChange = raw[STATE_CHANGE] as
    | ((event: Event) => void)
    | undefined;
   raw[STATE_CHANGE] = function (this: XMLHttpRequest, event: Event) {
    if (this.readyState === 4) {
     dispatchEvent(event as Event & { type: string });
    }
    originStateChange?.call(this, event);
   };
  }

  return originalSend.call(this, body);
 } as XMLHttpRequest["send"];
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
