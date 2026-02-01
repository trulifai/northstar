/**
 * Database Service with Caching
 * Checks DB first, falls back to API if needed
 */

import { prisma } from '../lib/prisma';
import type { Member, Bill, Vote } from '@prisma/client';

export class DatabaseService {
  /**
   * Get members from database
   */
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
    
    return {
      data: members,
      total,
      cached: true,
    };
  }

  /**
   * Get bills from database
   */
  async getBills(params: {
    congress?: number;
    query?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: Bill[]; total: number; cached: boolean }> {
    const { congress = 118, query, limit = 20, offset = 0 } = params;
    
    const where: any = { congress };
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { shortTitle: { contains: query, mode: 'insensitive' } },
      ];
    }
    
    const [bills, total] = await Promise.all([
      prisma.bill.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { latestActionDate: 'desc' },
      }),
      prisma.bill.count({ where }),
    ]);
    
    return {
      data: bills,
      total,
      cached: true,
    };
  }

  /**
   * Get votes from database
   */
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
    
    return {
      data: votes,
      total,
      cached: true,
    };
  }

  /**
   * Get member by bioguide ID
   */
  async getMemberById(bioguideId: string): Promise<Member | null> {
    return await prisma.member.findUnique({
      where: { bioguideId },
    });
  }

  /**
   * Get bill by ID
   */
  async getBillById(billId: string): Promise<Bill | null> {
    return await prisma.bill.findUnique({
      where: { billId },
    });
  }

  /**
   * Check if data needs refresh (older than 24 hours)
   */
  async needsRefresh(type: 'members' | 'bills' | 'votes'): Promise<boolean> {
    const STALE_HOURS = 24;
    const cutoff = new Date(Date.now() - STALE_HOURS * 60 * 60 * 1000);
    
    try {
      let lastSync: Date | null = null;
      
      switch (type) {
        case 'members':
          const member = await prisma.member.findFirst({
            orderBy: { lastSyncedAt: 'desc' },
            select: { lastSyncedAt: true },
          });
          lastSync = member?.lastSyncedAt || null;
          break;
        case 'bills':
          const bill = await prisma.bill.findFirst({
            orderBy: { lastSyncedAt: 'desc' },
            select: { lastSyncedAt: true },
          });
          lastSync = bill?.lastSyncedAt || null;
          break;
        case 'votes':
          const vote = await prisma.vote.findFirst({
            orderBy: { updatedAt: 'desc' },
            select: { updatedAt: true },
          });
          lastSync = vote?.updatedAt || null;
          break;
      }
      
      if (!lastSync) return true; // No data = needs refresh
      return lastSync < cutoff; // True if older than 24h
    } catch (error) {
      console.error(`[DB] Error checking staleness for ${type}:`, error);
      return true;
    }
  }
}

// Export singleton instance
export const dbService = new DatabaseService();
