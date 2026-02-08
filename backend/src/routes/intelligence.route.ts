/**
 * Intelligence Routes
 * AI-powered bill analysis endpoints
 */

import { Router, Request, Response } from 'express';
import { billIntelligenceService } from '../services/bill-intelligence.service';
import { geminiService } from '../services/gemini.service';
import { asyncHandler, ValidationError } from '../middleware/errorHandler';
import { cacheResponse } from '../middleware/cacheMiddleware';
import { CacheTTL } from '../lib/cache';

const router = Router();

/**
 * GET /api/intelligence/bills/:billId
 * Get complete AI intelligence for a bill
 */
router.get(
  '/bills/:billId',
  cacheResponse({ ttlSeconds: CacheTTL.HOUR, prefix: 'intelligence' }),
  asyncHandler(async (req: Request, res: Response) => {
    const billId = req.params.billId as string;

    const intelligence = await billIntelligenceService.getIntelligence(billId);

    res.json({
      success: true,
      data: intelligence,
    });
  })
);

/**
 * POST /api/intelligence/bills/:billId/summarize
 * Trigger on-demand AI summarization for a bill
 */
router.post(
  '/bills/:billId/summarize',
  asyncHandler(async (req: Request, res: Response) => {
    const billId = req.params.billId as string;

    if (!geminiService.isConfigured) {
      throw new ValidationError('AI summarization is not configured. Set GEMINI_API_KEY in environment.');
    }

    const intelligence = await billIntelligenceService.getIntelligence(billId);

    res.json({
      success: true,
      data: {
        billId,
        aiSummary: intelligence.aiSummary,
        keyPoints: intelligence.keyPoints,
        topics: intelligence.topics,
      },
    });
  })
);

/**
 * POST /api/intelligence/batch/scores
 * Batch compute passage probability and bipartisan scores
 */
router.post(
  '/batch/scores',
  asyncHandler(async (req: Request, res: Response) => {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
    const updated = await billIntelligenceService.batchComputeScores(limit);

    res.json({
      success: true,
      data: { updated, limit },
    });
  })
);

/**
 * POST /api/intelligence/batch/summarize
 * Batch generate AI summaries for bills
 */
router.post(
  '/batch/summarize',
  asyncHandler(async (req: Request, res: Response) => {
    if (!geminiService.isConfigured) {
      throw new ValidationError('AI summarization is not configured. Set GEMINI_API_KEY in environment.');
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const summarized = await billIntelligenceService.batchSummarize(limit);

    res.json({
      success: true,
      data: { summarized, limit },
    });
  })
);

export default router;
