/**
 * Data Sync Service
 * Syncs Congressional data from Congress.gov API to PostgreSQL database
 */

import { PrismaClient } from '@prisma/client';
import { getCongressService } from './congress.service';

const prisma = new PrismaClient();
const congressService = getCongressService();

export class SyncService {
  /**
   * Sync bills from Congress.gov to database
   */
  async syncBills(congress: number, limit: number = 100): Promise<number> {
    console.log(`[Sync] Starting bill sync for Congress ${congress}...`);
    
    let synced = 0;
    let offset = 0;
    const batchSize = 20;
    
    try {
      while (synced < limit) {
        const response = await congressService.getBillsByCongress(congress, {
          offset,
          limit: batchSize,
        });
        
        if (!response.success || !response.data?.data || response.data.data.length === 0) {
          break;
        }
        
        const bills = response.data.data;
        
        for (const bill of bills) {
          try {
            await prisma.bill.upsert({
              where: {
                billId: `${bill.type}${bill.number}-${bill.congress}`,
              },
              update: {
                congress: bill.congress,
                billType: bill.type,
                billNumber: bill.number,
                title: bill.title,
                latestActionDate: bill.latestAction?.actionDate ? new Date(bill.latestAction.actionDate) : undefined,
                latestActionText: bill.latestAction?.text,
                introducedDate: bill.introducedDate ? new Date(bill.introducedDate) : undefined,
                congressGovUrl: bill.url,
                updatedAt: new Date(),
                lastSyncedAt: new Date(),
              },
              create: {
                billId: `${bill.type}${bill.number}-${bill.congress}`,
                congress: bill.congress,
                billType: bill.type,
                billNumber: bill.number,
                title: bill.title,
                latestActionDate: bill.latestAction?.actionDate ? new Date(bill.latestAction.actionDate) : undefined,
                latestActionText: bill.latestAction?.text,
                introducedDate: bill.introducedDate ? new Date(bill.introducedDate) : undefined,
                congressGovUrl: bill.url,
                lastSyncedAt: new Date(),
              },
            });
            
            synced++;
          } catch (error) {
            console.error(`[Sync] Error syncing bill ${bill.type}${bill.number}:`, error);
          }
        }
        
        offset += batchSize;
        console.log(`[Sync] Synced ${synced} bills so far...`);
        
        if (!response.data.pagination?.hasMore) {
          break;
        }
      }
      
      console.log(`[Sync] Completed bill sync: ${synced} bills synced`);
      return synced;
    } catch (error) {
      console.error('[Sync] Error syncing bills:', error);
      throw error;
    }
  }

  /**
   * Sync members from Congress.gov to database
   */
  async syncMembers(limit: number = 535): Promise<number> {
    console.log('[Sync] Starting member sync...');
    
    let synced = 0;
    let offset = 0;
    const batchSize = 20;
    
    try {
      while (synced < limit) {
        const response = await congressService.searchMembers({
          currentMember: true,
          offset,
          limit: batchSize,
        });
        
        if (!response.success || !response.data?.data || response.data.data.length === 0) {
          break;
        }
        
        const members = response.data.data;
        
        for (const member of members) {
          try {
            const names = member.name.split(' ');
            const lastName = names[names.length - 1];
            const firstName = names.slice(0, -1).join(' ');
            
            await prisma.member.upsert({
              where: {
                bioguideId: member.bioguideId,
              },
              update: {
                firstName: firstName || member.name,
                lastName: lastName || member.name,
                fullName: member.name,
                party: member.partyName.charAt(0), // D, R, I
                state: member.state,
                district: member.district,
                currentMember: true,
                updatedAt: new Date(),
                lastSyncedAt: new Date(),
              },
              create: {
                bioguideId: member.bioguideId,
                firstName: firstName || member.name,
                lastName: lastName || member.name,
                fullName: member.name,
                party: member.partyName.charAt(0),
                state: member.state,
                district: member.district,
                chamber: member.district !== undefined && member.district !== null ? 'house' : 'senate',
                currentMember: true,
                lastSyncedAt: new Date(),
              },
            });
            
            synced++;
          } catch (error) {
            console.error(`[Sync] Error syncing member ${member.bioguideId}:`, error);
          }
        }
        
        offset += batchSize;
        console.log(`[Sync] Synced ${synced} members so far...`);
        
        if (!response.data.pagination?.hasMore) {
          break;
        }
      }
      
      console.log(`[Sync] Completed member sync: ${synced} members synced`);
      return synced;
    } catch (error) {
      console.error('[Sync] Error syncing members:', error);
      throw error;
    }
  }

  /**
   * Sync votes from Congress.gov to database
   */
  async syncVotes(congress: number, chamber: string, limit: number = 100): Promise<number> {
    console.log(`[Sync] Starting vote sync for Congress ${congress}, ${chamber}...`);
    
    let synced = 0;
    let offset = 0;
    const batchSize = 20;
    
    try {
      while (synced < limit) {
        const response = await congressService.searchVotes({
          congress,
          chamber,
          offset,
          limit: batchSize,
        });
        
        if (!response.success || !response.data?.data || response.data.data.length === 0) {
          break;
        }
        
        const votes = response.data.data;
        
        for (const vote of votes) {
          try {
            await prisma.vote.upsert({
              where: {
                voteId: `${chamber.charAt(0)}${vote.rollNumber}-${vote.congress}`,
              },
              update: {
                congress: vote.congress,
                chamber: chamber,
                rollNumber: vote.rollNumber,
                voteDate: new Date(vote.date),
                voteQuestion: vote.question,
                voteResult: vote.result,
                yeaTotal: vote.votes?.yea,
                nayTotal: vote.votes?.nay,
                presentTotal: vote.votes?.present,
                notVotingTotal: vote.votes?.notVoting,
                updatedAt: new Date(),
              },
              create: {
                voteId: `${chamber.charAt(0)}${vote.rollNumber}-${vote.congress}`,
                congress: vote.congress,
                chamber: chamber,
                rollNumber: vote.rollNumber,
                voteDate: new Date(vote.date),
                voteQuestion: vote.question,
                voteResult: vote.result,
                yeaTotal: vote.votes?.yea,
                nayTotal: vote.votes?.nay,
                presentTotal: vote.votes?.present,
                notVotingTotal: vote.votes?.notVoting,
              },
            });
            
            synced++;
          } catch (error) {
            console.error(`[Sync] Error syncing vote ${vote.rollNumber}:`, error);
          }
        }
        
        offset += batchSize;
        console.log(`[Sync] Synced ${synced} votes so far...`);
        
        if (!response.data.pagination?.hasMore) {
          break;
        }
      }
      
      console.log(`[Sync] Completed vote sync: ${synced} votes synced`);
      return synced;
    } catch (error) {
      console.error('[Sync] Error syncing votes:', error);
      throw error;
    }
  }

  /**
   * Run initial sync for all data
   */
  async runInitialSync(): Promise<void> {
    console.log('=== Starting Initial Data Sync ===');
    
    try {
      // Sync current members
      await this.syncMembers(535);
      
      // Sync 118th Congress bills (current)
      await this.syncBills(118, 200);
      
      // Sync recent House votes
      await this.syncVotes(118, 'house', 50);
      
      // Sync recent Senate votes
      await this.syncVotes(118, 'senate', 50);
      
      console.log('=== Initial Data Sync Complete ===');
    } catch (error) {
      console.error('=== Initial Data Sync Failed ===', error);
      throw error;
    }
  }
}

export const syncService = new SyncService();

// CLI command to run sync
if (require.main === module) {
  syncService.runInitialSync()
    .then(() => {
      console.log('Sync completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Sync failed:', error);
      process.exit(1);
    });
}
