/**
 * Gemini AI Service
 * Provides AI-powered bill summarization and analysis
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config';
import { createLogger } from '../lib/logger';
import { cache, CacheTTL, buildCacheKey } from '../lib/cache';

const logger = createLogger('gemini-service');

class GeminiService {
  private model: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;

  private getModel() {
    if (!this.model) {
      const apiKey = config.apiKeys.gemini;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured');
      }
      const genAI = new GoogleGenerativeAI(apiKey);
      this.model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    }
    return this.model;
  }

  get isConfigured(): boolean {
    return !!config.apiKeys.gemini;
  }

  /**
   * Generate a plain-English summary of a bill
   */
  async summarizeBill(params: {
    billId: string;
    title: string;
    officialTitle?: string | null;
    summaryText?: string | null;
    latestActionText?: string | null;
    policyArea?: string | null;
    status?: string | null;
  }): Promise<string> {
    const cacheKey = buildCacheKey('ai:summary', params.billId);
    const cached = cache.get<string>(cacheKey);
    if (cached) return cached;

    const model = this.getModel();

    const prompt = `You are a nonpartisan congressional analyst. Summarize this bill in 2-3 clear sentences that any citizen can understand. Focus on what the bill does, who it affects, and its current status. Do not include bill numbers in the summary.

Bill Title: ${params.title}
${params.officialTitle ? `Official Title: ${params.officialTitle}` : ''}
${params.policyArea ? `Policy Area: ${params.policyArea}` : ''}
${params.status ? `Current Status: ${params.status}` : ''}
${params.latestActionText ? `Latest Action: ${params.latestActionText}` : ''}
${params.summaryText ? `Congressional Summary: ${params.summaryText}` : ''}

Plain-English Summary:`;

    try {
      const result = await model.generateContent(prompt);
      const summary = result.response.text().trim();

      cache.set(cacheKey, summary, CacheTTL.DAY);
      logger.info(`Generated summary for ${params.billId}`, { billId: params.billId, length: summary.length });
      return summary;
    } catch (error) {
      logger.error(`Failed to summarize bill ${params.billId}`, error);
      throw error;
    }
  }

  /**
   * Extract 3-5 key points from a bill
   */
  async extractKeyPoints(params: {
    billId: string;
    title: string;
    summaryText?: string | null;
    officialTitle?: string | null;
  }): Promise<string[]> {
    const cacheKey = buildCacheKey('ai:keypoints', params.billId);
    const cached = cache.get<string[]>(cacheKey);
    if (cached) return cached;

    const model = this.getModel();

    const prompt = `Extract 3-5 key points from this bill. Each point should be one sentence. Return ONLY the bullet points, one per line, starting with "- ".

Bill Title: ${params.title}
${params.officialTitle ? `Official Title: ${params.officialTitle}` : ''}
${params.summaryText ? `Summary: ${params.summaryText}` : ''}

Key Points:`;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const points = text
        .split('\n')
        .map(line => line.replace(/^[-*]\s*/, '').trim())
        .filter(line => line.length > 0);

      cache.set(cacheKey, points, CacheTTL.DAY);
      return points;
    } catch (error) {
      logger.error(`Failed to extract key points for ${params.billId}`, error);
      throw error;
    }
  }

  /**
   * Classify a bill's topic/subject areas
   */
  async classifyTopics(params: {
    billId: string;
    title: string;
    summaryText?: string | null;
    policyArea?: string | null;
  }): Promise<string[]> {
    const cacheKey = buildCacheKey('ai:topics', params.billId);
    const cached = cache.get<string[]>(cacheKey);
    if (cached) return cached;

    const model = this.getModel();

    const prompt = `Classify this bill into 1-4 policy topic tags from this list: Healthcare, Education, Defense, Environment, Economy, Immigration, Civil Rights, Technology, Agriculture, Energy, Transportation, Housing, Foreign Affairs, Judiciary, Labor, Veterans, Tax, Budget, Social Services, Science, Trade, Cybersecurity, Elections. Return ONLY the tags, comma-separated.

Bill Title: ${params.title}
${params.policyArea ? `CRS Policy Area: ${params.policyArea}` : ''}
${params.summaryText ? `Summary: ${params.summaryText}` : ''}

Topics:`;

    try {
      const result = await model.generateContent(prompt);
      const topics = result.response.text().trim().split(',').map(t => t.trim()).filter(t => t.length > 0);

      cache.set(cacheKey, topics, CacheTTL.WEEK);
      return topics;
    } catch (error) {
      logger.error(`Failed to classify topics for ${params.billId}`, error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
