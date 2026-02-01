/**
 * Database Service
 * Provides database access with API fallback
 */

import { PrismaClient, Bill, Member, Vote, Committee } from '@prisma/client';
import { CongressService } from './congress.service';
import config from '../config';

export class DatabaseService {
  private prisma: PrismaClient;
  private congressService: CongressService;
  private readonly CACHE_HOURS = 24; // How old before re-fetching from API

  constructor() {
    this.prisma = new PrismaClient();
    this.congressService = new CongressService(config.apiKeys.congressGov);
  }

  // ============================================================================
  // Bills
  // ============================================================================

  /**
   * Search bills - checks DB first, falls back to API
   */
  async searchBills(params: {
    congress?: number;
    status?: string;
    offset?: number;
    limit?: number;
  }): Promise<{ data: Bill[]; total: number; fromCache: boolean }> {
    const { congress, status, offset = 0, limit = 20 } = params;

    try {
      // Build query filters
      const where: any = {};
      if (congress) where.congress = congress;
      if (status) where.status = status;

      // Try database first
      const [bills, total] = await Promise.all([
        this.prisma.bill.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: { introducedDate: 'desc' },
        }),
        this.prisma.bill.count({ where }),
      ]);

      if (bills.length > 0) {
        console.log(`✓ Retrieved ${bills.length} bills from database`);
        return { data: bills, total, fromCache: true };
      }

      // If no data in DB, fall back to API
      console.log('⚠️  No bills in database, fetching from API...');
      const apiResponse = await this.congressService.searchBills({
        congress,
        offset,
        limit,
      });

      if (!apiResponse.success || !apiResponse.data?.data) {
        return { data: [], total: 0, fromCache: false };
      }

      return {
        data: apiResponse.data.data as any,
        total: apiResponse.data.pagination?.total || 0,
        fromCache: false,
      };
    } catch (error) {
      console.error('❌ Database query failed:', error);
      return { data: [], total: 0, fromCache: false };
    }
  }

  /**
   * Get bill by ID - DB first, API fallback
   */
  async getBillById(billId: string): Promise<Bill | null> {
    try {
      // Check database
      const bill = await this.prisma.bill.findUnique({
        where: { billId },
        include: {
          sponsor: true,
          cosponsors: {
            include: { member: true },
          },
          actions: {
            orderBy: { actionDate: 'desc' },
            take: 10,
          },
        },
      });

      if (bill) {
        // Check if data is fresh enough
        const age = bill.lastSyncedAt 
          ? Date.now() - bill.lastSyncedAt.getTime() 
          : Infinity;
        
        if (age < this.CACHE_HOURS * 60 * 60 * 1000) {
          console.log(`✓ Retrieved bill ${billId} from database (${Math.round(age / 3600000)}h old)`);
          return bill as any;
        }
      }

      // Fallback to API
      console.log(`⚠️  Bill ${billId} not in cache, fetching from API...`);
      // Parse billId: "hr1234-118" -> { congress: 118, billType: "hr", billNumber: 1234 }
      const match = billId.match(/^([a-z]+)(\d+)-(\d+)$/);
      if (!match) return null;

      const [, billType, billNumber, congress] = match;
      const apiResponse = await this.congressService.getBillDetails(
        parseInt(congress),
        billType,
        parseInt(billNumber)
      );

      if (!apiResponse.success || !apiResponse.data) {
        return null;
      }

      return apiResponse.data as any;
    } catch (error) {
      console.error(`❌ Failed to get bill ${billId}:`, error);
      return null;
    }
  }

  // ============================================================================
  // Members
  // ============================================================================

  /**
   * Get all members - DB first, API fallback
   */
  async getMembers(params: {
    state?: string;
    party?: string;
    chamber?: string;
    offset?: number;
    limit?: number;
  }): Promise<{ data: Member[]; total: number; fromCache: boolean }> {
    const { state, party, chamber, offset = 0, limit = 50 } = params;

    try {
      const where: any = { currentMember: true };
      if (state) where.state = state;
      if (party) where.party = party;
      if (chamber) where.chamber = chamber;

      const [members, total] = await Promise.all([
        this.prisma.member.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: { lastName: 'asc' },
        }),
        this.prisma.member.count({ where }),
      ]);

      if (members.length > 0) {
        console.log(`✓ Retrieved ${members.length} members from database`);
        return { data: members, total, fromCache: true };
      }

      // Fallback to API
      console.log('⚠️  No members in database, fetching from API...');
      const apiResponse = await this.congressService.getMembersByState();

      if (!apiResponse.success || !apiResponse.data?.data) {
        return { data: [], total: 0, fromCache: false };
      }

      return {
        data: apiResponse.data.data as any,
        total: apiResponse.data.data.length,
        fromCache: false,
      };
    } catch (error) {
      console.error('❌ Member query failed:', error);
      return { data: [], total: 0, fromCache: false };
    }
  }

  /**
   * Get member by Bioguide ID
   */
  async getMemberById(bioguideId: string): Promise<Member | null> {
    try {
      const member = await this.prisma.member.findUnique({
        where: { bioguideId },
        include: {
          sponsoredBills: {
            orderBy: { introducedDate: 'desc' },
            take: 10,
          },
          committeeMemberships: {
            include: { committee: true },
          },
        },
      });

      if (member) {
        console.log(`✓ Retrieved member ${bioguideId} from database`);
        return member as any;
      }

      // Fallback to API
      console.log(`⚠️  Member ${bioguideId} not in cache, fetching from API...`);
      const apiResponse = await this.congressService.getMemberById(bioguideId);

      if (!apiResponse.success || !apiResponse.data) {
        return null;
      }

      return apiResponse.data as any;
    } catch (error) {
      console.error(`❌ Failed to get member ${bioguideId}:`, error);
      return null;
    }
  }

  // ============================================================================
  // Votes
  // ============================================================================

  /**
   * Get votes - DB first, API fallback
   */
  async getVotes(params: {
    congress?: number;
    chamber?: string;
    offset?: number;
    limit?: number;
  }): Promise<{ data: Vote[]; total: number; fromCache: boolean }> {
    const { congress, chamber, offset = 0, limit = 20 } = params;

    try {
      const where: any = {};
      if (congress) where.congress = congress;
      if (chamber) where.chamber = chamber;

      const [votes, total] = await Promise.all([
        this.prisma.vote.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: { voteDate: 'desc' },
        }),
        this.prisma.vote.count({ where }),
      ]);

      if (votes.length > 0) {
        console.log(`✓ Retrieved ${votes.length} votes from database`);
        return { data: votes, total, fromCache: true };
      }

      // Fallback to API
      console.log('⚠️  No votes in database, fetching from API...');
      if (!chamber || !congress) {
        return { data: [], total: 0, fromCache: false };
      }

      const apiResponse = await this.congressService.getVotes(chamber, congress);

      if (!apiResponse.success || !apiResponse.data?.data) {
        return { data: [], total: 0, fromCache: false };
      }

      return {
        data: apiResponse.data.data as any,
        total: apiResponse.data.data.length,
        fromCache: false,
      };
    } catch (error) {
      console.error('❌ Vote query failed:', error);
      return { data: [], total: 0, fromCache: false };
    }
  }

  // ============================================================================
  // Committees
  // ============================================================================

  /**
   * Get committees - DB first, API fallback
   */
  async getCommittees(params: {
    chamber?: string;
    offset?: number;
    limit?: number;
  }): Promise<{ data: Committee[]; total: number; fromCache: boolean }> {
    const { chamber, offset = 0, limit = 50 } = params;

    try {
      const where: any = {};
      if (chamber) where.chamber = chamber;

      const [committees, total] = await Promise.all([
        this.prisma.committee.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: { name: 'asc' },
        }),
        this.prisma.committee.count({ where }),
      ]);

      if (committees.length > 0) {
        console.log(`✓ Retrieved ${committees.length} committees from database`);
        return { data: committees, total, fromCache: true };
      }

      // Fallback to API
      console.log('⚠️  No committees in database, fetching from API...');
      if (!chamber) {
        return { data: [], total: 0, fromCache: false };
      }

      const apiResponse = await this.congressService.getCommittees(chamber, 118);

      if (!apiResponse.success || !apiResponse.data?.data) {
        return { data: [], total: 0, fromCache: false };
      }

      return {
        data: apiResponse.data.data as any,
        total: apiResponse.data.data.length,
        fromCache: false,
      };
    } catch (error) {
      console.error('❌ Committee query failed:', error);
      return { data: [], total: 0, fromCache: false };
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
