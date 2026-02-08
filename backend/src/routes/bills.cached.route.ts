/**
 * Bills Routes (Database-Cached)
 * Complete bill endpoints with caching and relationship data
 */

import { Router, Request, Response } from 'express';
import { dbService } from '../services/db.service';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/errorHandler';
import { cacheResponse } from '../middleware/cacheMiddleware';
import { CacheTTL, CachePrefix } from '../lib/cache';

const router = Router();

/**
 * GET /api/bills
 * Search and filter bills
 */
router.get(
  '/',
  cacheResponse({ ttlSeconds: CacheTTL.MEDIUM, prefix: CachePrefix.BILLS }),
  asyncHandler(async (req: Request, res: Response) => {
    const params = {
      congress: req.query.congress ? parseInt(req.query.congress as string, 10) : undefined,
      query: req.query.query as string | undefined,
      status: req.query.status as string | undefined,
      billType: req.query.billType as string | undefined,
      sponsorId: req.query.sponsorId as string | undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0,
      limit: Math.min(req.query.limit ? parseInt(req.query.limit as string, 10) : 20, 250),
    };

    const result = await dbService.getBills(params);

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
 * GET /api/bills/:billId
 * Get bill details with all relationships
 */
router.get(
  '/:billId',
  cacheResponse({ ttlSeconds: CacheTTL.MEDIUM, prefix: CachePrefix.BILLS }),
  asyncHandler(async (req: Request, res: Response) => {
    const billId = req.params.billId as string;

    if (!/^[a-z]+\d+-\d+$/.test(billId)) {
      throw new ValidationError('Invalid bill ID format. Expected: hr1234-118');
    }

    const bill = await dbService.getBillWithRelations(billId);
    if (!bill) throw new NotFoundError('Bill');

    res.json({
      success: true,
      data: bill,
    });
  })
);

/**
 * GET /api/bills/:billId/actions
 * Get legislative history for a bill
 */
router.get(
  '/:billId/actions',
  cacheResponse({ ttlSeconds: CacheTTL.LONG, prefix: CachePrefix.BILLS }),
  asyncHandler(async (req: Request, res: Response) => {
    const billId = req.params.billId as string;

    const actions = await dbService.getBillActions(billId);

    res.json({
      success: true,
      data: actions,
      total: actions.length,
    });
  })
);

/**
 * GET /api/bills/:billId/cosponsors
 * Get cosponsors for a bill
 */
router.get(
  '/:billId/cosponsors',
  cacheResponse({ ttlSeconds: CacheTTL.LONG, prefix: CachePrefix.BILLS }),
  asyncHandler(async (req: Request, res: Response) => {
    const billId = req.params.billId as string;

    const cosponsors = await dbService.getBillCosponsors(billId);

    res.json({
      success: true,
      data: cosponsors,
      total: cosponsors.length,
    });
  })
);

/**
 * GET /api/bills/:billId/amendments
 * Get amendments for a bill
 */
router.get(
  '/:billId/amendments',
  cacheResponse({ ttlSeconds: CacheTTL.LONG, prefix: CachePrefix.BILLS }),
  asyncHandler(async (req: Request, res: Response) => {
    const billId = req.params.billId as string;

    const amendments = await dbService.getBillAmendments(billId);

    res.json({
      success: true,
      data: amendments,
      total: amendments.length,
    });
  })
);

export default router;
