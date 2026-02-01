/**
 * Database Service with Caching
 * Checks DB first, falls back to API, then caches results
 */

import { PrismaClient } from '@prisma/client';
import { getCongressService } from './congress.service';
import type { ApiResponse, Bill as ApiBill, Member as ApiMember, Vote as ApiVote } from '../types';

const prisma = new PrismaClient();
const congressService = getCongressService();

// Cache TTL (time to live) - 30 minutes
const CACHE_TTL_MS = 30 * 60 * 1000;

export class DatabaseService {
  /**
   * Get members with database caching
   */
  async getMembers(params: {
    state?: string;
    party?: string;
    chamber?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<ApiMember[]>> {
    const { state, party, chamber, limit = 20, offset = 0 } = params;
    
    try {
      // Try to get from database first
      const where: any = { currentMember: true };
      if (state) where.state = state;
      if (party) where.party = party;
      if (chamber) where.chamber = chamber;
      
      const [members, total] = await Promise.all([
        prisma.member.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: [
            { state: 'asc' },
            { lastName: 'asc' },
          ],
        }),
        prisma.member.count({ where }),
      ]);
      
      // If we have data in database, use it
      if (members.length > 0) {
        console.log(`[DB Cache] Returning ${members.length} members from database`);
        
        // Convert to API format
        const apiMembers: ApiMember[] = members.map(m => ({
          bioguideId: m.bioguideId,
          name: m.fullName,
          fullName: m.fullName,
          partyName: m.party === 'D' ? 'Democratic' : m.party === 'R' ? 'Republican' : 'Independent',
          state: m.state,
          district: m.district,
          url: `https://api.congress.gov/v3/member/${m.bioguideId}`,
        }));
        
        return {
          success: true,
          data: apiMembers,
          pagination: {
            total,
            offset,
            limit,
            hasMore: offset + limit < total,
          },
          meta: {
            cached: true,
            source: 'database',
            timestamp: new Date().toISOString(),
          },
        };
      }
      
      // Fall back to API if no data in database
      console.log('[DB Cache] No data in database, falling back to API');
      return await congressService.searchMembers({
        state,
        party,
        chamber,
        currentMember: true,
        offset,
        limit,
      });
    } catch (error) {
      console.error('[DB Service] Error getting members:', error);
      // On database error, fall back to API
      return await congressService.searchMembers(params);
    }
  }

  /**
   * Get bills with database caching
   */
  async getBills(params: {
    congress?: number;
    query?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<ApiBill[]>> {
    const { congress = 118, query, limit = 20, offset = 0 } = params;
    
    try {
      // Try to get from database first
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
      
      // If we have data in database, use it
      if (bills.length > 0) {
        console.log(`[DB Cache] Returning ${bills.length} bills from database`);
        
        // Convert to API format
        const apiBills: ApiBill[] = bills.map(b => ({
          congress: b.congress,
          type: b.billType,
          number: b.billNumber,
          title: b.title || '',
          latestAction: {
            actionDate: b.latestActionDate?.toISOString().split('T')[0] || '',
            text: b.latestActionText || '',
          },
          introducedDate: b.introducedDate?.toISOString().split('T')[0],
          url: b.congressGovUrl || '',
        }));
        
        return {
          success: true,
          data: apiBills,
          pagination: {
            total,
            offset,
            limit,
            hasMore: offset + limit < total,
          },
          meta: {
            cached: true,
            source: 'database',
            timestamp: new Date().toISOString(),
          },
        };
      }
      
      // Fall back to API if no data in database
      console.log('[DB Cache] No bills in database, falling back to API');
      return await congressService.searchBills({
        congress,
        query,
        offset,
        limit,
      });
    } catch (error) {
      console.error('[DB Service] Error getting bills:', error);
      // On database error, fall back to API
      return await congressService.searchBills(params);
    }
  }

  /**
   * Get votes with database caching
   */
  async getVotes(params: {
    congress?: number;
    chamber?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<ApiVote[]>> {
    const { congress = 118, chamber, limit = 20, offset = 0 } = params;
    
    try {
      // Try to get from database first
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
      
      // If we have data in database, use it
      if (votes.length > 0) {
        console.log(`[DB Cache] Returning ${votes.length} votes from database`);
        
        // Convert to API format
        const apiVotes: ApiVote[] = votes.map(v => ({
          congress: v.congress,
          chamber: v.chamber,
          rollNumber: v.rollNumber,
          date: v.voteDate.toISOString(),
          question: v.voteQuestion || '',
          result: v.voteResult || '',
          votes: {
            yea: v.yeaTotal || 0,
            nay: v.nayTotal || 0,
            present: v.presentTotal || 0,
            notVoting: v.notVotingTotal || 0,
          },
        }));
        
        return {
          success: true,
          data: apiVotes,
          pagination: {
            total,
            offset,
            limit,
            hasMore: offset + limit < total,
          },
          meta: {
            cached: true,
            source: 'database',
            timestamp: new Date().toISOString(),
          },
        };
      }
      
      // Fall back to API if no data in database
      console.log('[DB Cache] No votes in database, falling back to API');
      return await congressService.searchVotes({
        congress,
        chamber,
        offset,
        limit,
      });
    } catch (error) {
      console.error('[DB Service] Error getting votes:', error);
      // On database error, fall back to API
      return await congressService.searchVotes(params);
    }
  }

  /**
   * Check if data is stale and needs refresh
   */
  async isDataStale(type: 'members' | 'bills' | 'votes'): Promise<boolean> {
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
      
      if (!lastSync) {
        return true; // No data, definitely stale
      }
      
      const age = Date.now() - lastSync.getTime();
      return age > CACHE_TTL_MS;
    } catch (error) {
      console.error('[DB Service] Error checking staleness:', error);
      return true; // On error, assume stale
    }
  }
}

export const dbService = new DatabaseService();
