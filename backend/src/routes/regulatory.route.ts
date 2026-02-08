/**
 * Regulatory & Executive Action Routes
 * Endpoints for Federal Register data
 */

import { Router, Request, Response } from 'express';
import { federalRegisterService } from '../services/federal-register.service';
import { asyncHandler } from '../middleware/errorHandler';
import { cacheResponse } from '../middleware/cacheMiddleware';
import { CacheTTL } from '../lib/cache';

const router = Router();

/**
 * GET /api/regulatory/executive-orders
 * Search executive orders
 */
router.get(
  '/executive-orders',
  cacheResponse({ ttlSeconds: CacheTTL.LONG, prefix: 'regulatory' }),
  asyncHandler(async (req: Request, res: Response) => {
    const params = {
      president: req.query.president as string | undefined,
      status: req.query.status as string | undefined,
      query: req.query.query as string | undefined,
      limit: Math.min(parseInt(req.query.limit as string) || 20, 250),
      offset: parseInt(req.query.offset as string) || 0,
    };

    const result = await federalRegisterService.getExecutiveOrders(params);

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
 * GET /api/regulatory/rules
 * Search regulatory rules (proposed and final)
 */
router.get(
  '/rules',
  cacheResponse({ ttlSeconds: CacheTTL.LONG, prefix: 'regulatory' }),
  asyncHandler(async (req: Request, res: Response) => {
    const params = {
      ruleType: req.query.type as string | undefined,
      agency: req.query.agency as string | undefined,
      query: req.query.query as string | undefined,
      openForComment: req.query.openForComment === 'true',
      limit: Math.min(parseInt(req.query.limit as string) || 20, 250),
      offset: parseInt(req.query.offset as string) || 0,
    };

    const result = await federalRegisterService.getRules(params);

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
 * POST /api/regulatory/sync/executive-orders
 * Trigger executive order sync from Federal Register
 */
router.post(
  '/sync/executive-orders',
  asyncHandler(async (req: Request, res: Response) => {
    const year = parseInt(req.query.year as string) || undefined;
    const max = Math.min(parseInt(req.query.max as string) || 100, 500);

    const result = await federalRegisterService.syncExecutiveOrders({ year, maxRecords: max });

    res.json({ success: true, data: result });
  })
);

/**
 * POST /api/regulatory/sync/rules
 * Trigger regulatory rule sync from Federal Register
 */
router.post(
  '/sync/rules',
  asyncHandler(async (req: Request, res: Response) => {
    const ruleType = req.query.type as 'proposed_rule' | 'final_rule' | 'notice' | undefined;
    const agency = req.query.agency as string | undefined;
    const year = parseInt(req.query.year as string) || undefined;
    const max = Math.min(parseInt(req.query.max as string) || 100, 500);

    const result = await federalRegisterService.syncRules({ ruleType, agency, year, maxRecords: max });

    res.json({ success: true, data: result });
  })
);

export default router;
