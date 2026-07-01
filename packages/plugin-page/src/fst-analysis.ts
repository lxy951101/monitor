import { safeJsonStringify } from "@monitor/core";
import type { FirstScreenResult } from "./first-screen";

export interface FstPerfAnalysis {
  slow: boolean;
  summary: {
    fst: number;
    threshold: number;
    score: number;
  };
  detail: string;
}

export function fstPerfAnalysis(result: FirstScreenResult, threshold = 3000): FstPerfAnalysis {
  return {
    slow: result.time > threshold,
    summary: {
      fst: result.time,
      threshold,
      score: result.score
    },
    detail: safeJsonStringify(result.detail)
  };
}

