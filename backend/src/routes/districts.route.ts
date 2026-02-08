/**
 * District Routes
 * Congressional district demographics, spending, and impact analysis
 */

import { Router, Request, Response } from 'express';
import { districtService } from '../services/district.service';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/errorHandler';
import { cacheResponse } from '../middleware/cacheMiddleware';
import { CacheTTL, CachePrefix } from '../lib/cache';

const router = Router();

/**
 * GET /api/districts/:state
 * List all districts for a state
 */
router.get(
  '/:state',
  cacheResponse({ ttlSeconds: CacheTTL.HOUR, prefix: CachePrefix.DISTRICTS }),
  asyncHandler(async (req: Request, res: Response) => {
    const state = (req.params.state as string).toUpperCase();

    if (!/^[A-Z]{2}$/.test(state)) {
      throw new ValidationError('Invalid state code. Expected two-letter abbreviation (e.g., CA, NY).');
    }

    const districts = await districtService.getDistrictsByState(state);

    res.json({
      success: true,
      data: districts,
      total: districts.length,
    });
  })
);

/**
 * GET /api/districts/:state/:district
 * Get full district profile with demographics and spending
 */
router.get(
  '/:state/:district',
  cacheResponse({ ttlSeconds: CacheTTL.HOUR, prefix: CachePrefix.DISTRICTS }),
  asyncHandler(async (req: Request, res: Response) => {
    const state = (req.params.state as string).toUpperCase();
    const districtNumber = parseInt(req.params.district as string, 10);

    if (isNaN(districtNumber) || districtNumber < 0) {
      throw new ValidationError('Invalid district number.');
    }

    const profile = await districtService.getDistrictProfile(state, districtNumber);
    if (!profile) throw new NotFoundError('District');

    res.json({
      success: true,
      data: profile,
    });
  })
);

/**
 * GET /api/districts/:state/:district/impact/:billId
 * Score how a bill impacts a specific district
 */
router.get(
  '/:state/:district/impact/:billId',
  cacheResponse({ ttlSeconds: CacheTTL.HOUR, prefix: CachePrefix.DISTRICTS }),
  asyncHandler(async (req: Request, res: Response) => {
    const state = (req.params.state as string).toUpperCase();
    const districtNumber = parseInt(req.params.district as string, 10);
    const billId = req.params.billId as string;

    const impact = await districtService.scoreBillImpact(billId, state, districtNumber);
    if (!impact) throw new NotFoundError('District or Bill');

    res.json({
      success: true,
      data: impact,
    });
  })
);

/**
 * GET /api/districts/compare
 * Compare two districts
 */
router.get(
  '/compare',
  cacheResponse({ ttlSeconds: CacheTTL.HOUR, prefix: CachePrefix.DISTRICTS }),
  asyncHandler(async (req: Request, res: Response) => {
    const stateA = (req.query.stateA as string || '').toUpperCase();
    const districtA = parseInt(req.query.districtA as string, 10);
    const stateB = (req.query.stateB as string || '').toUpperCase();
    const districtB = parseInt(req.query.districtB as string, 10);

    if (!stateA || !stateB || isNaN(districtA) || isNaN(districtB)) {
      throw new ValidationError('Required params: stateA, districtA, stateB, districtB');
    }

    const comparison = await districtService.compareDistricts(stateA, districtA, stateB, districtB);

    res.json({
      success: true,
      data: comparison,
    });
  })
);

export default router;
