export interface ConsoleLike {
 log: (...args: unknown[]) => void;
 warn: (...args: unknown[]) => void;
}

export class Logger {
 private devMode: boolean;
 private readonly consoleLike?: ConsoleLike;

 constructor(devMode = false, consoleLike?: ConsoleLike) {
  this.devMode = devMode;
  this.consoleLike = consoleLike;
 }

 setDevMode(devMode: boolean): void {
  this.devMode = devMode;
 }

 log(...args: unknown[]): void {
  if (this.devMode) {
   this.getConsole()?.log(...args);
  }
 }

 warn(...args: unknown[]): void {
  if (this.devMode) {
   this.getConsole()?.warn(...args);
  }
 }

 private getConsole(): ConsoleLike | undefined {
  if (this.consoleLike) {
   return this.consoleLike;
  }

  if (typeof globalThis.console === "undefined") {
   return undefined;
  }

  return globalThis.console;
 }
}
