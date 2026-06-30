import {
  TransportError,
  type Transport,
  type TransportRequest,
  type TransportResponse
} from "./types";

export interface XhrLike {
  status: number;
  responseText: string;
  onload: (() => void) | null;
  onerror: (() => void) | null;
  ontimeout: (() => void) | null;
  onabort: (() => void) | null;
  timeout?: number;
  open(method: string, url: string): void;
  setRequestHeader(key: string, value: string): void;
  send(body?: BodyInit | null): void;
}

export type XhrConstructor = new () => XhrLike;

export interface XhrTransportOptions {
  XMLHttpRequest?: XhrConstructor;
  timeout?: number;
}

export function createXhrTransport(options: XhrTransportOptions = {}): Transport {
  return {
    send(request) {
      const Xhr = options.XMLHttpRequest ?? getGlobalXMLHttpRequest();
      if (!Xhr) {
        return Promise.reject(new TransportError("XMLHttpRequest is not available"));
      }

      return sendWithXhr(Xhr, request, options.timeout);
    }
  };
}

function sendWithXhr(
  Xhr: XhrConstructor,
  request: TransportRequest,
  defaultTimeout: number | undefined
): Promise<TransportResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new Xhr();
    let settled = false;

    xhr.onload = () => {
      if (settled) {
        return;
      }

      const response = createResponse(xhr);
      if (response.ok) {
        settled = true;
        resolve(response);
        return;
      }

      settled = true;
      reject(
        new TransportError(`HTTP request failed with status ${xhr.status}`, {
          status: xhr.status,
          response
        })
      );
    };
    xhr.onerror = () => rejectOnce("XMLHttpRequest failed");
    xhr.ontimeout = () => rejectOnce("XMLHttpRequest timed out");
    xhr.onabort = () => rejectOnce("XMLHttpRequest aborted");
    xhr.open(request.method, request.url);
    setTimeoutOption(xhr, request.timeout ?? defaultTimeout);
    setHeaders(xhr, request.headers);
    xhr.send(request.method === "GET" ? undefined : request.body);

    function rejectOnce(message: string): void {
      if (settled) {
        return;
      }

      settled = true;
      reject(new TransportError(message));
    }
  });
}

function createResponse(xhr: XhrLike): TransportResponse {
  return {
    ok: xhr.status >= 200 && xhr.status < 300,
    status: xhr.status,
    body: xhr.responseText
  };
}

function setHeaders(xhr: XhrLike, headers: Record<string, string> | undefined): void {
  if (!headers) {
    return;
  }

  for (const [key, value] of Object.entries(headers)) {
    xhr.setRequestHeader(key, value);
  }
}

function setTimeoutOption(xhr: XhrLike, timeout: number | undefined): void {
  if (typeof timeout !== "number" || timeout <= 0) {
    return;
  }

  xhr.timeout = timeout;
}

function getGlobalXMLHttpRequest(): XhrConstructor | undefined {
  return typeof globalThis.XMLHttpRequest === "undefined"
    ? undefined
    : (globalThis.XMLHttpRequest as unknown as XhrConstructor);
}
