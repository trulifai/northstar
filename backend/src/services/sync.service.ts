/**
 * Database Sync Service
 * Full sync from Congress.gov API to PostgreSQL with incremental support
 */

import { PrismaClient } from '@prisma/client';
import { CongressService } from './congress.service';
import config from '../config';
import { runtimeConfig } from '../config/runtime';
import { createLogger } from '../lib/logger';

const logger = createLogger('sync-service');

interface SyncOptions {
  congress?: number;
  maxItems?: number;       // 0 = unlimited
  fromDateTime?: string;   // ISO date for incremental sync
  delayMs?: number;        // Rate limit delay between API calls
}

interface SyncResult {
  entity: string;
  synced: number;
  errors: number;
  duration: number;
  note?: string;
}

interface SyncRecentOptions {
  congress?: number;
  fromDateTime?: string;
  delayMs?: number;
  billsMaxItems?: number;
  houseVotesMaxItems?: number;
  senateVotesMaxItems?: number;
  billDetailsBatchSize?: number;
}

export class SyncService {
  private readonly prisma: PrismaClient;
  private readonly congressService: CongressService | null;
  private readonly defaultCongress = this.getCurrentCongress();
  private readonly defaultDelay = 500; // 500ms between requests to respect rate limits

  constructor() {
    this.prisma = new PrismaClient();
    this.congressService = runtimeConfig.providers.congressGov
      ? new CongressService(config.apiKeys.congressGov, true)
      : null;
  }

  /**
   * Full sync - all entities
   */
  async syncAll(options: SyncOptions = {}): Promise<SyncResult[]> {
    logger.info('Starting full database sync...', options);
    const results: SyncResult[] = [];

    try {
      results.push(await this.syncMembers(options));
      results.push(await this.syncBills(options));
      results.push(await this.syncCommittees(options));
      results.push(await this.syncVotes({ ...options, chamber: 'house' }));
      results.push(await this.syncVotes({ ...options, chamber: 'senate' }));

      logger.info('Full sync completed', { results });
      return results;
    } catch (error) {
      logger.error('Full sync failed', error);
      throw error;
    }
  }

  /**
   * Sync Members of Congress with full pagination
   */
  async syncMembers(options: SyncOptions = {}): Promise<SyncResult> {
    const startTime = Date.now();
    if (!this.congressService) return this.providerDisabledResult('members', startTime);

    const { maxItems = 0, delayMs = this.defaultDelay } = options;
    let totalSynced = 0;
    let errors = 0;
    let offset = 0;
    const limit = 250; // Congress.gov max per page

    logger.info('Syncing members...');

    try {
      let hasMore = true;

      while (hasMore) {
        if (maxItems > 0 && totalSynced >= maxItems) break;

        const response = await this.congressService.searchMembers({
          currentMember: true,
          limit,
          offset,
        });

        if (!response.success || !response.data?.data?.length) break;

        const members = response.data.data;

        for (const member of members) {
          if (maxItems > 0 && totalSynced >= maxItems) {
            hasMore = false;
            break;
          }

          try {
            await this.prisma.member.upsert({
              where: { bioguideId: member.bioguideId },
              update: {
                firstName: member.firstName || '',
                lastName: member.lastName || '',
                fullName: member.fullName || `${member.firstName} ${member.lastName}`,
                party: member.party || '',
                state: member.state || '',
                district: member.district || null,
                chamber: member.chamber || '',
                currentMember: true,
                lastSyncedAt: new Date(),
              },
              create: {
                bioguideId: member.bioguideId,
                firstName: member.firstName || '',
                lastName: member.lastName || '',
                fullName: member.fullName || `${member.firstName} ${member.lastName}`,
                party: member.party || '',
                state: member.state || '',
                district: member.district || null,
                chamber: member.chamber || '',
                currentMember: true,
                lastSyncedAt: new Date(),
              },
            });
            totalSynced++;
          } catch (err) {
            errors++;
            logger.warn(`Failed to sync member ${member.bioguideId}`, err);
          }
        }

        hasMore = response.data.pagination.hasMore;
        offset += limit;
        logger.info(`Synced ${totalSynced} members so far...`);

        if (hasMore) await this.delay(delayMs);
      }
    } catch (error) {
      logger.error('Member sync failed', error);
      throw error;
    }

    const result = { entity: 'members', synced: totalSynced, errors, duration: Date.now() - startTime };
    logger.info('Member sync completed', result);
    return result;
  }

  /**
   * Sync Bills with full pagination and relationship data
   */
  async syncBills(options: SyncOptions = {}): Promise<SyncResult> {
    const startTime = Date.now();
    if (!this.congressService) return this.providerDisabledResult('bills', startTime);

    const {
      congress = this.defaultCongress,
      maxItems = 0,
      fromDateTime,
      delayMs = this.defaultDelay,
    } = options;
    let totalSynced = 0;
    let errors = 0;
    let offset = 0;
    const limit = 250;

    logger.info(`Syncing bills for Congress ${congress}...`, { fromDateTime });

    try {
      let hasMore = true;

      while (hasMore) {
        if (maxItems > 0 && totalSynced >= maxItems) break;

        const searchParams: any = { congress, offset, limit };
        if (fromDateTime) {
          searchParams.fromDateTime = fromDateTime;
        }

        const response = await this.congressService.searchBills(searchParams);

        if (!response.success || !response.data?.data?.length) break;

        const bills = response.data.data;

        for (const billData of bills) {
          if (maxItems > 0 && totalSynced >= maxItems) {
            hasMore = false;
            break;
          }

          try {
            const billType = (billData.type?.toLowerCase() || '').replace(/\./g, '');
            const parsedBillNumber =
              typeof billData.number === 'number'
                ? billData.number
                : parseInt(String(billData.number || ''), 10);

            if (!Number.isFinite(parsedBillNumber) || parsedBillNumber <= 0 || !billType) {
              errors++;
              logger.warn(`Skipping bill with invalid identifier`, {
                type: billData.type,
                number: billData.number,
              });
              continue;
            }

            const billNumber = parsedBillNumber;
            const billId = `${billType}${billNumber}-${congress}`;

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
          } catch (err) {
            errors++;
            logger.warn(`Failed to sync bill ${billData.number}`, err);
          }
        }

        hasMore = response.data.pagination.hasMore;
        offset += limit;
        logger.info(`Synced ${totalSynced} bills so far...`);

        if (hasMore) await this.delay(delayMs);
      }
    } catch (error) {
      logger.error('Bill sync failed', error);
      throw error;
    }

    const result = { entity: 'bills', synced: totalSynced, errors, duration: Date.now() - startTime };
    logger.info('Bill sync completed', result);
    return result;
  }

  /**
   * Sync bill details (cosponsors, actions, subjects) for bills already in DB
   */
  async syncBillDetails(options: SyncOptions & { batchSize?: number } = {}): Promise<SyncResult> {
    const startTime = Date.now();
    if (!this.congressService) return this.providerDisabledResult('bill-details', startTime);

    const { batchSize = 50, delayMs = this.defaultDelay } = options;
    let totalSynced = 0;
    let errors = 0;

    logger.info('Syncing bill details (cosponsors, actions, subjects)...');

    // Get bills that need detail sync (no sponsor info yet)
    const bills = await this.prisma.bill.findMany({
      where: { sponsorBioguideId: null },
      select: { billId: true, congress: true, billType: true, billNumber: true },
      take: batchSize,
      orderBy: { latestActionDate: 'desc' },
    });

    for (const bill of bills) {
      try {
        // Fetch full bill details from Congress.gov
        const detailResponse = await this.congressService.getBillDetails(
          bill.congress, bill.billType, bill.billNumber
        );

        if (!detailResponse.success || !detailResponse.data) continue;

        const details = detailResponse.data;

        // Update bill with sponsor and policy area
        const sponsor = details.sponsors?.[0];
        await this.prisma.bill.update({
          where: { billId: bill.billId },
          data: {
            sponsorBioguideId: sponsor?.bioguideId || null,
            policyArea: details.policyArea?.name || null,
            status: this.inferStatus(details),
            lastSyncedAt: new Date(),
          },
        });

        // Sync cosponsors
        if (details.cosponsors?.length) {
          await this.syncCosponsorsForBill(bill.billId, details.cosponsors);
        }

        // Sync actions
        if (details.actions?.length) {
          await this.syncActionsForBill(bill.billId, details.actions);
        }

        totalSynced++;
        await this.delay(delayMs);
      } catch (err) {
        errors++;
        logger.warn(`Failed to sync details for ${bill.billId}`, err);
      }
    }

    const result = { entity: 'bill-details', synced: totalSynced, errors, duration: Date.now() - startTime };
    logger.info('Bill detail sync completed', result);
    return result;
  }

  private async syncCosponsorsForBill(billId: string, cosponsors: any[]): Promise<void> {
    for (const cosponsor of cosponsors) {
      if (!cosponsor.bioguideId) continue;
      try {
        await this.prisma.cosponsor.upsert({
          where: {
            billId_memberBioguideId: { billId, memberBioguideId: cosponsor.bioguideId },
          },
          update: {
            sponsoredDate: cosponsor.sponsorshipDate ? new Date(cosponsor.sponsorshipDate) : null,
            isOriginalCosponsor: cosponsor.isOriginalCosponsor || false,
          },
          create: {
            billId,
            memberBioguideId: cosponsor.bioguideId,
            sponsoredDate: cosponsor.sponsorshipDate ? new Date(cosponsor.sponsorshipDate) : null,
            isOriginalCosponsor: cosponsor.isOriginalCosponsor || false,
          },
        });
      } catch {
        // Member may not exist in DB yet; skip
      }
    }
  }

  private async syncActionsForBill(billId: string, actions: any[]): Promise<void> {
    // Delete existing actions and re-insert (simpler than diff)
    await this.prisma.billAction.deleteMany({ where: { billId } });

    for (const action of actions) {
      try {
        await this.prisma.billAction.create({
          data: {
            billId,
            actionDate: new Date(action.actionDate),
            actionTime: action.actionTime || null,
            actionText: action.text || '',
            actionCode: action.actionCode || null,
            chamber: action.sourceSystem?.name?.toLowerCase()?.includes('senate') ? 'senate'
              : action.sourceSystem?.name?.toLowerCase()?.includes('house') ? 'house'
              : null,
            actionType: action.type || null,
          },
        });
      } catch {
        // Skip individual action errors
      }
    }
  }

  /**
   * Sync Committees (House + Senate)
   */
  async syncCommittees(options: SyncOptions = {}): Promise<SyncResult> {
    const startTime = Date.now();
    if (!this.congressService) return this.providerDisabledResult('committees', startTime);

    const { maxItems = 0, delayMs = this.defaultDelay } = options;
    let totalSynced = 0;
    let errors = 0;

    logger.info('Syncing committees...');

    try {
      for (const chamber of ['house', 'senate'] as const) {
        let offset = 0;
        let hasMore = true;

        while (hasMore) {
          const response = await this.congressService.getCommittees(chamber, { offset, limit: 250 });

          if (!response.success || !response.data?.data?.length) break;

          for (const committee of response.data.data) {
            if (maxItems > 0 && totalSynced >= maxItems) {
              hasMore = false;
              break;
            }

            try {
              const code = committee.systemCode || committee.name;
              await this.prisma.committee.upsert({
                where: { committeeCode: code },
                update: {
                  name: committee.name || '',
                  chamber,
                  committeeType: committee.committeeType || null,
                },
                create: {
                  committeeCode: code,
                  name: committee.name || '',
                  chamber,
                  committeeType: committee.committeeType || null,
                },
              });
              totalSynced++;
            } catch (err) {
              errors++;
              logger.warn(`Failed to sync committee`, err);
            }
          }

          hasMore = response.data.pagination.hasMore;
          offset += 250;
          if (hasMore) await this.delay(delayMs);
        }
      }
    } catch (error) {
      logger.error('Committee sync failed', error);
      throw error;
    }

    const result = { entity: 'committees', synced: totalSynced, errors, duration: Date.now() - startTime };
    logger.info('Committee sync completed', result);
    return result;
  }

  /**
   * Sync Votes for a specific chamber with full pagination
   */
  async syncVotes(options: SyncOptions & { chamber?: string } = {}): Promise<SyncResult> {
    const startTime = Date.now();
    if (!this.congressService) return this.providerDisabledResult(`votes-${options.chamber || 'house'}`, startTime);

    const {
      congress = this.defaultCongress,
      chamber = 'house',
      maxItems = 0,
      delayMs = this.defaultDelay,
    } = options;
    let totalSynced = 0;
    let errors = 0;
    let offset = 0;
    const limit = 250;

    logger.info(`Syncing ${chamber} votes for Congress ${congress}...`);

    try {
      let hasMore = true;

      while (hasMore) {
        if (maxItems > 0 && totalSynced >= maxItems) break;

        const response = await this.congressService.searchVotes({
          congress,
          chamber: chamber as any,
          limit,
          offset,
        });

        if (!response.success || !response.data?.data?.length) break;

        const votes = response.data.data;
        const prefix = chamber === 'house' ? 'h' : 's';

        for (const vote of votes) {
          if (maxItems > 0 && totalSynced >= maxItems) {
            hasMore = false;
            break;
          }

          try {
            const voteId = `${prefix}${vote.rollNumber}-${congress}`;

            await this.prisma.vote.upsert({
              where: { voteId },
              update: {
                voteDate: vote.date ? new Date(vote.date) : new Date(),
                voteQuestion: vote.question || null,
                voteResult: vote.result || null,
                yeaTotal: vote.votes?.yea || null,
                nayTotal: vote.votes?.nay || null,
                presentTotal: vote.votes?.present || null,
                notVotingTotal: vote.votes?.notVoting || null,
                democratYea: vote.party?.democratic?.yea || null,
                democratNay: vote.party?.democratic?.nay || null,
                republicanYea: vote.party?.republican?.yea || null,
                republicanNay: vote.party?.republican?.nay || null,
                independentYea: vote.party?.independent?.yea || null,
                independentNay: vote.party?.independent?.nay || null,
              },
              create: {
                voteId,
                congress,
                chamber,
                rollNumber: vote.rollNumber || 0,
                voteDate: vote.date ? new Date(vote.date) : new Date(),
                voteQuestion: vote.question || null,
                voteResult: vote.result || null,
                yeaTotal: vote.votes?.yea || null,
                nayTotal: vote.votes?.nay || null,
                presentTotal: vote.votes?.present || null,
                notVotingTotal: vote.votes?.notVoting || null,
                democratYea: vote.party?.democratic?.yea || null,
                democratNay: vote.party?.democratic?.nay || null,
                republicanYea: vote.party?.republican?.yea || null,
                republicanNay: vote.party?.republican?.nay || null,
                independentYea: vote.party?.independent?.yea || null,
                independentNay: vote.party?.independent?.nay || null,
              },
            });

            totalSynced++;
          } catch (err) {
            errors++;
            logger.warn(`Failed to sync vote`, err);
          }
        }

        hasMore = response.data.pagination.hasMore;
        offset += limit;
        logger.info(`Synced ${totalSynced} ${chamber} votes so far...`);

        if (hasMore) await this.delay(delayMs);
      }
    } catch (error) {
      logger.error(`${chamber} vote sync failed`, error);
      throw error;
    }

    const result = { entity: `votes-${chamber}`, synced: totalSynced, errors, duration: Date.now() - startTime };
    logger.info(`${chamber} vote sync completed`, result);
    return result;
  }

  /**
   * Incremental sync - only recent updates since last sync
   */
  async syncRecent(options: SyncRecentOptions = {}): Promise<SyncResult[]> {
    if (!this.congressService) {
      return [this.providerDisabledResult('recent-sync', Date.now())];
    }

    logger.info('Starting incremental sync...');
    const results: SyncResult[] = [];
    const congress = options.congress || this.defaultCongress;
    const delayMs = options.delayMs || this.defaultDelay;

    // Find the latest sync timestamp
    const lastBill = await this.prisma.bill.findFirst({
      orderBy: { lastSyncedAt: 'desc' },
      select: { lastSyncedAt: true },
    });

    const inferredFromDateTime = lastBill?.lastSyncedAt
      ? lastBill.lastSyncedAt.toISOString().split('T')[0]
      : undefined;
    const fromDateTime = options.fromDateTime || inferredFromDateTime;

    const billsMaxItems = options.billsMaxItems ?? 500;
    const houseVotesMaxItems = options.houseVotesMaxItems ?? 100;
    const senateVotesMaxItems = options.senateVotesMaxItems ?? 0;
    const billDetailsBatchSize = options.billDetailsBatchSize ?? 25;

    // Sync recent bills
    if (billsMaxItems > 0) {
      results.push(await this.syncBills({ congress, fromDateTime, maxItems: billsMaxItems, delayMs }));
    } else {
      results.push(this.skippedResult('bills', 'disabled by sync limits'));
    }

    // Sync recent votes (both chambers)
    if (houseVotesMaxItems > 0) {
      results.push(await this.syncVotes({ congress, chamber: 'house', maxItems: houseVotesMaxItems, delayMs }));
    } else {
      results.push(this.skippedResult('votes-house', 'disabled by sync limits'));
    }

    if (senateVotesMaxItems > 0) {
      results.push(await this.syncVotes({ congress, chamber: 'senate', maxItems: senateVotesMaxItems, delayMs }));
    } else {
      results.push(this.skippedResult('votes-senate', 'disabled by sync limits'));
    }

    // Sync bill details for recent bills
    if (billDetailsBatchSize > 0) {
      results.push(await this.syncBillDetails({ batchSize: billDetailsBatchSize, delayMs }));
    } else {
      results.push(this.skippedResult('bill-details', 'disabled by sync limits'));
    }

    logger.info('Incremental sync completed', {
      options: {
        congress,
        fromDateTime,
        delayMs,
        billsMaxItems,
        houseVotesMaxItems,
        senateVotesMaxItems,
        billDetailsBatchSize,
      },
      results,
    });
    return results;
  }

  private inferStatus(details: any): string {
    const lastAction = details.latestAction?.text?.toLowerCase() || '';
    if (lastAction.includes('became public law') || lastAction.includes('signed by president')) return 'became_law';
    if (lastAction.includes('vetoed')) return 'vetoed';
    if (lastAction.includes('passed senate')) return 'passed_senate';
    if (lastAction.includes('passed house')) return 'passed_house';
    if (lastAction.includes('reported')) return 'reported';
    if (lastAction.includes('referred to')) return 'referred';
    return 'introduced';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private providerDisabledResult(entity: string, startTime: number): SyncResult {
    logger.warn(`Skipping ${entity} sync because Congress.gov integration is disabled.`);
    return {
      entity,
      synced: 0,
      errors: 0,
      duration: Date.now() - startTime,
      note: 'provider disabled',
    };
  }

  private skippedResult(entity: string, reason: string): SyncResult {
    return {
      entity,
      synced: 0,
      errors: 0,
      duration: 0,
      note: reason,
    };
  }

  private getCurrentCongress(): number {
    const currentYear = new Date().getFullYear();
    return Math.floor((currentYear - 1789) / 2) + 1;
  }

  async close(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
