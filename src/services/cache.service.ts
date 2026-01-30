import { CacheEntry, CacheStore } from '@/types';

/**
 * Simple in-memory cache service
 * Stores API responses with TTL (Time To Live)
 */

class CacheService {
  private cache: CacheStore;
  private defaultTTL: number;

  constructor(defaultTTL = 5 * 60 * 1000) {
    // Default 5 minutes
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  /**
   * Generate cache key from parameters
   */
  private generateKey(prefix: string, ...params: (string | number)[]): string {
    return `${prefix}:${params.join(':')}`;
  }

  /**
   * Set cache entry
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const expiresIn = ttl || this.defaultTTL;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresIn,
    };

    this.cache.set(key, entry as CacheEntry<unknown>);
  }

  /**
   * Get cache entry
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.expiresIn) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete cache entry
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.expiresIn) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Helper: Generate player cache key
   */
  playerKey(steamId: string): string {
    return this.generateKey('player', steamId);
  }

  /**
   * Helper: Generate games cache key
   */
  gamesKey(steamId: string): string {
    return this.generateKey('games', steamId);
  }

  /**
   * Helper: Generate achievements cache key
   */
  achievementsKey(steamId: string, appId: number): string {
    return this.generateKey('achievements', steamId, appId);
  }

  /**
   * Helper: Generate game details cache key
   */
  gameDetailsKey(appId: number): string {
    return this.generateKey('gameDetails', appId);
  }
}

// Export singleton instance
export const cacheService = new CacheService();

// Auto-clear expired entries every 10 minutes
setInterval(() => {
  cacheService.clearExpired();
}, 10 * 60 * 1000);
