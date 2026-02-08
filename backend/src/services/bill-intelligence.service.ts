/**
 * Bill Intelligence Service
 * Heuristic-based bill analysis: passage prediction, bipartisan scoring
 */

import { prisma } from '../lib/prisma';
import { geminiService } from './gemini.service';
import { createLogger } from '../lib/logger';
import { cache, CacheTTL, buildCacheKey } from '../lib/cache';

const logger = createLogger('bill-intelligence');

export interface BillIntelligence {
  billId: string;
  aiSummary: string | null;
  keyPoints: string[] | null;
  passageProbability: number | null;
  bipartisanScore: number | null;
  topics: string[] | null;
  generatedAt: string;
}

class BillIntelligenceService {
  /**
   * Get complete intelligence for a bill (summary + prediction + scoring)
   */
  async getIntelligence(billId: string): Promise<BillIntelligence> {
    const cacheKey = buildCacheKey('intelligence', billId);
    const cached = cache.get<BillIntelligence>(cacheKey);
    if (cached) return cached;

    const bill = await prisma.bill.findUnique({
      where: { billId },
      include: {
        cosponsors: { include: { member: true } },
        actions: true,
        sponsor: true,
      },
    });

    if (!bill) {
      return {
        billId,
        aiSummary: null,
        keyPoints: null,
        passageProbability: null,
        bipartisanScore: null,
        topics: null,
        generatedAt: new Date().toISOString(),
      };
    }

    // Compute heuristic scores synchronously
    const passageProbability = this.computePassageProbability(bill);
    const bipartisanScore = this.computeBipartisanScore(bill);

    // AI features (may not be configured)
    let aiSummary: string | null = bill.aiSummary;
    let keyPoints: string[] | null = null;
    let topics: string[] | null = null;

    if (geminiService.isConfigured) {
      try {
        const [summary, points, topicList] = await Promise.all([
          aiSummary ? Promise.resolve(aiSummary) : geminiService.summarizeBill({
            billId: bill.billId,
            title: bill.title || '',
            officialTitle: bill.officialTitle,
            summaryText: bill.summaryText,
            latestActionText: bill.latestActionText,
            policyArea: bill.policyArea,
            status: bill.status,
          }),
          geminiService.extractKeyPoints({
            billId: bill.billId,
            title: bill.title || '',
            summaryText: bill.summaryText,
            officialTitle: bill.officialTitle,
          }),
          geminiService.classifyTopics({
            billId: bill.billId,
            title: bill.title || '',
            summaryText: bill.summaryText,
            policyArea: bill.policyArea,
          }),
        ]);

        aiSummary = summary;
        keyPoints = points;
        topics = topicList;

        // Persist summary to DB if newly generated
        if (!bill.aiSummary && aiSummary) {
          await prisma.bill.update({
            where: { billId },
            data: {
              aiSummary,
              passageProbability,
              bipartisanScore,
            },
          }).catch(err => logger.error('Failed to persist AI summary', err));
        }
      } catch (error) {
        logger.warn(`AI features unavailable for ${billId}`, error);
      }
    }

    // Persist heuristic scores even without AI
    if (bill.passageProbability === null || bill.bipartisanScore === null) {
      await prisma.bill.update({
        where: { billId },
        data: { passageProbability, bipartisanScore },
      }).catch(err => logger.error('Failed to persist scores', err));
    }

    const intelligence: BillIntelligence = {
      billId,
      aiSummary,
      keyPoints,
      passageProbability,
      bipartisanScore,
      topics,
      generatedAt: new Date().toISOString(),
    };

    cache.set(cacheKey, intelligence, CacheTTL.HOUR);
    return intelligence;
  }

  /**
   * Heuristic passage probability (0-100)
   * Based on: cosponsor count, bipartisan support, committee activity, bill type, sponsor seniority
   */
  computePassageProbability(bill: {
    cosponsors: { member: { party: string } }[];
    actions: { actionText: string; actionType?: string | null }[];
    sponsor?: { party: string; termsServed: number } | null;
    billType: string;
    status?: string | null;
  }): number {
    let score = 5; // Base probability

    // Already passed? High probability
    const statusLower = (bill.status || '').toLowerCase();
    if (statusLower.includes('became_law') || statusLower.includes('signed')) return 95;
    if (statusLower.includes('passed_both') || statusLower.includes('resolving_differences')) return 80;
    if (statusLower.includes('passed_house') || statusLower.includes('passed_senate')) score += 30;

    // Cosponsor count (more cosponsors = more likely)
    const cosponsorCount = bill.cosponsors.length;
    if (cosponsorCount >= 100) score += 25;
    else if (cosponsorCount >= 50) score += 18;
    else if (cosponsorCount >= 20) score += 12;
    else if (cosponsorCount >= 10) score += 7;
    else if (cosponsorCount >= 5) score += 3;

    // Bipartisan cosponsorship
    const parties = new Set(bill.cosponsors.map(c => c.member.party));
    if (parties.has('D') && parties.has('R')) score += 10;

    // Committee/floor activity
    const actionTexts = bill.actions.map(a => a.actionText.toLowerCase());
    if (actionTexts.some(t => t.includes('reported') || t.includes('ordered to be reported'))) score += 15;
    if (actionTexts.some(t => t.includes('committee'))) score += 5;
    if (actionTexts.some(t => t.includes('floor'))) score += 10;

    // Bill type (resolutions pass more easily than substantive bills)
    if (bill.billType.includes('res')) score += 5;

    // Sponsor seniority
    if (bill.sponsor) {
      if (bill.sponsor.termsServed >= 5) score += 5;
      if (bill.sponsor.termsServed >= 10) score += 3;
    }

    return Math.min(Math.max(Math.round(score), 1), 99);
  }

  /**
   * Bipartisan score (0-100)
   * 100 = perfect bipartisan, 0 = entirely one-party
   */
  computeBipartisanScore(bill: {
    cosponsors: { member: { party: string } }[];
    sponsor?: { party: string } | null;
  }): number {
    const allParties: string[] = [];

    if (bill.sponsor) allParties.push(bill.sponsor.party);
    bill.cosponsors.forEach(c => allParties.push(c.member.party));

    if (allParties.length <= 1) return 0;

    const dCount = allParties.filter(p => p === 'D').length;
    const rCount = allParties.filter(p => p === 'R').length;
    const total = dCount + rCount;

    if (total === 0) return 50; // Only independents

    // Score based on minority party representation
    const minorityRatio = Math.min(dCount, rCount) / total;
    // 0.5 = perfectly balanced = 100, 0 = one party = 0
    return Math.round(minorityRatio * 200);
  }

  /**
   * Batch compute intelligence for bills that don't have scores yet
   */
  async batchComputeScores(limit: number = 100): Promise<number> {
    const bills = await prisma.bill.findMany({
      where: {
        OR: [
          { passageProbability: null },
          { bipartisanScore: null },
        ],
      },
      include: {
        cosponsors: { include: { member: true } },
        actions: true,
        sponsor: true,
      },
      take: limit,
    });

    let updated = 0;
    for (const bill of bills) {
      try {
        const passageProbability = this.computePassageProbability(bill);
        const bipartisanScore = this.computeBipartisanScore(bill);

        await prisma.bill.update({
          where: { billId: bill.billId },
          data: { passageProbability, bipartisanScore },
        });
        updated++;
      } catch (error) {
        logger.error(`Failed to compute scores for ${bill.billId}`, error);
      }
    }

    logger.info(`Batch computed scores for ${updated} bills`);
    return updated;
  }

  /**
   * Batch generate AI summaries for bills without them
   */
  async batchSummarize(limit: number = 20): Promise<number> {
    if (!geminiService.isConfigured) {
      logger.warn('Gemini API not configured, skipping batch summarize');
      return 0;
    }

    const bills = await prisma.bill.findMany({
      where: { aiSummary: null },
      take: limit,
      orderBy: { latestActionDate: 'desc' },
    });

    let summarized = 0;
    for (const bill of bills) {
      try {
        const summary = await geminiService.summarizeBill({
          billId: bill.billId,
          title: bill.title || '',
          officialTitle: bill.officialTitle,
          summaryText: bill.summaryText,
          latestActionText: bill.latestActionText,
          policyArea: bill.policyArea,
          status: bill.status,
        });

        await prisma.bill.update({
          where: { billId: bill.billId },
          data: { aiSummary: summary },
        });
        summarized++;

        // Rate limit: 1 request per second
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        logger.error(`Failed to summarize ${bill.billId}`, error);
      }
    }

    logger.info(`Batch summarized ${summarized} bills`);
    return summarized;
  }
}

export const billIntelligenceService = new BillIntelligenceService();
