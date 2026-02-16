/**
 * Members Routes
 * RESTful endpoints for congressional members
 */

import { Router, Request, Response } from 'express';
import { dbService } from '../services/db.service';
import { getCongressService } from '../services/congress.service';
import type { MemberSearchParams } from '../types';

const router = Router();
const congressService = getCongressService();
const useLiveApiMode = (process.env.NORTHSTAR_DATA_MODE || '').toLowerCase() === 'live' || !process.env.DATABASE_URL;

/**
 * GET /api/members
 * Search and filter members
 * Query params: query, state, party, chamber, currentMember, offset, limit
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const state = req.query.state as string | undefined;
    const party = req.query.party as string | undefined;
    const chamber = req.query.chamber as string | undefined;
    const query = req.query.query as string | undefined;
    const currentMemberParam = req.query.currentMember as string | undefined;
    const currentMember = currentMemberParam === undefined ? true : currentMemberParam.toLowerCase() !== 'false';
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    // Low-cost mode: skip DB and fetch directly from Congress.gov.
    if (useLiveApiMode) {
      const params: MemberSearchParams = {
        query,
        state,
        party: party as any,
        chamber: chamber as any,
        currentMember,
        offset,
        limit,
      };

      const result = await congressService.searchMembers(params);
      if (!result.success) {
        return res.status(500).json({
          error: result.error?.message || 'Failed to fetch members',
          details: result.error?.details,
        });
      }

      return res.json({
        success: true,
        data: result.data?.data || [],
        pagination: result.data?.pagination,
        meta: {
          source: 'congress.gov-live',
          timestamp: new Date().toISOString(),
        },
      });
    }

    try {
      const result = await dbService.getMembers({
        state,
        party,
        chamber,
        offset,
        limit,
      });

      console.log(`[API] Returned ${result.data.length} members (cached: ${result.cached})`);

      return res.json({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          offset,
          limit,
          hasMore: offset + limit < result.total,
        },
        meta: {
          cached: result.cached,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (dbError) {
      console.warn('[Members] DB read failed, falling back to Congress.gov live mode:', dbError);

      const params: MemberSearchParams = {
        query,
        state,
        party: party as any,
        chamber: chamber as any,
        currentMember,
        offset,
        limit,
      };
      const result = await congressService.searchMembers(params);
      if (!result.success) {
        return res.status(500).json({
          error: result.error?.message || 'Failed to fetch members',
          details: result.error?.details,
        });
      }

      return res.json({
        success: true,
        data: result.data?.data || [],
        pagination: result.data?.pagination,
        meta: {
          source: 'congress.gov-fallback',
          timestamp: new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    console.error('Error in GET /api/members:', error);
    return res.status(500).json({
      error: 'Failed to fetch members',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/members/:bioguideId
 * Get detailed information for a specific member
 */
router.get('/:bioguideId', async (req: Request, res: Response) => {
  try {
    const bioguideId = req.params.bioguideId.toUpperCase();

    const result = await congressService.getMemberDetails(bioguideId);

    if (!result.success) {
      return res.status(result.error?.code === 'ERR_BAD_REQUEST' ? 404 : 500).json({
        error: result.error?.message || 'Failed to fetch member details',
      });
    }

    return res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Error in GET /api/members/:bioguideId:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/members/:bioguideId/sponsored-bills
 * Get bills sponsored by a member
 */
router.get('/:bioguideId/sponsored-bills', async (req: Request, res: Response) => {
  try {
    const bioguideId = req.params.bioguideId.toUpperCase();
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    const result = await congressService.getMemberSponsoredBills(bioguideId, {
      offset,
      limit,
    });

    if (!result.success) {
      return res.status(500).json({
        error: result.error?.message || 'Failed to fetch sponsored bills',
      });
    }

    return res.json({
      success: true,
      data: result.data?.data || [],
      pagination: result.data?.pagination,
    });
  } catch (error) {
    console.error('Error in GET /api/members/:bioguideId/sponsored-bills:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/members/:bioguideId/cosponsored-bills
 * Get bills cosponsored by a member
 */
router.get('/:bioguideId/cosponsored-bills', async (req: Request, res: Response) => {
  try {
    const bioguideId = req.params.bioguideId.toUpperCase();
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    const result = await congressService.getMemberCosponsoredBills(bioguideId, {
      offset,
      limit,
    });

    if (!result.success) {
      return res.status(500).json({
        error: result.error?.message || 'Failed to fetch cosponsored bills',
      });
    }

    return res.json({
      success: true,
      data: result.data?.data || [],
      pagination: result.data?.pagination,
    });
  } catch (error) {
    console.error('Error in GET /api/members/:bioguideId/cosponsored-bills:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
