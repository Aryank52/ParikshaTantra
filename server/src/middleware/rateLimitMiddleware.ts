import { Request, Response, NextFunction } from 'express';
import { RedisService } from '../services/redisService';

export interface RateLimitOptions {
  maxHits: number;
  windowSeconds: number;
  keyPrefix?: string;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  handler?: (req: Request, res: Response) => void;
}

const defaultKeyGenerator = (req: Request): string => {
  return req.ip || req.socket.remoteAddress || 'unknown';
};

export const createRateLimiter = (options: RateLimitOptions) => {
  const {
    maxHits,
    windowSeconds,
    keyPrefix = 'ratelimit',
    keyGenerator = defaultKeyGenerator,
    handler,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `${keyPrefix}:${keyGenerator(req)}`;
    const result = await RedisService.checkRateLimit(key, maxHits, windowSeconds);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxHits.toString());
    res.setHeader('X-RateLimit-Remaining', result.remainingHits.toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() / 1000 + result.resetSeconds).toString());

    if (!result.allowed) {
      res.setHeader('Retry-After', result.resetSeconds.toString());

      if (handler) {
        return handler(req, res);
      }

      return res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: `Rate limit exceeded. Try again in ${result.resetSeconds} seconds.`,
        retryAfter: result.resetSeconds,
      });
    }

    next();
  };
};

// Pre-configured rate limiters for common use cases
export const authRateLimiter = createRateLimiter({
  maxHits: 5,
  windowSeconds: 60,
  keyPrefix: 'auth:login',
});

export const apiWriteRateLimiter = createRateLimiter({
  maxHits: 60,
  windowSeconds: 60,
  keyPrefix: 'api:write',
});

export const apiReadRateLimiter = createRateLimiter({
  maxHits: 120,
  windowSeconds: 60,
  keyPrefix: 'api:read',
});

export const activationRateLimiter = createRateLimiter({
  maxHits: 10,
  windowSeconds: 300, // 5 minutes
  keyPrefix: 'activation',
});

export const registrationRateLimiter = createRateLimiter({
  maxHits: 3,
  windowSeconds: 300, // 5 minutes
  keyPrefix: 'registration',
});