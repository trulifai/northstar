/**
 * Votes Routes
 * RESTful endpoints for congressional votes
 */

import { Router, Request, Response } from 'express';
import { getCongressService } from '../services/congress.service';
import type { VoteSearchParams } from '../types';

const router = Router();
const congressService = getCongressService();

/**
 * GET /api/votes
 * Search and filter votes
 * Query params: congress, chamber, startDate, endDate, offset, limit
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const params: VoteSearchParams = {
      congress: req.query.congress ? parseInt(req.query.congress as string, 10) : undefined,
      chamber: req.query.chamber as any,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
    };

    const result = await congressService.searchVotes(params);

    if (!result.success) {
      return res.status(500).json({
        error: result.error?.message || 'Failed to fetch votes',
        details: result.error?.details,
      });
    }

    res.json({
      success: true,
      data: result.data?.data || [],
      pagination: result.data?.pagination,
    });
  } catch (error) {
    console.error('Error in GET /api/votes:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/votes/:congress/:chamber/:rollNumber
 * Get detailed information for a specific vote
 */
router.get('/:congress/:chamber/:rollNumber', async (req: Request, res: Response) => {
  try {
    const congress = parseInt(req.params.congress, 10);
    const chamber = req.params.chamber.toLowerCase();
    const rollNumber = parseInt(req.params.rollNumber, 10);

    if (isNaN(congress) || isNaN(rollNumber)) {
      return res.status(400).json({
        error: 'Invalid vote identifier',
      });
    }

    if (chamber !== 'house' && chamber !== 'senate') {
      return res.status(400).json({
        error: 'Invalid chamber. Must be "house" or "senate"',
      });
    }

    const result = await congressService.getVoteDetails(congress, chamber, rollNumber);

    if (!result.success) {
      return res.status(result.error?.code === 'ERR_BAD_REQUEST' ? 404 : 500).json({
        error: result.error?.message || 'Failed to fetch vote details',
      });
    }

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Error in GET /api/votes/:congress/:chamber/:rollNumber:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
