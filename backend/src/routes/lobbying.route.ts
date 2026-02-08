/**
 * Lobbying Intelligence Routes
 * Endpoints for LDA lobbying disclosure data
 */

import { Router, Request, Response } from 'express';
import { ldaSyncService } from '../services/lda-sync.service';
import { asyncHandler } from '../middleware/errorHandler';
import { cacheResponse } from '../middleware/cacheMiddleware';
import { CacheTTL, CachePrefix } from '../lib/cache';

const router = Router();

/**
 * GET /api/lobbying/reports
 * Search lobbying reports
 */
router.get(
  '/reports',
  cacheResponse({ ttlSeconds: CacheTTL.LONG, prefix: CachePrefix.LOBBYING }),
  asyncHandler(async (req: Request, res: Response) => {
    const params = {
      query: req.query.query as string | undefined,
      registrant: req.query.registrant as string | undefined,
      client: req.query.client as string | undefined,
      filingYear: req.query.year ? parseInt(req.query.year as string, 10) : undefined,
      limit: Math.min(parseInt(req.query.limit as string) || 20, 250),
      offset: parseInt(req.query.offset as string) || 0,
    };

    const result = await ldaSyncService.searchReports(params);

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
 * GET /api/lobbying/by-bill/:billId
 * Get lobbying reports related to a specific bill
 */
router.get(
  '/by-bill/:billId',
  cacheResponse({ ttlSeconds: CacheTTL.LONG, prefix: CachePrefix.LOBBYING }),
  asyncHandler(async (req: Request, res: Response) => {
    const billId = req.params.billId as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 250);
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await ldaSyncService.getReportsByBill(billId, { limit, offset });

    res.json({
      success: true,
      data: result.data,
      pagination: { total: result.total, offset, limit },
    });
  })
);

/**
 * GET /api/lobbying/top-registrants
 * Get top lobbying firms by revenue
 */
router.get(
  '/top-registrants',
  cacheResponse({ ttlSeconds: CacheTTL.HOUR, prefix: CachePrefix.LOBBYING }),
  asyncHandler(async (req: Request, res: Response) => {
    const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const registrants = await ldaSyncService.getTopRegistrants({ filingYear: year, limit });

    res.json({
      success: true,
      data: registrants,
    });
  })
);

/**
 * GET /api/lobbying/top-clients
 * Get top lobbying spenders (clients)
 */
router.get(
  '/top-clients',
  cacheResponse({ ttlSeconds: CacheTTL.HOUR, prefix: CachePrefix.LOBBYING }),
  asyncHandler(async (req: Request, res: Response) => {
    const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const clients = await ldaSyncService.getTopClients({ filingYear: year, limit });

    res.json({
      success: true,
      data: clients,
    });
  })
);

/**
 * POST /api/lobbying/sync
 * Trigger LDA data sync
 */
router.post(
  '/sync',
  asyncHandler(async (req: Request, res: Response) => {
    const year = parseInt(req.query.year as string) || 2024;
    const maxRecords = Math.min(parseInt(req.query.max as string) || 500, 5000);

    const result = await ldaSyncService.syncReports({ filingYear: year, maxRecords });

    res.json({
      success: true,
      data: result,
    });
  })
);

export default router;
