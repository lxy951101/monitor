export type PerfValue = string | number | boolean | Record<string, string | number | boolean>;

export type PerfEnv = Record<string, PerfValue>;

export type PerfLog = Record<string, PerfValue>;

export interface PerfLogPayload {
  category: string;
  env: PerfEnv;
  logs: PerfLog[];
}

export interface CreatePerfLogPayloadInput {
  category: string;
  env?: PerfEnv;
  logs: PerfLog[];
}

export interface CreatePerfCustomPayloadInput {
  category: string;
  env?: PerfEnv;
  metrics: PerfLog;
}

export function createPerfLogPayload(input: CreatePerfLogPayloadInput): PerfLogPayload {
  return {
    category: input.category,
    env: input.env ?? {},
    logs: input.logs
  };
}

export function createPerfCustomPayload(input: CreatePerfCustomPayloadInput): PerfLogPayload {
  return {
    category: input.category,
    env: input.env ?? {},
    logs: [input.metrics]
  };
}
