export type MetricMap = Record<string, string | number | boolean>;

export interface MetricItemInput {
  name: string;
  value: number;
  tags?: MetricMap;
  extra?: MetricMap;
  timestamp?: number;
}

export interface MetricPayloadInput {
  tvs?: MetricMap;
  metrics: MetricItemInput[];
}

export interface MetricData {
  name: string;
  value: number;
  tags: MetricMap;
  extra?: MetricMap;
  timestamp: number;
}

export interface MetricPayload {
  tvs: MetricMap;
  datas: MetricData[];
}

export function createMetricPayload(input: MetricPayloadInput): MetricPayload {
  return {
    tvs: input.tvs ?? {},
    datas: input.metrics.map(createMetricData)
  };
}

function createMetricData(input: MetricItemInput): MetricData {
  const data: MetricData = {
    name: input.name,
    value: input.value,
    tags: input.tags ?? {},
    timestamp: input.timestamp ?? Date.now()
  };
  if (input.extra !== undefined) {
    data.extra = input.extra;
  }
  return data;
}
