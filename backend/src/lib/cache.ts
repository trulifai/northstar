/**
 * Cache Layer - In-memory cache with optional Redis backend
 * Provides TTL-based caching with automatic cleanup
 */

// Cache TTL constants (seconds)
export const CacheTTL = {
  SHORT: 60,           // 1 minute
  MEDIUM: 300,         // 5 minutes
  LONG: 900,           // 15 minutes
  HOUR: 3600,          // 1 hour
  DAY: 86400,          // 24 hours
  WEEK: 604800,        // 7 days
} as const;

// Cache key prefixes for namespacing
export const CachePrefix = {
  BILLS: 'bills',
  MEMBERS: 'members',
  VOTES: 'votes',
  COMMITTEES: 'committees',
  AMENDMENTS: 'amendments',
  HEARINGS: 'hearings',
  STATS: 'stats',
  LOBBYING: 'lobbying',
  FINANCE: 'finance',
  DISTRICTS: 'districts',
  NEWS: 'news',
  GRAPH: 'graph',
} as const;

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * In-memory TTL cache with automatic cleanup
 */
export class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(cleanupIntervalMs: number = 60_000) {
    this.cleanupInterval = setInterval(() => this.cleanup(), cleanupIntervalMs);
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlSeconds: number): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Get or compute: returns cached value or executes fn and caches the result
   */
  async getOrSet<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) return cached;

    const value = await fn();
    this.set(key, value, ttlSeconds);
    return value;
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * Delete all keys matching a prefix
   */
  invalidatePrefix(prefix: string): number {
    let count = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

/**
 * Build cache keys consistently
 */
export function buildCacheKey(prefix: string, ...parts: (string | number | undefined)[]): string {
  const filtered = parts.filter((p) => p !== undefined && p !== '');
  return `${prefix}:${filtered.join(':')}`;
}

// Global singleton cache instance
export const cache = new MemoryCache();
