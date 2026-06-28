// Typed key/value store backed by localStorage. The single persistence kernel
// every feature's infrastructure layer goes through. SSR-safe: degrades to an
// in-memory map when `localStorage` is undefined (e.g. during SSR/Node tests).

const NAMESPACE = 'zl-universe-fe::';

export interface KvStore {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
  has(key: string): boolean;
}

class LocalStorageKvStore implements KvStore {
  private readonly fallback = new Map<string, string>();

  private readonly hasLocalStorage =
    typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

  private readKey(key: string): string | null {
    const k = NAMESPACE + key;
    if (this.hasLocalStorage) {
      return window.localStorage.getItem(k);
    }
    return this.fallback.get(k) ?? null;
  }

  private writeKey(key: string, raw: string): void {
    const k = NAMESPACE + key;
    if (this.hasLocalStorage) {
      window.localStorage.setItem(k, raw);
    } else {
      this.fallback.set(k, raw);
    }
  }

  private deleteKey(key: string): void {
    const k = NAMESPACE + key;
    if (this.hasLocalStorage) {
      window.localStorage.removeItem(k);
    } else {
      this.fallback.delete(k);
    }
  }

  get<T>(key: string): T | null {
    const raw = this.readKey(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    this.writeKey(key, JSON.stringify(value));
  }

  remove(key: string): void {
    this.deleteKey(key);
  }

  has(key: string): boolean {
    return this.readKey(key) !== null;
  }

  clear(): void {
    if (this.hasLocalStorage) {
      const keys = Object.keys(window.localStorage).filter((k) => k.startsWith(NAMESPACE));
      keys.forEach((k) => window.localStorage.removeItem(k));
    } else {
      this.fallback.clear();
    }
  }
}

export function createKvStore(): KvStore {
  return new LocalStorageKvStore();
}
