export interface ConsoleLike {
  log: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error?: (...args: unknown[]) => void;
  info?: (...args: unknown[]) => void;
  debug?: (...args: unknown[]) => void;
}

export class Logger {
  private devMode: boolean;
  private readonly output?: ConsoleLike;

  constructor(devMode = false, output?: ConsoleLike) {
    this.devMode = devMode;
    this.output = output ?? getConsoleLike();
  }

  setDevMode(devMode: boolean): void {
    this.devMode = devMode;
  }

  isDevMode(): boolean {
    return this.devMode;
  }

  log(...args: unknown[]): void {
    if (this.devMode) {
      this.output?.log(...args);
    }
  }

  info(...args: unknown[]): void {
    if (this.devMode) {
      this.output?.info?.(...args);
    }
  }

  warn(...args: unknown[]): void {
    if (this.devMode) {
      this.output?.warn(...args);
    }
  }

  error(...args: unknown[]): void {
    this.output?.error?.(...args);
  }
}

function getConsoleLike(): ConsoleLike | undefined {
  const maybeConsole = globalThis.console;
  return maybeConsole
    ? {
        log: maybeConsole.log.bind(maybeConsole),
        warn: maybeConsole.warn.bind(maybeConsole),
        error: maybeConsole.error.bind(maybeConsole),
        info: maybeConsole.info.bind(maybeConsole),
        debug: maybeConsole.debug.bind(maybeConsole)
      }
    : undefined;
}
