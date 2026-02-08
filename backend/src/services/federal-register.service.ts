/**
 * Federal Register Service
 * Fetches executive orders, proposed rules, and final rules
 *
 * Data source: https://www.federalregister.gov/api/v1/
 * No API key required - public API
 */

import { prisma } from '../lib/prisma';
import { createLogger } from '../lib/logger';
// cache available for future use

const logger = createLogger('federal-register');

const FR_API_BASE = 'https://www.federalregister.gov/api/v1';

interface FRDocument {
  document_number: string;
  title: string;
  type: string;
  abstract: string;
  publication_date: string;
  signing_date?: string;
  effective_on?: string;
  comments_close_on?: string;
  agencies: { name: string; raw_name: string }[];
  topics: string[];
  html_url: string;
  pdf_url: string;
  body_html_url: string;
  executive_order_number?: number;
  president?: { name: string };
  docket_ids?: string[];
  regulation_id_numbers?: { regulation_id_number: string }[];
  cfr_references?: { title: number; part: number }[];
}

class FederalRegisterService {
  /**
   * Fetch and sync executive orders from Federal Register API
   */
  async syncExecutiveOrders(params?: {
    president?: string;
    year?: number;
    maxRecords?: number;
  }): Promise<{ synced: number; errors: number }> {
    const { president, year, maxRecords = 100 } = params || {};
    logger.info('Syncing executive orders from Federal Register');

    let synced = 0;
    let errors = 0;

    try {
      const queryParams = new URLSearchParams({
        'conditions[type][]': 'PRESDOCU',
        'conditions[presidential_document_type][]': 'executive_order',
        'per_page': Math.min(maxRecords, 100).toString(),
        'order': 'newest',
      });
      if (year) queryParams.set('conditions[publication_date][year]', year.toString());

      const url = `${FR_API_BASE}/documents.json?${queryParams}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Federal Register API error: ${response.status}`);

      const data = (await response.json()) as { results?: FRDocument[] };
      const results: FRDocument[] = data.results || [];

      for (const doc of results) {
        try {
          await prisma.executiveOrder.upsert({
            where: { documentNumber: doc.document_number },
            create: {
              documentNumber: doc.document_number,
              eoNumber: doc.executive_order_number ? `EO ${doc.executive_order_number}` : null,
              title: doc.title,
              signingDate: doc.signing_date ? new Date(doc.signing_date) : null,
              publicationDate: doc.publication_date ? new Date(doc.publication_date) : null,
              president: doc.president?.name || president || null,
              abstract: doc.abstract || null,
              fullTextUrl: doc.body_html_url || null,
              pdfUrl: doc.pdf_url || null,
              federalRegisterUrl: doc.html_url || null,
              topics: doc.topics || null,
              agencies: doc.agencies?.map(a => a.name) || null,
              status: 'active',
            },
            update: {
              title: doc.title,
              abstract: doc.abstract || null,
              topics: doc.topics || null,
            },
          });
          synced++;
        } catch (error) {
          errors++;
          logger.error(`Failed to sync EO ${doc.document_number}`, error);
        }
      }
    } catch (error) {
      logger.error('Failed to fetch executive orders', error);
    }

    logger.info(`EO sync complete: ${synced} synced, ${errors} errors`);
    return { synced, errors };
  }

  /**
   * Fetch and sync regulatory rules (proposed + final)
   */
  async syncRules(params?: {
    ruleType?: 'proposed_rule' | 'final_rule' | 'notice';
    agency?: string;
    year?: number;
    maxRecords?: number;
  }): Promise<{ synced: number; errors: number }> {
    const { ruleType, agency, year, maxRecords = 100 } = params || {};
    logger.info(`Syncing regulatory rules: type=${ruleType || 'all'}`);

    let synced = 0;
    let errors = 0;

    try {
      const queryParams = new URLSearchParams({
        'per_page': Math.min(maxRecords, 100).toString(),
        'order': 'newest',
      });

      if (ruleType === 'proposed_rule') {
        queryParams.set('conditions[type][]', 'PRORULE');
      } else if (ruleType === 'final_rule') {
        queryParams.set('conditions[type][]', 'RULE');
      } else {
        queryParams.append('conditions[type][]', 'PRORULE');
        queryParams.append('conditions[type][]', 'RULE');
      }

      if (agency) queryParams.set('conditions[agencies][]', agency);
      if (year) queryParams.set('conditions[publication_date][year]', year.toString());

      const url = `${FR_API_BASE}/documents.json?${queryParams}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Federal Register API error: ${response.status}`);

      const data = (await response.json()) as { results?: FRDocument[] };
      const results: FRDocument[] = data.results || [];

      for (const doc of results) {
        try {
          const typeMap: Record<string, string> = {
            'Proposed Rule': 'proposed_rule',
            'Rule': 'final_rule',
            'Notice': 'notice',
          };

          await prisma.regulatoryRule.upsert({
            where: { documentNumber: doc.document_number },
            create: {
              documentNumber: doc.document_number,
              title: doc.title,
              ruleType: typeMap[doc.type] || doc.type,
              agency: doc.agencies?.[0]?.name || null,
              agencyAcronym: null,
              publicationDate: doc.publication_date ? new Date(doc.publication_date) : null,
              effectiveDate: doc.effective_on ? new Date(doc.effective_on) : null,
              commentEndDate: doc.comments_close_on ? new Date(doc.comments_close_on) : null,
              abstract: doc.abstract || null,
              fullTextUrl: doc.body_html_url || null,
              federalRegisterUrl: doc.html_url || null,
              docketId: doc.docket_ids?.[0] || null,
              cfr: doc.cfr_references ? JSON.parse(JSON.stringify(doc.cfr_references)) : undefined,
              topics: doc.topics || null,
            },
            update: {
              title: doc.title,
              abstract: doc.abstract || null,
              commentEndDate: doc.comments_close_on ? new Date(doc.comments_close_on) : null,
            },
          });
          synced++;
        } catch (error) {
          errors++;
          logger.error(`Failed to sync rule ${doc.document_number}`, error);
        }
      }
    } catch (error) {
      logger.error('Failed to fetch regulatory rules', error);
    }

    logger.info(`Rule sync complete: ${synced} synced, ${errors} errors`);
    return { synced, errors };
  }

  /**
   * Get executive orders with search/filter
   */
  async getExecutiveOrders(params?: {
    president?: string;
    status?: string;
    query?: string;
    limit?: number;
    offset?: number;
  }) {
    const { president, status, query, limit = 20, offset = 0 } = params || {};

    const where: any = {};
    if (president) where.president = { contains: president, mode: 'insensitive' };
    if (status) where.status = status;
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { abstract: { contains: query, mode: 'insensitive' } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.executiveOrder.findMany({
        where,
        orderBy: { signingDate: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.executiveOrder.count({ where }),
    ]);

    return { data: orders, total };
  }

  /**
   * Get regulatory rules with search/filter
   */
  async getRules(params?: {
    ruleType?: string;
    agency?: string;
    query?: string;
    openForComment?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const { ruleType, agency, query, openForComment, limit = 20, offset = 0 } = params || {};

    const where: any = {};
    if (ruleType) where.ruleType = ruleType;
    if (agency) where.agency = { contains: agency, mode: 'insensitive' };
    if (openForComment) {
      where.commentEndDate = { gte: new Date() };
    }
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { abstract: { contains: query, mode: 'insensitive' } },
      ];
    }

    const [rules, total] = await Promise.all([
      prisma.regulatoryRule.findMany({
        where,
        orderBy: { publicationDate: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.regulatoryRule.count({ where }),
    ]);

    return { data: rules, total };
  }
}

export const federalRegisterService = new FederalRegisterService();
