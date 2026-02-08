/**
 * LDA Lobbying Sync Service
 * Downloads and processes lobbying disclosure data from Senate.gov
 *
 * CRITICAL: LDA API sunset June 30, 2026
 * This service downloads bulk XML from the Senate Office of Public Records
 * Data source: https://lda.senate.gov/api/v1/filings/
 * Bulk download: https://lda.senate.gov/system/public/
 */

import { prisma } from '../lib/prisma';
import { createLogger } from '../lib/logger';

const logger = createLogger('lda-sync');

export class LdaSyncService {
  /**
   * Sync lobbying reports from LDA API
   * Downloads filings and stores them in the LobbyingReport model
   */
  async syncReports(params?: {
    filingYear?: number;
    filingType?: string;
    maxRecords?: number;
  }): Promise<{ synced: number; errors: number }> {
    const { filingYear = 2024, maxRecords = 500 } = params || {};

    logger.info(`Starting LDA sync for year ${filingYear}, max ${maxRecords}`);

    let synced = 0;
    let errors = 0;

    // The LDA API returns JSON with filing data
    // In production, we'd paginate through https://lda.senate.gov/api/v1/filings/
    // For now, this is the sync framework that will be populated with real data

    logger.info(`LDA sync complete: ${synced} synced, ${errors} errors`);
    return { synced, errors };
  }

  /**
   * Get lobbying reports for a specific bill
   */
  async getReportsByBill(billId: string, params?: { limit?: number; offset?: number }) {
    const { limit = 20, offset = 0 } = params || {};

    const bill = await prisma.bill.findUnique({
      where: { billId },
      include: {
        lobbyingReports: {
          orderBy: { filingDate: 'desc' },
          take: limit,
          skip: offset,
        },
      },
    });

    return {
      data: bill?.lobbyingReports || [],
      total: bill?.lobbyingReports.length || 0,
    };
  }

  /**
   * Search lobbying reports
   */
  async searchReports(params: {
    query?: string;
    registrant?: string;
    client?: string;
    filingYear?: number;
    limit?: number;
    offset?: number;
  }) {
    const { query, registrant, client, filingYear, limit = 20, offset = 0 } = params;

    const where: any = {};
    if (registrant) where.registrantName = { contains: registrant, mode: 'insensitive' };
    if (client) where.clientName = { contains: client, mode: 'insensitive' };
    if (filingYear) {
      const startDate = new Date(`${filingYear}-01-01`);
      const endDate = new Date(`${filingYear + 1}-01-01`);
      where.filingDate = { gte: startDate, lt: endDate };
    }
    if (query) {
      where.OR = [
        { registrantName: { contains: query, mode: 'insensitive' } },
        { clientName: { contains: query, mode: 'insensitive' } },
        { specificIssues: { contains: query, mode: 'insensitive' } },
      ];
    }

    const [reports, total] = await Promise.all([
      prisma.lobbyingReport.findMany({
        where,
        orderBy: { filingDate: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.lobbyingReport.count({ where }),
    ]);

    return { data: reports, total };
  }

  /**
   * Get lobbying spending summary by registrant
   */
  async getTopRegistrants(params?: { filingYear?: number; limit?: number }) {
    const { filingYear, limit = 20 } = params || {};

    const where: any = {};
    if (filingYear) {
      const startDate = new Date(`${filingYear}-01-01`);
      const endDate = new Date(`${filingYear + 1}-01-01`);
      where.filingDate = { gte: startDate, lt: endDate };
    }

    const topRegistrants = await prisma.lobbyingReport.groupBy({
      by: ['registrantName'],
      where: { ...where, registrantName: { not: null } },
      _sum: { incomeAmount: true },
      _count: true,
      orderBy: { _sum: { incomeAmount: 'desc' } },
      take: limit,
    });

    return topRegistrants.map(r => ({
      registrant: r.registrantName,
      totalIncome: r._sum.incomeAmount,
      filingCount: r._count,
    }));
  }

  /**
   * Get lobbying spending summary by client
   */
  async getTopClients(params?: { filingYear?: number; limit?: number }) {
    const { filingYear, limit = 20 } = params || {};

    const where: any = {};
    if (filingYear) {
      const startDate = new Date(`${filingYear}-01-01`);
      const endDate = new Date(`${filingYear + 1}-01-01`);
      where.filingDate = { gte: startDate, lt: endDate };
    }

    const topClients = await prisma.lobbyingReport.groupBy({
      by: ['clientName'],
      where: { ...where, clientName: { not: null } },
      _sum: { expenseAmount: true },
      _count: true,
      orderBy: { _sum: { expenseAmount: 'desc' } },
      take: limit,
    });

    return topClients.map(c => ({
      client: c.clientName,
      totalExpense: c._sum.expenseAmount,
      filingCount: c._count,
    }));
  }
}

export const ldaSyncService = new LdaSyncService();
