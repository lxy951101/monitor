export interface AjaxCall {
  method: string;
  url: string;
  statusCode: number;
  duration: number;
  requestbyte: number;
  responsebyte: number;
  type: "ajax";
}

export interface AjaxInterceptorOptions {
  window: { XMLHttpRequest: new () => XMLHttpRequest };
  onCall: (call: AjaxCall) => void;
  shouldIgnore?: (url: string) => boolean;
  now?: () => number;
}

export interface AjaxInterceptor {
  start: () => void;
  stop: () => void;
  isStarted: () => boolean;
}

export function createAjaxInterceptor(options: AjaxInterceptorOptions): AjaxInterceptor {
  const OriginalXHR = options.window.XMLHttpRequest;
  const now = options.now ?? Date.now;
  let started = false;

  return {
    start() {
      if (started) {
        return;
      }

      started = true;
      options.window.XMLHttpRequest = createPatchedXHR(OriginalXHR, options, now);
    },
    stop() {
      if (!started) {
        return;
      }

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

function patchInstance(xhr: XMLHttpRequest, options: AjaxInterceptorOptions, now: () => number): void {
  const originalOpen = xhr.open;
  const originalSend = xhr.send;
  let method = "GET";
  let url = "";
  let startTime = 0;

  xhr.open = function patchedOpen(this: XMLHttpRequest, nextMethod: string, nextUrl: string | URL) {
    method = nextMethod;
    url = String(nextUrl);
    return originalOpen.apply(this, arguments as unknown as Parameters<XMLHttpRequest["open"]>);
  } as XMLHttpRequest["open"];

  xhr.send = function patchedSend(this: XMLHttpRequest, body?: Document | XMLHttpRequestBodyInit | null) {
    startTime = now();
    attachLoadEnd(xhr, () => {
      if (!url || options.shouldIgnore?.(url)) {
        return;
      }

      options.onCall({
        method,
        url,
        statusCode: xhr.status,
        duration: Math.max(0, now() - startTime),
        requestbyte: estimateBodySize(body),
        responsebyte: estimateBodySize(xhr.responseText),
        type: "ajax"
      });
    });
    return originalSend.call(this, body);
  } as XMLHttpRequest["send"];
}

function attachLoadEnd(xhr: XMLHttpRequest, listener: () => void): void {
  if (typeof xhr.addEventListener === "function") {
    xhr.addEventListener("loadend", listener);
    return;
  }

  const originalReadyStateChange = xhr.onreadystatechange;
  xhr.onreadystatechange = function patchedReadyStateChange(event: Event) {
    originalReadyStateChange?.call(this, event);
    if (xhr.readyState === 4) {
      listener();
    }
  };
}

function estimateBodySize(body: unknown): number {
  if (body === undefined || body === null) {
    return 0;
  }

  return typeof body === "string" ? body.length : JSON.stringify(body).length;
}
