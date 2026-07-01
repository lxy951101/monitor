export const ERROR_FIELD_ORDER = [
  "project",
  "pageUrl",
  "realUrl",
  "resourceUrl",
  "category",
  "sec_category",
  "level",
  "unionId",
  "timestamp",
  "content",
  "traceid"
] as const;

export type ErrorFieldName = (typeof ERROR_FIELD_ORDER)[number];

export interface ErrorDynamicMetric {
  rowNum?: number;
  colNum?: number;
  tags?: Record<string, string>;
}

export interface CreateErrorModelInput {
  project: string;
  pageUrl: string;
  realUrl: string;
  resourceUrl?: string;
  category?: string;
  sec_category?: string;
  level?: string;
  unionId?: string;
  timestamp?: number;
  content: string;
  traceid?: string;
  rowNum?: number;
  colNum?: number;
  tags?: Record<string, string>;
}

export type ErrorModel = Record<ErrorFieldName, string | number> & {
  dynamicMetric?: ErrorDynamicMetric;
};

export function createErrorModel(input: CreateErrorModelInput): ErrorModel {
  const model: ErrorModel = {
    project: cleanText(input.project),
    pageUrl: cleanText(input.pageUrl),
    realUrl: cleanText(input.realUrl),
    resourceUrl: cleanText(input.resourceUrl),
    category: cleanText(input.category, "jsError"),
    sec_category: cleanText(input.sec_category, "default"),
    level: cleanText(input.level, "error"),
    unionId: cleanText(input.unionId),
    timestamp: input.timestamp ?? Date.now(),
    content: cleanText(input.content),
    traceid: cleanText(input.traceid)
  };
  const dynamicMetric = createDynamicMetric(input);
  if (dynamicMetric) {
    model.dynamicMetric = dynamicMetric;
  }
  return model;
}

export function encodeErrorBody(models: ErrorModel[]): string {
  return `c=${encodeURIComponent(JSON.stringify(models))}`;
}

function createDynamicMetric(input: CreateErrorModelInput): ErrorDynamicMetric | undefined {
  const dynamicMetric: ErrorDynamicMetric = {};
  if (input.rowNum !== undefined) {
    dynamicMetric.rowNum = input.rowNum;
  }
  if (input.colNum !== undefined) {
    dynamicMetric.colNum = input.colNum;
  }
  if (input.tags !== undefined) {
    dynamicMetric.tags = input.tags;
  }
  return Object.keys(dynamicMetric).length > 0 ? dynamicMetric : undefined;
}

function cleanText(value: string | undefined, fallback = ""): string {
  return value ?? fallback;
}

export interface ParsedErrorStack {
  resourceUrl: string;
  rowNum: number;
  colNum: number;
}

/**
 * 从 Error.stack 中解析出脚本 URL、行列号，对齐 owl.js _processError。
 */
export function parseErrorStack(stack: string): ParsedErrorStack | undefined {
  try {
    const infoExec = /https?:\/\/[^\n]+/.exec(stack);
    const info = infoExec ? infoExec[0] : "";
    const jsReg = /https?:\/\/(\S)+\.js/;
    const scriptMatch = jsReg.exec(info);
    const scriptUrl = scriptMatch ? scriptMatch[0] : "";

    const rowColExec = /:(\d+):(\d+)/.exec(info);
    const rowCols = rowColExec ? [rowColExec[1], rowColExec[2]] : [0, 0];

    if (!scriptUrl && Number(rowCols[0]) === 0 && Number(rowCols[1]) === 0) {
      return undefined;
    }

    return {
      resourceUrl: scriptUrl,
      rowNum: Number(rowCols[0]),
      colNum: Number(rowCols[1])
    };
  } catch {
    return undefined;
  }
}
