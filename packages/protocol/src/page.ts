export interface PageSpeedModel {
  project: string;
  pageUrl: string;
  realUrl: string;
  timestamp: number;
  redirectStart: number;
  redirectEnd: number;
  fetchStart: number;
  domainLookupStart: number;
  domainLookupEnd: number;
  unloadEventStart: number;
  connectStart: number;
  connectEnd: number;
  requestStart: number;
  responseStart: number;
  responseEnd: number;
  domComplete: number;
}

export interface CreatePageSpeedModelInput extends Partial<Omit<PageSpeedModel, "project" | "pageUrl" | "realUrl">> {
  project: string;
  pageUrl: string;
  realUrl: string;
}

export interface CustomSpeedModel {
  project: string;
  pageUrl: string;
  realUrl: string;
  timestamp: number;
  points: number[];
}

export interface CreateCustomSpeedModelInput {
  project: string;
  pageUrl: string;
  realUrl: string;
  timestamp?: number;
  points: number[];
}

export function createPageSpeedModel(input: CreatePageSpeedModelInput): PageSpeedModel {
  return {
    project: input.project,
    pageUrl: input.pageUrl,
    realUrl: input.realUrl,
    timestamp: input.timestamp ?? Date.now(),
    redirectStart: input.redirectStart ?? 0,
    redirectEnd: input.redirectEnd ?? 0,
    fetchStart: input.fetchStart ?? 0,
    domainLookupStart: input.domainLookupStart ?? 0,
    domainLookupEnd: input.domainLookupEnd ?? 0,
    unloadEventStart: input.unloadEventStart ?? 0,
    connectStart: input.connectStart ?? 0,
    connectEnd: input.connectEnd ?? 0,
    requestStart: input.requestStart ?? 0,
    responseStart: input.responseStart ?? 0,
    responseEnd: input.responseEnd ?? 0,
    domComplete: input.domComplete ?? 0
  };
}

export function encodePageSpeed(model: PageSpeedModel): string {
  return [
    model.project,
    model.pageUrl,
    model.realUrl,
    model.timestamp,
    model.redirectStart,
    model.unloadEventStart,
    model.redirectEnd,
    model.fetchStart,
    model.domainLookupStart,
    model.domainLookupEnd,
    model.connectStart,
    model.connectEnd,
    model.domComplete,
    model.requestStart,
    model.responseStart,
    model.responseEnd
  ].join("|");
}

export function createCustomSpeedModel(input: CreateCustomSpeedModelInput): CustomSpeedModel {
  return {
    project: input.project,
    pageUrl: input.pageUrl,
    realUrl: input.realUrl,
    timestamp: input.timestamp ?? Date.now(),
    points: input.points
  };
}

export function encodeCustomSpeed(model: CustomSpeedModel): string {
  return [model.project, model.pageUrl, model.realUrl, model.timestamp, ...model.points].join("|");
}
