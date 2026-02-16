/**
 * Committees Routes
 * RESTful endpoints for congressional committees
 */

import { Router, Request, Response } from 'express';
import { getCongressService } from '../services/congress.service';

const router = Router();
const congressService = getCongressService();

/**
 * GET /api/committees
 * Get all committees, optionally filtered by chamber
 * Query params: chamber (house|senate), offset, limit
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const chamber = req.query.chamber as 'house' | 'senate' | undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    if (chamber && chamber !== 'house' && chamber !== 'senate') {
      return res.status(400).json({
        error: 'Invalid chamber. Must be "house" or "senate"',
      });
    }

    const result = await congressService.getCommittees(chamber, { offset, limit });

    if (!result.success) {
      return res.status(500).json({
        error: result.error?.message || 'Failed to fetch committees',
        details: result.error?.details,
      });
    }

    return res.json({
      success: true,
      data: result.data?.data || [],
      pagination: result.data?.pagination,
    });
  } catch (error) {
    console.error('Error in GET /api/committees:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/committees/:chamber/:committeeCode
 * Get detailed information for a specific committee
 */
router.get('/:chamber/:committeeCode', async (req: Request, res: Response) => {
  try {
    const chamber = req.params.chamber.toLowerCase();
    const committeeCode = req.params.committeeCode.toUpperCase();

    if (chamber !== 'house' && chamber !== 'senate') {
      return res.status(400).json({
        error: 'Invalid chamber. Must be "house" or "senate"',
      });
    }

    const result = await congressService.getCommitteeDetails(chamber, committeeCode);

    if (!result.success) {
      return res.status(result.error?.code === 'ERR_BAD_REQUEST' ? 404 : 500).json({
        error: result.error?.message || 'Failed to fetch committee details',
      });
    }

    return res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Error in GET /api/committees/:chamber/:committeeCode:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/committees/:chamber/:committeeCode/bills
 * Get bills referred to a specific committee
 */
router.get('/:chamber/:committeeCode/bills', async (req: Request, res: Response) => {
  try {
    const chamber = req.params.chamber.toLowerCase();
    const committeeCode = req.params.committeeCode.toUpperCase();
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    if (chamber !== 'house' && chamber !== 'senate') {
      return res.status(400).json({
        error: 'Invalid chamber. Must be "house" or "senate"',
      });
    }

    const result = await congressService.getCommitteeBills(chamber, committeeCode, {
      offset,
      limit,
    });

    if (!result.success) {
      return res.status(500).json({
        error: result.error?.message || 'Failed to fetch committee bills',
      });
    }

    return res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Error in GET /api/committees/:chamber/:committeeCode/bills:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
