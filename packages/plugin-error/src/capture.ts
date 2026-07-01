type ErrorHandler = (
  event: Event | string,
  source?: string,
  lineno?: number,
  colno?: number,
  error?: unknown
) => unknown;

type RejectionHandler = (event: PromiseRejectionEvent) => unknown;
type ConsoleError = (...args: unknown[]) => void;

export interface ErrorCaptureTarget {
  onerror: ErrorHandler | null;
  onunhandledrejection: RejectionHandler | null;
}

export interface ConsoleLike {
  error: ConsoleError;
}

export interface ErrorCaptureOptions {
  addError: (error: unknown, options?: Record<string, unknown>) => void;
  /** 对齐 owl.js parseWindowError — 携带完整 onerror 参数 */
  onWindowError?: (
    msg: string | Event,
    source?: string,
    lineno?: number,
    colno?: number,
    error?: unknown
  ) => void;
  /** 对齐 owl.js parsePromiseUnhandled — 接收完整 PromiseRejectionEvent */
  onUnhandledRejection?: (event: PromiseRejectionEvent) => void;
  /** 对齐 owl.js parseConsoleError — 接收 console.error 全部参数 */
  onConsoleError?: (...args: unknown[]) => void;
  target?: ErrorCaptureTarget;
  console?: ConsoleLike;
  captureConsoleError?: boolean;
}

export interface ErrorCapture {
  start: () => void;
  stop: () => void;
}

interface CaptureSubscription {
  addError: ErrorCaptureOptions["addError"];
  onWindowError?: ErrorCaptureOptions["onWindowError"];
  onUnhandledRejection?: ErrorCaptureOptions["onUnhandledRejection"];
  onConsoleError?: ErrorCaptureOptions["onConsoleError"];
  captureConsoleError: boolean;
}

interface TargetPatchState {
  originalOnError: ErrorHandler | null;
  originalOnRejection: RejectionHandler | null;
  subscriptions: Set<CaptureSubscription>;
}

interface ConsolePatchState {
  originalError: ConsoleError;
  subscriptions: Set<CaptureSubscription>;
}

const targetStates = new WeakMap<ErrorCaptureTarget, TargetPatchState>();
const consoleStates = new WeakMap<ConsoleLike, ConsolePatchState>();

export function createErrorCapture(options: ErrorCaptureOptions): ErrorCapture {
  const target = options.target ?? getRuntimeTarget();
  const consoleLike = options.console ?? getRuntimeConsole();
  const subscription: CaptureSubscription = {
    addError: options.addError,
    onWindowError: options.onWindowError,
    onUnhandledRejection: options.onUnhandledRejection,
    onConsoleError: options.onConsoleError,
    captureConsoleError: options.captureConsoleError === true
  };
  let started = false;

  return {
    start() {
      if (started) {
        return;
      }

      started = true;
      addTargetSubscription(target, subscription);
      addConsoleSubscription(consoleLike, subscription);
    },
    stop() {
      if (!started) {
        return;
      }

      started = false;
      removeTargetSubscription(target, subscription);
      removeConsoleSubscription(consoleLike, subscription);
    }
  };
}

function addTargetSubscription(
  target: ErrorCaptureTarget | undefined,
  subscription: CaptureSubscription
): void {
  if (!target) {
    return;
  }

  const state = targetStates.get(target) ?? patchTarget(target);
  state.subscriptions.add(subscription);
}

function removeTargetSubscription(
  target: ErrorCaptureTarget | undefined,
  subscription: CaptureSubscription
): void {
  const state = target ? targetStates.get(target) : undefined;
  if (!target || !state) {
    return;
  }

  state.subscriptions.delete(subscription);
  if (state.subscriptions.size === 0) {
    target.onerror = state.originalOnError;
    target.onunhandledrejection = state.originalOnRejection;
    targetStates.delete(target);
  }
}

function patchTarget(target: ErrorCaptureTarget): TargetPatchState {
  const state: TargetPatchState = {
    originalOnError: target.onerror,
    originalOnRejection: target.onunhandledrejection,
    subscriptions: new Set()
  };

  target.onerror = (event, source, lineno, colno, error) => {
    for (const subscription of [...state.subscriptions]) {
      if (subscription.onWindowError) {
        subscription.onWindowError(event, source, lineno, colno, error);
      } else {
        subscription.addError(error ?? event, {
          source,
          rowNum: lineno,
          colNum: colno
        });
      }
    }
    return state.originalOnError?.(event, source, lineno, colno, error);
  };
  target.onunhandledrejection = (event) => {
    for (const subscription of [...state.subscriptions]) {
      if (subscription.onUnhandledRejection) {
        subscription.onUnhandledRejection(event);
      } else {
        subscription.addError(event.reason, {
          category: "unhandledrejection"
        });
      }
    }
    return state.originalOnRejection?.(event);
  };

  targetStates.set(target, state);
  return state;
}

function addConsoleSubscription(
  consoleLike: ConsoleLike | undefined,
  subscription: CaptureSubscription
): void {
  if (!consoleLike || !subscription.captureConsoleError) {
    return;
  }

  const state = consoleStates.get(consoleLike) ?? patchConsole(consoleLike);
  state.subscriptions.add(subscription);
}

function removeConsoleSubscription(
  consoleLike: ConsoleLike | undefined,
  subscription: CaptureSubscription
): void {
  const state = consoleLike ? consoleStates.get(consoleLike) : undefined;
  if (!consoleLike || !state) {
    return;
  }

  state.subscriptions.delete(subscription);
  if (state.subscriptions.size === 0) {
    consoleLike.error = state.originalError;
    consoleStates.delete(consoleLike);
  }
}

function patchConsole(consoleLike: ConsoleLike): ConsolePatchState {
  const state: ConsolePatchState = {
    originalError: consoleLike.error,
    subscriptions: new Set()
  };

  consoleLike.error = (...args: unknown[]) => {
    for (const subscription of [...state.subscriptions]) {
      if (subscription.onConsoleError) {
        subscription.onConsoleError(...args);
      } else {
        subscription.addError(
          args.length === 1 ? args[0] : args,
          { category: "consoleError" }
        );
      }
    }
    state.originalError(...args);
  };
  consoleStates.set(consoleLike, state);
  return state;
}

function getRuntimeTarget(): ErrorCaptureTarget | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window as unknown as ErrorCaptureTarget;
}

function getRuntimeConsole(): ConsoleLike | undefined {
  if (typeof globalThis.console === "undefined") {
    return undefined;
  }

  return globalThis.console;
}
