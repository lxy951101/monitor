export type TransportMethod = "GET" | "POST";

export interface TransportRequest {
 method: TransportMethod;
 url: string;
 headers?: Record<string, string>;
 body?: BodyInit | null;
 timeout?: number;
}

export interface TransportResponse {
 ok: boolean;
 status: number;
 body?: unknown;
}

export interface Transport {
 send(request: TransportRequest): Promise<TransportResponse>;
}

export class TransportError extends Error {
 readonly status?: number;
 readonly response?: TransportResponse;

 constructor(message: string, options: { status?: number; response?: TransportResponse } = {}) {
  super(message);
  this.name = "TransportError";
  this.status = options.status;
  this.response = options.response;
 }
}
