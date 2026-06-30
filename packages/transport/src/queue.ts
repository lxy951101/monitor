export interface ReportQueueOptions<T> {
  maxLength: number;
  delay: number;
  send: (reports: T[]) => Promise<void>;
  onFail?: (error: unknown, reports: T[]) => void;
}

export class ReportQueue<T = unknown> {
  private readonly reports: T[] = [];
  private readonly maxLength: number;
  private readonly delay: number;
  private readonly send: (reports: T[]) => Promise<void>;
  private readonly onFail?: (error: unknown, reports: T[]) => void;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private pendingFlush: Promise<void> | undefined;
  private needsFlush = false;

  constructor(options: ReportQueueOptions<T>) {
    this.maxLength = Math.max(1, options.maxLength);
    this.delay = Math.max(0, options.delay);
    this.send = options.send;
    this.onFail = options.onFail;
  }

  add(report: T): void {
    this.reports.push(report);

    if (this.reports.length >= this.maxLength) {
      this.triggerFlush();
      return;
    }

    this.scheduleFlush();
  }

  size(): number {
    return this.reports.length;
  }

  async flush(): Promise<void> {
    if (this.pendingFlush) {
      this.needsFlush = true;
      return this.pendingFlush;
    }

    this.clearTimer();
    if (this.reports.length === 0) {
      return undefined;
    }

    const batch = this.reports.splice(0, this.reports.length);
    this.pendingFlush = this.sendBatch(batch);

    try {
      await this.pendingFlush;
      this.pendingFlush = undefined;
      if (this.reports.length > 0) {
        await this.flushPendingReports();
      }
    } catch (error) {
      this.pendingFlush = undefined;
      throw error;
    }
  }

  private async sendBatch(batch: T[]): Promise<void> {
    try {
      await this.send(batch);
    } catch (error) {
      this.reports.unshift(...batch);
      this.onFail?.(error, batch);
      throw error;
    }
  }

  private scheduleFlush(): void {
    if (this.delay === 0 || this.timer) {
      return;
    }

    this.timer = setTimeout(() => {
      this.timer = undefined;
      this.triggerFlush();
    }, this.delay);
  }

  private triggerFlush(): void {
    void this.flush().catch(() => {
      // sendBatch 已回滚数据并触发 onFail；自动触发路径只负责避免悬空 rejection。
    });
  }

  private async flushPendingReports(): Promise<void> {
    if (this.needsFlush || this.reports.length >= this.maxLength) {
      this.needsFlush = false;
      await this.flush();
      return;
    }

    this.scheduleFlush();
  }

  private clearTimer(): void {
    if (!this.timer) {
      return;
    }

    clearTimeout(this.timer);
    this.timer = undefined;
  }
}
