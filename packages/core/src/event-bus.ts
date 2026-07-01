export type EventKey = string | symbol;
export type EventMap = Record<EventKey, unknown[]>;
export type EventListener<Args extends unknown[]> = (...args: Args) => void;

export class EventBus<Events extends EventMap = Record<string, unknown[]>> {
  private readonly listeners = new Map<keyof Events, Set<EventListener<Events[keyof Events]>>>();

  on<Key extends keyof Events>(event: Key, listener: EventListener<Events[Key]>): () => void {
    const eventListeners = this.getListeners(event);
    eventListeners.add(listener as EventListener<Events[keyof Events]>);

    return () => this.off(event, listener);
  }

  off<Key extends keyof Events>(event: Key, listener?: EventListener<Events[Key]>): void {
    const eventListeners = this.listeners.get(event);

    if (!eventListeners) {
      return;
    }

    if (!listener) {
      this.listeners.delete(event);
      return;
    }

    eventListeners.delete(listener as EventListener<Events[keyof Events]>);

    if (eventListeners.size === 0) {
      this.listeners.delete(event);
    }
  }

  emit<Key extends keyof Events>(event: Key, ...args: Events[Key]): void {
    const eventListeners = this.listeners.get(event);

    if (!eventListeners) {
      return;
    }

    for (const listener of [...eventListeners]) {
      try {
        listener(...args);
      } catch {
        // listener 之间隔离，单个失败不能打断整条事件链路。
      }
    }
  }

  clear(): void {
    this.listeners.clear();
  }

  private getListeners<Key extends keyof Events>(
    event: Key
  ): Set<EventListener<Events[keyof Events]>> {
    let eventListeners = this.listeners.get(event);

    if (!eventListeners) {
      eventListeners = new Set<EventListener<Events[keyof Events]>>();
      this.listeners.set(event, eventListeners);
    }

    return eventListeners;
  }
}
