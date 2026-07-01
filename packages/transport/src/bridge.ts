import { TransportError, type Transport, type TransportRequest } from "./types";

export interface BridgeCallbacks {
  success: (response?: unknown) => void;
  fail: (error?: unknown) => void;
}

export type BridgeMethod = (
  params: BridgeRequestParams,
  callbacks: BridgeCallbacks
) => void;

export type ContainerBridgeMethod = (
  event: Record<string, unknown>,
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

export interface ContainerBridgeReporterOptions {
  bridge?: BridgeLike;
  preferMSI?: boolean;
}

export interface ContainerBridgeReporter {
  reportFsp2(event: Record<string, unknown>): Promise<{ ok: true; status: 0; body?: unknown }>;
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

export function createContainerBridgeReporter(options: ContainerBridgeReporterOptions): ContainerBridgeReporter {
  return {
    reportFsp2(event) {
      const methodName = options.preferMSI ? "fspRecord" : "ffp.record";
      const fallbackName = options.preferMSI ? "ffp.record" : "fspRecord";
      const method = getBridgeMethod(options.bridge, methodName) ?? getBridgeMethod(options.bridge, fallbackName);
      if (!method) {
        return Promise.reject(new TransportError(`Container bridge method ${methodName} is not available`));
      }
      return sendEventWithBridge(method, event);
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

function sendEventWithBridge(method: ContainerBridgeMethod, event: Record<string, unknown>) {
  return new Promise<{ ok: true; status: 0; body?: unknown }>((resolve, reject) => {
    method(event, {
      success: (response) => resolve({ ok: true, status: 0, body: response }),
      fail: (error) => reject(toBridgeError(error))
    });
  });
}

function getBridgeMethod(bridge: BridgeLike | undefined, methodName: string): ContainerBridgeMethod | undefined {
  const method = bridge?.[methodName];
  return typeof method === "function" ? method as ContainerBridgeMethod : undefined;
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
