/**
 * Votes Routes (Database-Cached)
 * Complete vote endpoints with caching and position data
 */

import { Router, Request, Response } from 'express';
import { dbService } from '../services/db.service';
import { asyncHandler, NotFoundError } from '../middleware/errorHandler';
import { cacheResponse } from '../middleware/cacheMiddleware';
import { CacheTTL, CachePrefix } from '../lib/cache';

const router = Router();

/**
 * GET /api/votes
 * Search and filter votes
 */
router.get(
  '/',
  cacheResponse({ ttlSeconds: CacheTTL.MEDIUM, prefix: CachePrefix.VOTES }),
  asyncHandler(async (req: Request, res: Response) => {
    const params = {
      congress: req.query.congress ? parseInt(req.query.congress as string, 10) : undefined,
      chamber: req.query.chamber as string | undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0,
      limit: Math.min(req.query.limit ? parseInt(req.query.limit as string, 10) : 20, 250),
    };

    const result = await dbService.getVotes(params);

    res.json({
      success: true,
      data: result.data,
      pagination: {
        offset: params.offset,
        limit: params.limit,
        total: result.total,
        hasMore: (params.offset || 0) + (params.limit || 20) < result.total,
      },
    });
  })
);

/**
 * GET /api/votes/:voteId
 * Get vote details with all member positions
 */
router.get(
  '/:voteId',
  cacheResponse({ ttlSeconds: CacheTTL.LONG, prefix: CachePrefix.VOTES }),
  asyncHandler(async (req: Request, res: Response) => {
    const voteId = req.params.voteId as string;

    const vote = await dbService.getVoteWithPositions(voteId);
    if (!vote) throw new NotFoundError('Vote');

    res.json({
      success: true,
      data: vote,
    });
  })
);

export default router;
