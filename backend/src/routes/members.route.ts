/**
 * Members Routes
 * RESTful endpoints for congressional members
 */

import { Router, Request, Response } from 'express';
import { dbService } from '../services/db.service';
import type { MemberSearchParams } from '../types';

const router = Router();

/**
 * GET /api/members
 * Search and filter members
 * Query params: query, state, party, chamber, currentMember, offset, limit
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const params: MemberSearchParams = {
      query: req.query.query as string | undefined,
      state: req.query.state as string | undefined,
      party: req.query.party as any,
      chamber: req.query.chamber as any,
      currentMember: req.query.currentMember === 'false' ? false : true,
      offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
    };

    const result = await dbService.getMembers(params);

    if (!result.success) {
      return res.status(500).json({
        error: result.error?.message || 'Failed to fetch members',
        details: result.error?.details,
      });
    }

    res.json({
      success: true,
      data: result.data?.data || [],
      pagination: result.data?.pagination,
    });
  } catch (error) {
    console.error('Error in GET /api/members:', error);
    res.status(500).json({
      error: 'Internal server error',
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

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Error in GET /api/members/:bioguideId:', error);
    res.status(500).json({
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

    res.json({
      success: true,
      data: result.data?.data || [],
      pagination: result.data?.pagination,
    });
  } catch (error) {
    console.error('Error in GET /api/members/:bioguideId/sponsored-bills:', error);
    res.status(500).json({
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

    res.json({
      success: true,
      data: result.data?.data || [],
      pagination: result.data?.pagination,
    });
  } catch (error) {
    console.error('Error in GET /api/members/:bioguideId/cosponsored-bills:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
