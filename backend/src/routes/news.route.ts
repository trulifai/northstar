/**
 * News Routes
 * RSS-aggregated political news with bill/member linking
 */

import { Router, Request, Response } from 'express';
import { newsAggregatorService } from '../services/news-aggregator.service';
import { asyncHandler } from '../middleware/errorHandler';
import { cacheResponse } from '../middleware/cacheMiddleware';
import { CacheTTL, CachePrefix } from '../lib/cache';

const router = Router();

/**
 * GET /api/news/recent
 * Get recent news articles
 */
router.get(
  '/recent',
  cacheResponse({ ttlSeconds: CacheTTL.SHORT, prefix: CachePrefix.NEWS }),
  asyncHandler(async (req: Request, res: Response) => {
    const params = {
      source: req.query.source as string | undefined,
      query: req.query.query as string | undefined,
      limit: Math.min(parseInt(req.query.limit as string) || 20, 100),
      offset: parseInt(req.query.offset as string) || 0,
    };

    const result = await newsAggregatorService.getRecentArticles(params);

    res.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        offset: params.offset,
        limit: params.limit,
        hasMore: params.offset + params.limit < result.total,
      },
    });
  })
);

/**
 * GET /api/news/by-bill/:billId
 * Get news articles related to a bill
 */
router.get(
  '/by-bill/:billId',
  cacheResponse({ ttlSeconds: CacheTTL.MEDIUM, prefix: CachePrefix.NEWS }),
  asyncHandler(async (req: Request, res: Response) => {
    const billId = req.params.billId as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    const result = await newsAggregatorService.getArticlesByBill(billId, limit);

    res.json({
      success: true,
      data: result.data,
      total: result.total,
    });
  })
);

/**
 * POST /api/news/sync
 * Trigger RSS feed sync
 */
router.post(
  '/sync',
  asyncHandler(async (req: Request, res: Response) => {
    const maxPerFeed = Math.min(parseInt(req.query.max as string) || 20, 50);

    const result = await newsAggregatorService.syncAllFeeds(maxPerFeed);

    res.json({ success: true, data: result });
  })
);

export default router;
