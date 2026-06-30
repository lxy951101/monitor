import { describe, expect, it, vi } from "vitest";
import { LocalStorageCache } from "./index";

class MemoryStorage {
  private readonly map = new Map<string, string>();

  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }
}

describe("LocalStorageCache", () => {
  it("支持 get、save、clear", () => {
    const cache = new LocalStorageCache<{ type: string }>({
      key: "reports",
      storage: new MemoryStorage()
    });

    expect(cache.get()).toEqual([]);
    cache.save([{ type: "a" }]);
    expect(cache.get()).toEqual([{ type: "a" }]);
    cache.clear();
    expect(cache.get()).toEqual([]);
  });

  it("storage 异常不会抛出到业务", () => {
    const onError = vi.fn();
    const storage = {
      getItem: vi.fn(() => {
        throw new Error("get failed");
      }),
      setItem: vi.fn(() => {
        throw new Error("set failed");
      }),
      removeItem: vi.fn(() => {
        throw new Error("remove failed");
      })
    };
    const cache = new LocalStorageCache({ key: "reports", storage, onError });

    expect(cache.get()).toEqual([]);
    expect(() => cache.save([{ type: "a" }])).not.toThrow();
    expect(() => cache.clear()).not.toThrow();
    expect(onError).toHaveBeenCalledTimes(3);
  });
});
