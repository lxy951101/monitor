import { TransportError, type Transport, type TransportRequest } from "./types";

export interface BridgeCallbacks {
  success: (response?: unknown) => void;
  fail: (error?: unknown) => void;
}

export type BridgeMethod = (
  params: BridgeRequestParams,
  callbacks: BridgeCallbacks
) => void;

export type BridgeLike = Record<string, unknown>;

export interface BridgeRequestParams {
  method: TransportRequest["method"];
  url: string;
  headers?: Record<string, string>;
  body?: BodyInit | null;
}

export interface BridgeTransportOptions {
  bridge?: BridgeLike;
  method: string;
}

export function createBridgeTransport(options: BridgeTransportOptions): Transport {
  return {
    send(request) {
      const method = options.bridge?.[options.method];
      if (typeof method !== "function") {
        return Promise.reject(
          new TransportError(`Bridge method ${options.method} is not available`)
        );
      }

      return sendWithBridge(method as BridgeMethod, request);
    }
  };
}

function sendWithBridge(method: BridgeMethod, request: TransportRequest) {
  return new Promise<{ ok: true; status: 0; body?: unknown }>((resolve, reject) => {
    method(createParams(request), {
      success: (response) => resolve({ ok: true, status: 0, body: response }),
      fail: (error) => reject(toBridgeError(error))
    });
  });
}

function createParams(request: TransportRequest): BridgeRequestParams {
  return {
    method: request.method,
    url: request.url,
    headers: request.headers,
    body: request.body
  };
}

function toBridgeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  return new TransportError(
    typeof error === "string" ? error : "Bridge request failed"
  );
}
