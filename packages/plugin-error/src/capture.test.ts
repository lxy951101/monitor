import { describe, expect, it, vi } from "vitest";
import { createErrorCapture, type ErrorCaptureTarget } from "./index";

describe("createErrorCapture", () => {
 it("接管 onerror 和 unhandledrejection，重复 start 不重复 patch，stop 后恢复", () => {
  const addError = vi.fn();
  const originalOnError = vi.fn();
  const target = {
   onerror: originalOnError,
   onunhandledrejection: null as ((event: PromiseRejectionEvent) => void) | null
  };
  const capture = createErrorCapture({
   target,
   addError
  });

  capture.start();
  const patchedOnError = target.onerror;
  capture.start();

  expect(target.onerror).toBe(patchedOnError);
  target.onerror?.("boom", "app.js", 2, 3, new Error("boom"));
  target.onunhandledrejection?.({ reason: "reject" } as PromiseRejectionEvent);

  expect(addError).toHaveBeenCalledTimes(2);
  expect(originalOnError).toHaveBeenCalledWith("boom", "app.js", 2, 3, expect.any(Error));

  capture.stop();
  expect(target.onerror).toBe(originalOnError);
  expect(target.onunhandledrejection).toBeNull();
 });

 it("可选采集 console.error 并在 stop 后恢复", () => {
  const addError = vi.fn();
  const originalError = vi.fn();
  const consoleLike = { error: originalError };
  const capture = createErrorCapture({
   target: { onerror: null, onunhandledrejection: null },
   console: consoleLike,
   captureConsoleError: true,
   addError
  });

  capture.start();
  consoleLike.error("console boom", { detail: 1 });
  capture.stop();
  consoleLike.error("after stop");

  expect(addError).toHaveBeenCalledTimes(1);
  expect(originalError).toHaveBeenCalledTimes(2);
 });

 it("多个实例 patch 同一目标时 stop 互不破坏", () => {
  const first = vi.fn();
  const second = vi.fn();
  const target: ErrorCaptureTarget = { onerror: null, onunhandledrejection: null };
  const captureA = createErrorCapture({ target, addError: first });
  const captureB = createErrorCapture({ target, addError: second });

  captureA.start();
  captureB.start();
  captureA.stop();
  target.onerror?.("boom");
  captureB.stop();
  target.onerror?.("after");

  expect(first).toHaveBeenCalledTimes(0);
  expect(second).toHaveBeenCalledTimes(1);
  expect(target.onerror).toBeNull();
 });
});
