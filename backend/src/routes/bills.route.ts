/**
 * Bills Routes
 * RESTful endpoints for congressional bills
 */

import { Router, Request, Response } from 'express';
import { getCongressService } from '../services/congress.service';
import type { BillSearchParams } from '../types';

const router = Router();
const congressService = getCongressService();

/**
 * GET /api/bills
 * Search and filter bills
 * Query params: query, congress, billType, status, offset, limit
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const params: BillSearchParams = {
      query: req.query.query as string | undefined,
      congress: req.query.congress ? parseInt(req.query.congress as string, 10) : undefined,
      billType: req.query.billType as any,
      status: req.query.status as any,
      offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      sort: req.query.sort as any,
      order: req.query.order as any,
    };

    const result = await congressService.searchBills(params);

    if (!result.success) {
      return res.status(500).json({
        error: result.error?.message || 'Failed to fetch bills',
        details: result.error?.details,
      });
    }

    res.json({
      success: true,
      data: result.data?.data || [],
      pagination: result.data?.pagination,
    });
  } catch (error) {
    console.error('Error in GET /api/bills:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/bills/:congress
 * Get all bills for a specific Congress
 */
router.get('/:congress', async (req: Request, res: Response) => {
  try {
    const congress = parseInt(req.params.congress, 10);
    const billType = req.query.billType as string | undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    if (isNaN(congress)) {
      return res.status(400).json({
        error: 'Invalid congress number',
      });
    }

    const result = await congressService.getBillsByCongress(congress, {
      billType,
      offset,
      limit,
    });

    if (!result.success) {
      return res.status(500).json({
        error: result.error?.message || 'Failed to fetch bills',
      });
    }

    res.json({
      success: true,
      data: result.data?.data || [],
      pagination: result.data?.pagination,
    });
  } catch (error) {
    console.error('Error in GET /api/bills/:congress:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/bills/:congress/:billType/:billNumber
 * Get detailed information for a specific bill
 */
router.get('/:congress/:billType/:billNumber', async (req: Request, res: Response) => {
  try {
    const congress = parseInt(req.params.congress, 10);
    const billType = req.params.billType.toLowerCase();
    const billNumber = parseInt(req.params.billNumber, 10);

    if (isNaN(congress) || isNaN(billNumber)) {
      return res.status(400).json({
        error: 'Invalid bill identifier',
      });
    }

    const result = await congressService.getBillDetails(congress, billType, billNumber);

    if (!result.success) {
      return res.status(result.error?.code === 'ERR_BAD_REQUEST' ? 404 : 500).json({
        error: result.error?.message || 'Failed to fetch bill details',
      });
    }

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Error in GET /api/bills/:congress/:billType/:billNumber:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/bills/:congress/:billType/:billNumber/text
 * Get bill text (all versions)
 */
router.get('/:congress/:billType/:billNumber/text', async (req: Request, res: Response) => {
  try {
    const congress = parseInt(req.params.congress, 10);
    const billType = req.params.billType.toLowerCase();
    const billNumber = parseInt(req.params.billNumber, 10);

    const result = await congressService.getBillText(congress, billType, billNumber);

    if (!result.success) {
      return res.status(500).json({
        error: result.error?.message || 'Failed to fetch bill text',
      });
    }

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Error in GET /api/bills/:congress/:billType/:billNumber/text:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/bills/:congress/:billType/:billNumber/actions
 * Get bill legislative actions/history
 */
router.get('/:congress/:billType/:billNumber/actions', async (req: Request, res: Response) => {
  try {
    const congress = parseInt(req.params.congress, 10);
    const billType = req.params.billType.toLowerCase();
    const billNumber = parseInt(req.params.billNumber, 10);
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    const result = await congressService.getBillActions(congress, billType, billNumber, {
      offset,
      limit,
    });

    if (!result.success) {
      return res.status(500).json({
        error: result.error?.message || 'Failed to fetch bill actions',
      });
    }

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Error in GET /api/bills/:congress/:billType/:billNumber/actions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/bills/:congress/:billType/:billNumber/cosponsors
 * Get bill cosponsors
 */
router.get('/:congress/:billType/:billNumber/cosponsors', async (req: Request, res: Response) => {
  try {
    const congress = parseInt(req.params.congress, 10);
    const billType = req.params.billType.toLowerCase();
    const billNumber = parseInt(req.params.billNumber, 10);
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    const result = await congressService.getBillCosponsors(congress, billType, billNumber, {
      offset,
      limit,
    });

    if (!result.success) {
      return res.status(500).json({
        error: result.error?.message || 'Failed to fetch cosponsors',
      });
    }

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Error in GET /api/bills/:congress/:billType/:billNumber/cosponsors:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/bills/:congress/:billType/:billNumber/amendments
 * Get bill amendments
 */
router.get('/:congress/:billType/:billNumber/amendments', async (req: Request, res: Response) => {
  try {
    const congress = parseInt(req.params.congress, 10);
    const billType = req.params.billType.toLowerCase();
    const billNumber = parseInt(req.params.billNumber, 10);
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    const result = await congressService.getBillAmendments(congress, billType, billNumber, {
      offset,
      limit,
    });

    if (!result.success) {
      return res.status(500).json({
        error: result.error?.message || 'Failed to fetch amendments',
      });
    }

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Error in GET /api/bills/:congress/:billType/:billNumber/amendments:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/bills/:congress/:billType/:billNumber/related
 * Get related bills
 */
router.get('/:congress/:billType/:billNumber/related', async (req: Request, res: Response) => {
  try {
    const congress = parseInt(req.params.congress, 10);
    const billType = req.params.billType.toLowerCase();
    const billNumber = parseInt(req.params.billNumber, 10);

    const result = await congressService.getRelatedBills(congress, billType, billNumber);

    if (!result.success) {
      return res.status(500).json({
        error: result.error?.message || 'Failed to fetch related bills',
      });
    }

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Error in GET /api/bills/:congress/:billType/:billNumber/related:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/bills/:congress/:billType/:billNumber/subjects
 * Get bill subjects/policy areas
 */
router.get('/:congress/:billType/:billNumber/subjects', async (req: Request, res: Response) => {
  try {
    const congress = parseInt(req.params.congress, 10);
    const billType = req.params.billType.toLowerCase();
    const billNumber = parseInt(req.params.billNumber, 10);

    const result = await congressService.getBillSubjects(congress, billType, billNumber);

    if (!result.success) {
      return res.status(500).json({
        error: result.error?.message || 'Failed to fetch bill subjects',
      });
    }

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Error in GET /api/bills/:congress/:billType/:billNumber/subjects:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/bills/:congress/:billType/:billNumber/summaries
 * Get bill summaries (CRS summaries)
 */
router.get('/:congress/:billType/:billNumber/summaries', async (req: Request, res: Response) => {
  try {
    const congress = parseInt(req.params.congress, 10);
    const billType = req.params.billType.toLowerCase();
    const billNumber = parseInt(req.params.billNumber, 10);

    const result = await congressService.getBillSummaries(congress, billType, billNumber);

    if (!result.success) {
      return res.status(500).json({
        error: result.error?.message || 'Failed to fetch bill summaries',
      });
    }

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Error in GET /api/bills/:congress/:billType/:billNumber/summaries:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
