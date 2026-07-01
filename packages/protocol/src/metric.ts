export type MetricMap = Record<string, string | number | boolean>;

export interface MetricItemInput {
  name: string;
  value: number;
  tags?: MetricMap;
  timestamp?: number;
}

export interface MetricPayloadInput {
  tvs?: MetricMap;
  metrics: MetricItemInput[];
  /** 全局 extra，对齐 owl.js setExtraData → report 时注入每条 metric */
  extra?: MetricMap;
}

/** 对齐 owl.js report() 输出的单条 metric 结构 */
export interface MetricData {
  key: string;
  vs: number[];
  tvs: MetricMap;
  extra?: MetricMap;
  /** 秒级时间戳 (对齐 owl.js ts: parseInt(+new Date() / 1000)) */
  ts: number;
}

export interface MetricPayload {
  tvs: MetricMap;
  datas: MetricData[];
}

export function createMetricPayload(input: MetricPayloadInput): MetricPayload {
  return {
    tvs: input.tvs ?? {},
    datas: input.metrics.map((m) => createMetricData(m, input.extra))
  };
}

function createMetricData(input: MetricItemInput, globalExtra?: MetricMap): MetricData {
  const data: MetricData = {
    key: input.name,
    vs: [input.value],
    tvs: input.tags ?? {},
    ts: Math.floor((input.timestamp ?? Date.now()) / 1000)
  };
  if (globalExtra !== undefined) {
    data.extra = globalExtra;
  }
  return data;
}
