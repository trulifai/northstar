/**
 * Hearings Routes
 * RESTful endpoints for congressional hearings
 */

import { Router, Request, Response } from 'express';
import { getCongressService } from '../services/congress.service';

const router = Router();
const congressService = getCongressService();

/**
 * GET /api/hearings
 * Search and filter hearings
 * Query params: congress, chamber, offset, limit
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const congress = req.query.congress ? parseInt(req.query.congress as string, 10) : undefined;
    const chamber = req.query.chamber as string | undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    if (congress && isNaN(congress)) {
      return res.status(400).json({
        error: 'Invalid congress number',
      });
    }

    if (chamber && chamber !== 'house' && chamber !== 'senate') {
      return res.status(400).json({
        error: 'Invalid chamber. Must be "house" or "senate"',
      });
    }

    const result = await congressService.searchHearings({
      congress,
      chamber,
      offset,
      limit,
    });

    if (!result.success) {
      return res.status(500).json({
        error: result.error?.message || 'Failed to fetch hearings',
        details: result.error?.details,
      });
    }

    res.json({
      success: true,
      data: result.data?.data || [],
      pagination: result.data?.pagination,
    });
  } catch (error) {
    console.error('Error in GET /api/hearings:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
