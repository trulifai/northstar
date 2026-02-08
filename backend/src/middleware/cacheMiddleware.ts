/**
 * HTTP Response Cache Middleware
 * Caches GET responses in memory with configurable TTL
 */

import { Request, Response, NextFunction } from 'express';
import { cache, buildCacheKey } from '../lib/cache';
import config from '../config';

interface CacheOptions {
  ttlSeconds: number;
  prefix: string;
}

/**
 * Express middleware that caches GET responses
 */
export function cacheResponse(options: CacheOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!config.cache.enabled || req.method !== 'GET') {
      return next();
    }

    // Build cache key from route + query params
    const queryEntries: Record<string, string> = {};
    for (const [k, v] of Object.entries(req.query).sort()) {
      queryEntries[k] = String(v);
    }
    const queryString = new URLSearchParams(queryEntries).toString();
    const cacheKey = buildCacheKey(options.prefix, req.path, queryString);

    // Check cache
    const cached = cache.get<{ body: unknown; statusCode: number }>(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.status(cached.statusCode).json(cached.body);
      return;
    }

    // Intercept res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(cacheKey, { body, statusCode: res.statusCode }, options.ttlSeconds);
      }
      res.setHeader('X-Cache', 'MISS');
      return originalJson(body);
    };

    next();
  };
}
