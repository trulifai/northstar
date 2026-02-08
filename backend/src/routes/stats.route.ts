/**
 * Stats Route
 * Real-time database statistics for the dashboard
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/errorHandler';
import { cacheResponse } from '../middleware/cacheMiddleware';
import { CacheTTL, CachePrefix } from '../lib/cache';

const router = Router();

/**
 * GET /api/stats
 * Returns real counts from the database
 */
router.get(
  '/',
  cacheResponse({ ttlSeconds: CacheTTL.MEDIUM, prefix: CachePrefix.STATS }),
  asyncHandler(async (_req: Request, res: Response) => {
    const [
      billCount,
      memberCount,
      committeeCount,
      voteCount,
      amendmentCount,
      hearingCount,
      lobbyingCount,
      contributionCount,
    ] = await Promise.all([
      prisma.bill.count(),
      prisma.member.count({ where: { currentMember: true } }),
      prisma.committee.count(),
      prisma.vote.count(),
      prisma.amendment.count(),
      prisma.hearing.count(),
      prisma.lobbyingReport.count(),
      prisma.campaignContribution.count(),
    ]);

    // Get last sync timestamps
    const [lastBillSync, lastMemberSync, lastVoteSync] = await Promise.all([
      prisma.bill.findFirst({ orderBy: { lastSyncedAt: 'desc' }, select: { lastSyncedAt: true } }),
      prisma.member.findFirst({ orderBy: { lastSyncedAt: 'desc' }, select: { lastSyncedAt: true } }),
      prisma.vote.findFirst({ orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } }),
    ]);

    res.json({
      success: true,
      data: {
        counts: {
          bills: billCount,
          members: memberCount,
          committees: committeeCount,
          votes: voteCount,
          amendments: amendmentCount,
          hearings: hearingCount,
          lobbyingReports: lobbyingCount,
          campaignContributions: contributionCount,
        },
        lastSync: {
          bills: lastBillSync?.lastSyncedAt || null,
          members: lastMemberSync?.lastSyncedAt || null,
          votes: lastVoteSync?.updatedAt || null,
        },
        congress: 118,
      },
    });
  })
);

export default router;
