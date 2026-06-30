import { describe, expect, it, vi } from "vitest";
import { Logger } from "./index";

describe("Logger", () => {
  it("devMode 控制 log 和 warn 输出", () => {
    const consoleLike = { log: vi.fn(), warn: vi.fn() };
    const logger = new Logger(false, consoleLike);

    logger.log("hidden");
    logger.warn("hidden");
    logger.setDevMode(true);
    logger.log("shown");
    logger.warn("shown");

    expect(consoleLike.log).toHaveBeenCalledTimes(1);
    expect(consoleLike.warn).toHaveBeenCalledTimes(1);
  });
});
