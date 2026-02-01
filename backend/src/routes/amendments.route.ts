/**
 * Amendments Routes
 * RESTful endpoints for congressional amendments
 */

import { Router, Request, Response } from 'express';
import { getCongressService } from '../services/congress.service';

const router = Router();
const congressService = getCongressService();

/**
 * GET /api/amendments/:congress
 * Get all amendments for a specific Congress
 * Query params: amendmentType (hamdt|samdt|suamdt), offset, limit
 */
router.get('/:congress', async (req: Request, res: Response) => {
  try {
    const congress = parseInt(req.params.congress, 10);
    const amendmentType = req.query.amendmentType as string | undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    if (isNaN(congress)) {
      return res.status(400).json({
        error: 'Invalid congress number',
      });
    }

    if (amendmentType && !['hamdt', 'samdt', 'suamdt'].includes(amendmentType.toLowerCase())) {
      return res.status(400).json({
        error: 'Invalid amendment type. Must be "hamdt", "samdt", or "suamdt"',
      });
    }

    const result = await congressService.searchAmendments(congress, {
      amendmentType: amendmentType?.toLowerCase(),
      offset,
      limit,
    });

    if (!result.success) {
      return res.status(500).json({
        error: result.error?.message || 'Failed to fetch amendments',
        details: result.error?.details,
      });
    }

    res.json({
      success: true,
      data: result.data?.data || [],
      pagination: result.data?.pagination,
    });
  } catch (error) {
    console.error('Error in GET /api/amendments/:congress:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/amendments/:congress/:amendmentType/:amendmentNumber
 * Get detailed information for a specific amendment
 */
router.get('/:congress/:amendmentType/:amendmentNumber', async (req: Request, res: Response) => {
  try {
    const congress = parseInt(req.params.congress, 10);
    const amendmentType = req.params.amendmentType.toLowerCase();
    const amendmentNumber = parseInt(req.params.amendmentNumber, 10);

    if (isNaN(congress) || isNaN(amendmentNumber)) {
      return res.status(400).json({
        error: 'Invalid amendment identifier',
      });
    }

    if (!['hamdt', 'samdt', 'suamdt'].includes(amendmentType)) {
      return res.status(400).json({
        error: 'Invalid amendment type. Must be "hamdt", "samdt", or "suamdt"',
      });
    }

    const result = await congressService.getAmendmentDetails(
      congress,
      amendmentType,
      amendmentNumber
    );

    if (!result.success) {
      return res.status(result.error?.code === 'ERR_BAD_REQUEST' ? 404 : 500).json({
        error: result.error?.message || 'Failed to fetch amendment details',
      });
    }

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Error in GET /api/amendments/:congress/:amendmentType/:amendmentNumber:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
