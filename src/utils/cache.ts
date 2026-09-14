/**
 * Memory-efficient LRU (Least Recently Used) & TTL Cache
 * Provides high-performance in-memory caching with automatic eviction and bounded size.
 */

export interface CacheOptions {
  maxSize?: number;
  ttlMs?: number; // Time-to-live in milliseconds
}

export class SimpleLRUCache<K, V> {
  private cache = new Map<K, { value: V; expiresAt: number }>();
  private readonly maxSize: number;
  private readonly ttlMs: number;

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize || 100;
    this.ttlMs = options.ttlMs || 5 * 60 * 1000; // 5 min default
  }

  get(key: K): V | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;

    // Check expiration
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    // Refresh LRU position (delete & re-insert)
    this.cache.delete(key);
    this.cache.set(key, item);
    return item.value;
  }

  set(key: K, value: V, customTtlMs?: number): void {
    // Evict oldest if full
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    const ttl = customTtlMs ?? this.ttlMs;
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl,
    });
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Singleton instances for common system domains
export const aiResponseCache = new SimpleLRUCache<string, string>({ maxSize: 50, ttlMs: 10 * 60 * 1000 });
export const noteSearchCache = new SimpleLRUCache<string, any[]>({ maxSize: 40, ttlMs: 3 * 60 * 1000 });
export const bookChapterCache = new SimpleLRUCache<string, any>({ maxSize: 60, ttlMs: 15 * 60 * 1000 });
export const quizQuestionsCache = new SimpleLRUCache<string, any>({ maxSize: 30, ttlMs: 10 * 60 * 1000 });
