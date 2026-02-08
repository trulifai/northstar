/**
 * Campaign Finance Routes
 * Endpoints for FEC campaign contribution data
 */

import { Router, Request, Response } from 'express';
import { fecSyncService } from '../services/fec-sync.service';
import { asyncHandler } from '../middleware/errorHandler';
import { cacheResponse } from '../middleware/cacheMiddleware';
import { CacheTTL, CachePrefix } from '../lib/cache';

const router = Router();

/**
 * GET /api/finance/members/:bioguideId/contributions
 * Get campaign contributions for a specific member
 */
router.get(
  '/members/:bioguideId/contributions',
  cacheResponse({ ttlSeconds: CacheTTL.LONG, prefix: CachePrefix.FINANCE }),
  asyncHandler(async (req: Request, res: Response) => {
    const bioguideId = req.params.bioguideId as string;
    const cycle = req.query.cycle ? parseInt(req.query.cycle as string, 10) : undefined;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 250);
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await fecSyncService.getMemberContributions(bioguideId, { cycle, limit, offset });

    res.json({
      success: true,
      data: result.data,
      pagination: { total: result.total, offset, limit, hasMore: offset + limit < result.total },
    });
  })
);

/**
 * GET /api/finance/members/:bioguideId/industries
 * Get contribution breakdown by industry for a member
 */
router.get(
  '/members/:bioguideId/industries',
  cacheResponse({ ttlSeconds: CacheTTL.LONG, prefix: CachePrefix.FINANCE }),
  asyncHandler(async (req: Request, res: Response) => {
    const bioguideId = req.params.bioguideId as string;
    const cycle = req.query.cycle ? parseInt(req.query.cycle as string, 10) : undefined;

    const industries = await fecSyncService.getMemberIndustrySummary(bioguideId, cycle);

    res.json({
      success: true,
      data: industries,
    });
  })
);

/**
 * GET /api/finance/top-donors
 * Get top donors across all members
 */
router.get(
  '/top-donors',
  cacheResponse({ ttlSeconds: CacheTTL.HOUR, prefix: CachePrefix.FINANCE }),
  asyncHandler(async (req: Request, res: Response) => {
    const cycle = req.query.cycle ? parseInt(req.query.cycle as string, 10) : undefined;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const donors = await fecSyncService.getTopDonors({ cycle, limit });

    res.json({
      success: true,
      data: donors,
    });
  })
);

/**
 * POST /api/finance/sync
 * Trigger FEC data sync
 */
router.post(
  '/sync',
  asyncHandler(async (req: Request, res: Response) => {
    const cycle = parseInt(req.query.cycle as string) || 2024;
    const maxRecords = Math.min(parseInt(req.query.max as string) || 10000, 50000);

    const result = await fecSyncService.syncContributions(cycle, maxRecords);

    res.json({
      success: true,
      data: result,
    });
  })
);

export default router;
