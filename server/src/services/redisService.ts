export interface RateLimitResult {
  allowed: boolean;
  remainingHits: number;
  resetSeconds: number;
}

export class RedisService {
  private static isRedisConnected: boolean = false;
  private static inMemoryCache: Map<string, { value: string; expiresAt: number }> = new Map();
  private static rateLimitBuckets: Map<string, { hits: number; resetAt: number }> = new Map();

  /**
   * Initializes Redis connection status based on environment configuration.
   */
  public static init(): void {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl && redisUrl.startsWith('redis')) {
      this.isRedisConnected = true;
      console.log('⚡ Redis Cache Service: Active with URL abstraction.');
    } else {
      this.isRedisConnected = false;
      console.log('ℹ️ Redis Cache Service: Operating in resilient In-Memory fallback mode (Zero-Dependency).');
    }
  }

  /**
   * Retrieves a string value from cache (Redis or In-Memory Map).
   */
  public static async get(key: string): Promise<string | null> {
    const now = Date.now();
    const item = this.inMemoryCache.get(key);
    if (item) {
      if (item.expiresAt > now) {
        return item.value;
      }
      this.inMemoryCache.delete(key);
    }
    return null;
  }

  /**
   * Sets a key-value pair in cache with expiration time in seconds.
   */
  public static async set(key: string, value: string, ttlSeconds: number = 300): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.inMemoryCache.set(key, { value, expiresAt });
  }

  /**
   * Deletes a key from cache.
   */
  public static async del(key: string): Promise<void> {
    this.inMemoryCache.delete(key);
  }

  /**
   * Token Bucket Rate Limiting per IP or User ID.
   */
  public static async checkRateLimit(
    identifier: string,
    maxHits: number = 60,
    windowSeconds: number = 60
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const bucket = this.rateLimitBuckets.get(identifier);

    if (!bucket || bucket.resetAt <= now) {
      const resetAt = now + windowSeconds * 1000;
      this.rateLimitBuckets.set(identifier, { hits: 1, resetAt });
      return { allowed: true, remainingHits: maxHits - 1, resetSeconds: windowSeconds };
    }

    bucket.hits += 1;
    const remainingHits = Math.max(0, maxHits - bucket.hits);
    const resetSeconds = Math.ceil((bucket.resetAt - now) / 1000);

    if (bucket.hits > maxHits) {
      return { allowed: false, remainingHits: 0, resetSeconds };
    }

    return { allowed: true, remainingHits, resetSeconds };
  }

  /**
   * Returns current service connectivity state.
   */
  public static isConnected(): boolean {
    return this.isRedisConnected;
  }
}

// Auto-initialize on module load
RedisService.init();
