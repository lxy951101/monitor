export type EventMap<Events> = { [Key in keyof Events]: unknown[] };
export type EventListener<Args extends unknown[] = unknown[]> = (...args: Args) => void;

export class EventBus<Events extends EventMap<Events> = Record<string, unknown[]>> {
  private readonly listeners = new Map<keyof Events, Set<EventListener>>();

  on<Key extends keyof Events>(event: Key, listener: EventListener<Events[Key]>): () => void {
    const listeners = this.listeners.get(event) ?? new Set<EventListener>();
    listeners.add(listener as EventListener);
    this.listeners.set(event, listeners);

    return () => this.off(event, listener);
  }

  off<Key extends keyof Events>(event: Key, listener?: EventListener<Events[Key]>): void {
    if (listener === undefined) {
      this.listeners.delete(event);
      return;
    }

    const listeners = this.listeners.get(event);
    listeners?.delete(listener as EventListener);

    if (listeners?.size === 0) {
      this.listeners.delete(event);
    }
  }

  emit<Key extends keyof Events>(event: Key, ...args: Events[Key]): void {
    const listeners = [...(this.listeners.get(event) ?? [])];

    for (const listener of listeners) {
      try {
        listener(...args);
      } catch {
        // 内部事件总线不让单个插件异常阻断后续监听器。
      }
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}
