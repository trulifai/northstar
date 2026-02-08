/**
 * Database Service
 * Central query layer for all PostgreSQL data
 */

import { prisma } from '../lib/prisma';
import type { Member, Bill, Vote, Committee, Amendment, Cosponsor, BillAction } from '@prisma/client';

export class DatabaseService {
  // =========================================================================
  // Members
  // =========================================================================

  async getMembers(params: {
    state?: string;
    party?: string;
    chamber?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: Member[]; total: number; cached: boolean }> {
    const { state, party, chamber, limit = 20, offset = 0 } = params;

    const where: any = { currentMember: true };
    if (state) where.state = state;
    if (party) where.party = party;
    if (chamber) where.chamber = chamber;

    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: [{ state: 'asc' }, { lastName: 'asc' }],
      }),
      prisma.member.count({ where }),
    ]);

    return { data: members, total, cached: true };
  }

  async getMemberById(bioguideId: string): Promise<Member | null> {
    return prisma.member.findUnique({ where: { bioguideId } });
  }

  async getMemberWithRelations(bioguideId: string) {
    return prisma.member.findUnique({
      where: { bioguideId },
      include: {
        sponsoredBills: {
          take: 20,
          orderBy: { latestActionDate: 'desc' },
        },
        committeeMemberships: {
          include: { committee: true },
        },
        campaignContributions: {
          take: 20,
          orderBy: { amount: 'desc' },
        },
      },
    });
  }

  // =========================================================================
  // Bills
  // =========================================================================

  async getBills(params: {
    congress?: number;
    query?: string;
    status?: string;
    billType?: string;
    sponsorId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: Bill[]; total: number; cached: boolean }> {
    const { congress = 118, query, status, billType, sponsorId, limit = 20, offset = 0 } = params;

    // Use PostgreSQL full-text search when query is provided
    if (query && query.trim().length > 0) {
      return this.searchBillsFullText({ congress, query, status, billType, sponsorId, limit, offset });
    }

    const where: any = { congress };
    if (status) where.status = status;
    if (billType) where.billType = billType;
    if (sponsorId) where.sponsorBioguideId = sponsorId;

    const [bills, total] = await Promise.all([
      prisma.bill.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { latestActionDate: 'desc' },
      }),
      prisma.bill.count({ where }),
    ]);

    return { data: bills, total, cached: true };
  }

  /**
   * Full-text search using PostgreSQL tsvector/tsquery with GIN indexes.
   * Supports natural language queries like "climate change", "healthcare reform"
   */
  private async searchBillsFullText(params: {
    congress: number;
    query: string;
    status?: string;
    billType?: string;
    sponsorId?: string;
    limit: number;
    offset: number;
  }): Promise<{ data: Bill[]; total: number; cached: boolean }> {
    const { congress, query, status, billType, sponsorId, limit, offset } = params;

    // Convert user query to tsquery format (handles multi-word queries)
    const tsQuery = query.trim().split(/\s+/).join(' & ');

    // Build WHERE clause fragments
    const conditions: string[] = ['congress = $1'];
    const countConditions: string[] = ['congress = $1'];
    const queryParams: unknown[] = [congress];
    let paramIndex = 2;

    if (status) {
      conditions.push(`status = $${paramIndex}`);
      countConditions.push(`status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }
    if (billType) {
      conditions.push(`bill_type = $${paramIndex}`);
      countConditions.push(`bill_type = $${paramIndex}`);
      queryParams.push(billType);
      paramIndex++;
    }
    if (sponsorId) {
      conditions.push(`sponsor_bioguide_id = $${paramIndex}`);
      countConditions.push(`sponsor_bioguide_id = $${paramIndex}`);
      queryParams.push(sponsorId);
      paramIndex++;
    }

    // Full-text search condition
    const ftsCondition = `to_tsvector('english',
      COALESCE(title, '') || ' ' ||
      COALESCE(short_title, '') || ' ' ||
      COALESCE(summary_text, '') || ' ' ||
      COALESCE(latest_action_text, '')
    ) @@ to_tsquery('english', $${paramIndex})`;

    conditions.push(ftsCondition);
    countConditions.push(ftsCondition);

    const whereClause = conditions.join(' AND ');
    const countWhereClause = countConditions.join(' AND ');

    // Rank by relevance, then by date
    const rankExpr = `ts_rank(to_tsvector('english',
      COALESCE(title, '') || ' ' ||
      COALESCE(short_title, '') || ' ' ||
      COALESCE(summary_text, '') || ' ' ||
      COALESCE(latest_action_text, '')
    ), to_tsquery('english', $${paramIndex}))`;

    const searchParams = [...queryParams, tsQuery];

    const [bills, countResult] = await Promise.all([
      prisma.$queryRawUnsafe<Bill[]>(
        `SELECT * FROM bills
         WHERE ${whereClause}
         ORDER BY ${rankExpr} DESC, latest_action_date DESC NULLS LAST
         LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}`,
        ...searchParams, limit, offset
      ),
      prisma.$queryRawUnsafe<{ count: bigint }[]>(
        `SELECT COUNT(*) as count FROM bills WHERE ${countWhereClause}`,
        ...searchParams
      ),
    ]);

    return {
      data: bills,
      total: Number(countResult[0]?.count || 0),
      cached: true,
    };
  }

  async getBillById(billId: string): Promise<Bill | null> {
    return prisma.bill.findUnique({ where: { billId } });
  }

  async getBillWithRelations(billId: string) {
    return prisma.bill.findUnique({
      where: { billId },
      include: {
        sponsor: true,
        cosponsors: {
          include: { member: true },
          orderBy: { sponsoredDate: 'asc' },
        },
        actions: {
          orderBy: { actionDate: 'desc' },
        },
        amendments: {
          orderBy: { submittedDate: 'desc' },
        },
        votes: {
          orderBy: { voteDate: 'desc' },
        },
        lobbyingReports: {
          orderBy: { filingDate: 'desc' },
          take: 20,
        },
      },
    });
  }

  async getBillActions(billId: string): Promise<BillAction[]> {
    return prisma.billAction.findMany({
      where: { billId },
      orderBy: { actionDate: 'desc' },
    });
  }

  async getBillCosponsors(billId: string): Promise<(Cosponsor & { member: Member })[]> {
    return prisma.cosponsor.findMany({
      where: { billId },
      include: { member: true },
      orderBy: { sponsoredDate: 'asc' },
    });
  }

  async getBillAmendments(billId: string): Promise<Amendment[]> {
    return prisma.amendment.findMany({
      where: { billId },
      orderBy: { submittedDate: 'desc' },
    });
  }

  // =========================================================================
  // Votes
  // =========================================================================

  async getVotes(params: {
    congress?: number;
    chamber?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: Vote[]; total: number; cached: boolean }> {
    const { congress = 118, chamber, limit = 20, offset = 0 } = params;

    const where: any = { congress };
    if (chamber) where.chamber = chamber;

    const [votes, total] = await Promise.all([
      prisma.vote.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { voteDate: 'desc' },
      }),
      prisma.vote.count({ where }),
    ]);

    return { data: votes, total, cached: true };
  }

  async getVoteById(voteId: string): Promise<Vote | null> {
    return prisma.vote.findUnique({ where: { voteId } });
  }

  async getVoteWithPositions(voteId: string) {
    return prisma.vote.findUnique({
      where: { voteId },
      include: {
        positions: {
          include: { member: true },
        },
        bill: true,
      },
    });
  }

  // =========================================================================
  // Committees
  // =========================================================================

  async getCommittees(params: {
    chamber?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: Committee[]; total: number; cached: boolean }> {
    const { chamber, limit = 20, offset = 0 } = params;

    const where: any = {};
    if (chamber) where.chamber = chamber;

    const [committees, total] = await Promise.all([
      prisma.committee.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.committee.count({ where }),
    ]);

    return { data: committees, total, cached: true };
  }

  async getCommitteeById(committeeCode: string) {
    return prisma.committee.findUnique({
      where: { committeeCode },
      include: {
        memberships: {
          include: { member: true },
        },
        subcommittees: true,
        hearings: {
          orderBy: { hearingDate: 'desc' },
          take: 10,
        },
      },
    });
  }

  // =========================================================================
  // Amendments
  // =========================================================================

  async getAmendments(params: {
    congress?: number;
    billId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: Amendment[]; total: number; cached: boolean }> {
    const { congress, billId, limit = 20, offset = 0 } = params;

    const where: any = {};
    if (congress) where.congress = congress;
    if (billId) where.billId = billId;

    const [amendments, total] = await Promise.all([
      prisma.amendment.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { submittedDate: 'desc' },
      }),
      prisma.amendment.count({ where }),
    ]);

    return { data: amendments, total, cached: true };
  }

  // =========================================================================
  // Staleness Check
  // =========================================================================

  async needsRefresh(type: 'members' | 'bills' | 'votes'): Promise<boolean> {
    const STALE_HOURS = 24;
    const cutoff = new Date(Date.now() - STALE_HOURS * 60 * 60 * 1000);

    try {
      let lastSync: Date | null = null;

      switch (type) {
        case 'members': {
          const member = await prisma.member.findFirst({
            orderBy: { lastSyncedAt: 'desc' },
            select: { lastSyncedAt: true },
          });
          lastSync = member?.lastSyncedAt || null;
          break;
        }
        case 'bills': {
          const bill = await prisma.bill.findFirst({
            orderBy: { lastSyncedAt: 'desc' },
            select: { lastSyncedAt: true },
          });
          lastSync = bill?.lastSyncedAt || null;
          break;
        }
        case 'votes': {
          const vote = await prisma.vote.findFirst({
            orderBy: { updatedAt: 'desc' },
            select: { updatedAt: true },
          });
          lastSync = vote?.updatedAt || null;
          break;
        }
      }

      if (!lastSync) return true;
      return lastSync < cutoff;
    } catch {
      return true;
    }
  }
}

export const dbService = new DatabaseService();
