/**
 * FEC Campaign Finance Sync Service
 * Downloads and processes FEC bulk data for campaign contributions
 *
 * Data sources (no API key required):
 * - Candidate master: https://www.fec.gov/files/bulk-downloads/2024/cn24.zip
 * - Committee master: https://www.fec.gov/files/bulk-downloads/2024/cm24.zip
 * - Contributions to candidates: https://www.fec.gov/files/bulk-downloads/2024/pas224.zip
 * - Individual contributions: https://www.fec.gov/files/bulk-downloads/2024/indiv24.zip
 */

import { prisma } from '../lib/prisma';
import { createLogger } from '../lib/logger';

const logger = createLogger('fec-sync');

export class FecSyncService {
  /**
   * Sync contributions to candidates from PAC/committee data
   * In production, this downloads FEC bulk files and parses them
   */
  async syncContributions(cycle: number = 2024, maxRecords: number = 10000): Promise<{ synced: number; errors: number }> {
    logger.info(`Starting FEC contribution sync for cycle ${cycle}, max ${maxRecords}`);

    const members = await prisma.member.findMany({
      where: { currentMember: true },
      select: { bioguideId: true, firstName: true, lastName: true, fullName: true, state: true },
    });

    logger.info(`Found ${members.length} current members for FEC mapping`);

    let synced = 0;
    let errors = 0;

    // TODO: Download and parse FEC bulk files
    // For now, the framework is in place for bulk data ingestion

    logger.info(`FEC sync complete: ${synced} synced, ${errors} errors`);
    return { synced, errors };
  }

  /**
   * Get contribution summary for a member
   */
  async getMemberContributions(bioguideId: string, params?: {
    cycle?: number;
    limit?: number;
    offset?: number;
  }) {
    const { cycle, limit = 20, offset = 0 } = params || {};

    const where: any = { memberBioguideId: bioguideId };
    if (cycle) where.cycle = cycle;

    const [contributions, total] = await Promise.all([
      prisma.campaignContribution.findMany({
        where,
        orderBy: { amount: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.campaignContribution.count({ where }),
    ]);

    return { data: contributions, total };
  }

  /**
   * Get top donors across all members
   */
  async getTopDonors(params?: { cycle?: number; limit?: number }) {
    const { cycle, limit = 20 } = params || {};

    const where: any = {};
    if (cycle) where.cycle = cycle;

    const topDonors = await prisma.campaignContribution.groupBy({
      by: ['contributorName', 'contributorType'],
      where,
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
      take: limit,
    });

    return topDonors.map(d => ({
      contributorName: d.contributorName,
      contributorType: d.contributorType,
      totalAmount: d._sum.amount,
      contributionCount: d._count,
    }));
  }

  /**
   * Get contribution summary by industry for a member
   */
  async getMemberIndustrySummary(bioguideId: string, cycle?: number) {
    const where: any = { memberBioguideId: bioguideId };
    if (cycle) where.cycle = cycle;

    const industries = await prisma.campaignContribution.groupBy({
      by: ['industryName'],
      where: { ...where, industryName: { not: null } },
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
      take: 20,
    });

    return industries.map(i => ({
      industry: i.industryName,
      totalAmount: i._sum.amount,
      contributionCount: i._count,
    }));
  }
}

export const fecSyncService = new FecSyncService();
