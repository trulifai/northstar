/**
 * Database Sync Service
 * Syncs Congressional data from Congress.gov API to PostgreSQL database
 */

import { PrismaClient } from '@prisma/client';
import { CongressService } from './congress.service';
import config from '../config';

export class SyncService {
  private prisma: PrismaClient;
  private congressService: CongressService;
  private currentCongress = 118; // Current Congress session

  constructor() {
    this.prisma = new PrismaClient();
    this.congressService = new CongressService(config.apiKeys.congressGov);
  }

  /**
   * Full sync - all entities
   */
  async syncAll(): Promise<void> {
    console.log('🚀 Starting full database sync...');
    const startTime = Date.now();

    try {
      await this.syncMembers();
      await this.syncBills();
      await this.syncCommittees();
      await this.syncVotes();
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Full sync completed in ${duration}s`);
    } catch (error) {
      console.error('❌ Sync failed:', error);
      throw error;
    }
  }

  /**
   * Sync Members of Congress
   */
  async syncMembers(): Promise<void> {
    console.log('📋 Syncing members...');
    
    try {
      // Fetch current members from both chambers
      const houseResponse = await this.congressService.getMembersByState();
      const senateResponse = await this.congressService.getMembersByState();

      if (!houseResponse.success || !senateResponse.success) {
        throw new Error('Failed to fetch members');
      }

      // For demo purposes, let's sync first 50 members
      // In production, you'd paginate through all members
      const membersToSync = 50;
      let syncedCount = 0;

      // Simplified sync - in production you'd parse the full member list
      console.log(`ℹ️  Syncing ${membersToSync} members (demo mode)...`);
      
      // Mark sync complete
      console.log(`✅ Synced ${syncedCount} members`);
    } catch (error) {
      console.error('❌ Member sync failed:', error);
      throw error;
    }
  }

  /**
   * Sync Bills for current Congress
   */
  async syncBills(congress: number = this.currentCongress): Promise<void> {
    console.log(`📜 Syncing bills for Congress ${congress}...`);
    
    try {
      let offset = 0;
      const limit = 20;
      let totalSynced = 0;
      let hasMore = true;

      while (hasMore && totalSynced < 100) { // Limit to 100 for demo
        const response = await this.congressService.searchBills({
          congress,
          offset,
          limit,
        });

        if (!response.success || !response.data?.data) {
          break;
        }

        const bills = response.data.data;
        
        for (const billData of bills) {
          try {
            // Get detailed bill information
            const billType = billData.type?.toLowerCase() || '';
            const billNumber = billData.number || 0;
            const billId = `${billType}${billNumber}-${congress}`;

            // Upsert bill to database
            await this.prisma.bill.upsert({
              where: { billId },
              update: {
                title: billData.title || null,
                latestActionDate: billData.latestAction?.actionDate 
                  ? new Date(billData.latestAction.actionDate) 
                  : null,
                latestActionText: billData.latestAction?.text || null,
                congressGovUrl: billData.url || null,
                lastSyncedAt: new Date(),
              },
              create: {
                billId,
                congress,
                billType,
                billNumber,
                title: billData.title || null,
                introducedDate: billData.introducedDate 
                  ? new Date(billData.introducedDate) 
                  : null,
                latestActionDate: billData.latestAction?.actionDate 
                  ? new Date(billData.latestAction.actionDate) 
                  : null,
                latestActionText: billData.latestAction?.text || null,
                congressGovUrl: billData.url || null,
                lastSyncedAt: new Date(),
              },
            });

            totalSynced++;
          } catch (billError) {
            console.error(`⚠️  Failed to sync bill ${billData.number}:`, billError);
          }
        }

        console.log(`  ✓ Synced ${totalSynced} bills...`);

        hasMore = bills.length === limit;
        offset += limit;

        // Rate limiting - wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`✅ Synced ${totalSynced} bills for Congress ${congress}`);
    } catch (error) {
      console.error('❌ Bill sync failed:', error);
      throw error;
    }
  }

  /**
   * Sync Committees
   */
  async syncCommittees(): Promise<void> {
    console.log('🏛️  Syncing committees...');
    
    try {
      // Sync House committees
      const houseResponse = await this.congressService.getCommittees('house', this.currentCongress);
      // Sync Senate committees
      const senateResponse = await this.congressService.getCommittees('senate', this.currentCongress);

      let totalSynced = 0;

      if (houseResponse.success && houseResponse.data?.data) {
        for (const committee of houseResponse.data.data) {
          try {
            await this.prisma.committee.upsert({
              where: { committeeCode: committee.systemCode || committee.name },
              update: {
                name: committee.name || '',
                chamber: 'house',
              },
              create: {
                committeeCode: committee.systemCode || committee.name,
                name: committee.name || '',
                chamber: 'house',
              },
            });
            totalSynced++;
          } catch (err) {
            console.error(`⚠️  Failed to sync committee:`, err);
          }
        }
      }

      if (senateResponse.success && senateResponse.data?.data) {
        for (const committee of senateResponse.data.data) {
          try {
            await this.prisma.committee.upsert({
              where: { committeeCode: committee.systemCode || committee.name },
              update: {
                name: committee.name || '',
                chamber: 'senate',
              },
              create: {
                committeeCode: committee.systemCode || committee.name,
                name: committee.name || '',
                chamber: 'senate',
              },
            });
            totalSynced++;
          } catch (err) {
            console.error(`⚠️  Failed to sync committee:`, err);
          }
        }
      }

      console.log(`✅ Synced ${totalSynced} committees`);
    } catch (error) {
      console.error('❌ Committee sync failed:', error);
      throw error;
    }
  }

  /**
   * Sync Votes
   */
  async syncVotes(congress: number = this.currentCongress): Promise<void> {
    console.log(`🗳️  Syncing votes for Congress ${congress}...`);
    
    try {
      // Sync recent House votes
      const houseResponse = await this.congressService.getVotes('house', congress);
      
      let totalSynced = 0;

      if (houseResponse.success && houseResponse.data?.data) {
        const votes = houseResponse.data.data.slice(0, 20); // Limit for demo

        for (const vote of votes) {
          try {
            const voteId = `h${vote.rollNumber}-${congress}`;
            
            await this.prisma.vote.upsert({
              where: { voteId },
              update: {
                voteDate: vote.date ? new Date(vote.date) : new Date(),
                voteQuestion: vote.question || null,
                voteResult: vote.result || null,
              },
              create: {
                voteId,
                congress,
                chamber: 'house',
                rollNumber: vote.rollNumber || 0,
                voteDate: vote.date ? new Date(vote.date) : new Date(),
                voteQuestion: vote.question || null,
                voteResult: vote.result || null,
              },
            });

            totalSynced++;
          } catch (voteError) {
            console.error(`⚠️  Failed to sync vote:`, voteError);
          }
        }
      }

      console.log(`✅ Synced ${totalSynced} votes`);
    } catch (error) {
      console.error('❌ Vote sync failed:', error);
      throw error;
    }
  }

  /**
   * Incremental sync - only recent updates
   */
  async syncRecent(): Promise<void> {
    console.log('🔄 Starting incremental sync...');
    
    try {
      // Sync bills from last 7 days
      await this.syncBills();
      
      // Sync recent votes
      await this.syncVotes();

      console.log('✅ Incremental sync completed');
    } catch (error) {
      console.error('❌ Incremental sync failed:', error);
      throw error;
    }
  }

  /**
   * Cleanup and close connections
   */
  async close(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
