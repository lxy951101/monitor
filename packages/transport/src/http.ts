import { TransportError, type Transport, type TransportRequest, type TransportResponse } from "./types";

export interface XhrLike {
  status: number;
  responseText: string;
  onload: (() => void) | null;
  onerror: (() => void) | null;
  open(method: string, url: string): void;
  setRequestHeader(key: string, value: string): void;
  send(body?: BodyInit | null): void;
}

export type XhrConstructor = new () => XhrLike;

export interface XhrTransportOptions {
  XMLHttpRequest?: XhrConstructor;
}

export function createXhrTransport(options: XhrTransportOptions = {}): Transport {
  return {
    send(request) {
      const Xhr = options.XMLHttpRequest ?? getGlobalXMLHttpRequest();
      if (!Xhr) {
        return Promise.reject(new TransportError("XMLHttpRequest is not available"));
      }

      return sendWithXhr(Xhr, request);
    }
  };
}

function sendWithXhr(
  Xhr: XhrConstructor,
  request: TransportRequest
): Promise<TransportResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new Xhr();

    xhr.onload = () => {
      const response = createResponse(xhr);
      if (response.ok) {
        resolve(response);
        return;
      }

      reject(
        new TransportError(`HTTP request failed with status ${xhr.status}`, {
          status: xhr.status,
          response
        })
      );
    };
    xhr.onerror = () => reject(new TransportError("XMLHttpRequest failed"));
    xhr.open(request.method, request.url);
    setHeaders(xhr, request.headers);
    xhr.send(request.method === "GET" ? undefined : request.body);
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

function getGlobalXMLHttpRequest(): XhrConstructor | undefined {
  return typeof globalThis.XMLHttpRequest === "undefined"
    ? undefined
    : (globalThis.XMLHttpRequest as unknown as XhrConstructor);
}
