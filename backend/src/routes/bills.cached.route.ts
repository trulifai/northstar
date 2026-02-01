/**
 * Bills Routes (Database-Cached Version)
 * RESTful endpoints for congressional bills with database caching
 */

import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/db.service';

const router = Router();
const dbService = new DatabaseService();

/**
 * GET /api/v2/bills
 * Search and filter bills (database-cached with API fallback)
 * Query params: congress, status, offset, limit
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const params = {
      congress: req.query.congress ? parseInt(req.query.congress as string, 10) : undefined,
      status: req.query.status as string | undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
    };

    const result = await dbService.searchBills(params);

    res.json({
      success: true,
      data: result.data,
      total: result.total,
      fromCache: result.fromCache,
      pagination: {
        offset: params.offset,
        limit: params.limit,
        total: result.total,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/v2/bills:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/v2/bills/:billId
 * Get detailed information for a specific bill
 * Example: /api/v2/bills/hr1234-118
 */
router.get('/:billId', async (req: Request, res: Response) => {
  try {
    const { billId } = req.params;

    // Validate billId format (e.g., "hr1234-118")
    if (!/^[a-z]+\d+-\d+$/.test(billId)) {
      return res.status(400).json({
        error: 'Invalid bill ID format. Expected format: hr1234-118',
      });
    }

    const bill = await dbService.getBillById(billId);

    if (!bill) {
      return res.status(404).json({
        error: 'Bill not found',
      });
    }

    res.json({
      success: true,
      data: bill,
      fromCache: true,
    });
  } catch (error) {
    console.error(`Error in GET /api/v2/bills/${req.params.billId}:`, error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
