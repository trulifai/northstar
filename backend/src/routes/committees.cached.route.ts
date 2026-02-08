/**
 * Committees Routes (Database-Cached)
 * Complete committee endpoints with caching and membership data
 */

import { Router, Request, Response } from 'express';
import { dbService } from '../services/db.service';
import { asyncHandler, NotFoundError } from '../middleware/errorHandler';
import { cacheResponse } from '../middleware/cacheMiddleware';
import { CacheTTL, CachePrefix } from '../lib/cache';

const router = Router();

/**
 * GET /api/committees
 * List committees with optional chamber filter
 */
router.get(
  '/',
  cacheResponse({ ttlSeconds: CacheTTL.LONG, prefix: CachePrefix.COMMITTEES }),
  asyncHandler(async (req: Request, res: Response) => {
    const params = {
      chamber: req.query.chamber as string | undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0,
      limit: Math.min(req.query.limit ? parseInt(req.query.limit as string, 10) : 50, 250),
    };

    const result = await dbService.getCommittees(params);

    res.json({
      success: true,
      data: result.data,
      pagination: {
        offset: params.offset,
        limit: params.limit,
        total: result.total,
        hasMore: (params.offset || 0) + (params.limit || 50) < result.total,
      },
    });
  })
);

/**
 * GET /api/committees/:committeeCode
 * Get committee details with members, subcommittees, and hearings
 */
router.get(
  '/:committeeCode',
  cacheResponse({ ttlSeconds: CacheTTL.LONG, prefix: CachePrefix.COMMITTEES }),
  asyncHandler(async (req: Request, res: Response) => {
    const committeeCode = req.params.committeeCode as string;

    const committee = await dbService.getCommitteeById(committeeCode);
    if (!committee) throw new NotFoundError('Committee');

    res.json({
      success: true,
      data: committee,
    });
  })
);

export default router;
