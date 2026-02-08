/**
 * News Aggregator Service
 * RSS feed aggregation from trusted government/political news sources
 *
 * Sources (no API key needed - all RSS):
 * - AP News: https://rsshub.app/apnews/topics/politics
 * - Reuters: https://www.reutersagency.com/feed/?best-topics=political-general
 * - The Hill: https://thehill.com/feed/
 * - Politico: https://www.politico.com/rss/congress.xml
 * - CQ Roll Call: https://www.rollcall.com/feed/
 */

import { prisma } from '../lib/prisma';
import { createLogger } from '../lib/logger';
// cache available for future use

const logger = createLogger('news-aggregator');

interface RSSFeed {
  name: string;
  url: string;
  credibilityTier: number; // 1 = highest (AP, Reuters), 6 = lowest
}

const NEWS_FEEDS: RSSFeed[] = [
  { name: 'AP News', url: 'https://rsshub.app/apnews/topics/politics', credibilityTier: 1 },
  { name: 'Reuters', url: 'https://www.reutersagency.com/feed/?best-topics=political-general', credibilityTier: 1 },
  { name: 'The Hill', url: 'https://thehill.com/feed/', credibilityTier: 2 },
  { name: 'Politico', url: 'https://www.politico.com/rss/congress.xml', credibilityTier: 2 },
  { name: 'Roll Call', url: 'https://www.rollcall.com/feed/', credibilityTier: 2 },
  { name: 'C-SPAN', url: 'https://www.c-span.org/feeds/congress', credibilityTier: 1 },
];

class NewsAggregatorService {
  /**
   * Fetch and store articles from all RSS feeds
   */
  async syncAllFeeds(maxPerFeed: number = 20): Promise<{ synced: number; errors: number }> {
    logger.info('Starting RSS feed aggregation');
    let totalSynced = 0;
    let totalErrors = 0;

    for (const feed of NEWS_FEEDS) {
      try {
        const result = await this.syncFeed(feed, maxPerFeed);
        totalSynced += result.synced;
        totalErrors += result.errors;
      } catch (error) {
        totalErrors++;
        logger.error(`Failed to sync feed ${feed.name}`, error);
      }
    }

    logger.info(`RSS sync complete: ${totalSynced} articles synced, ${totalErrors} errors`);
    return { synced: totalSynced, errors: totalErrors };
  }

  /**
   * Fetch articles from a single RSS feed
   */
  private async syncFeed(feed: RSSFeed, maxArticles: number): Promise<{ synced: number; errors: number }> {
    let synced = 0;
    let errors = 0;

    try {
      const response = await fetch(feed.url);
      if (!response.ok) {
        logger.warn(`Failed to fetch ${feed.name}: ${response.status}`);
        return { synced, errors: 1 };
      }

      const xml = await response.text();
      const articles = this.parseRSS(xml, feed);

      for (const article of articles.slice(0, maxArticles)) {
        try {
          await prisma.newsArticle.upsert({
            where: { url: article.url },
            create: {
              url: article.url,
              title: article.title,
              source: feed.name,
              author: article.author || null,
              publishedAt: article.publishedAt,
              summary: article.summary || null,
              credibilityScore: this.tierToScore(feed.credibilityTier),
              topics: article.topics ? JSON.parse(JSON.stringify(article.topics)) : undefined,
            },
            update: {
              title: article.title,
              summary: article.summary || null,
            },
          });
          synced++;
        } catch {
          errors++;
        }
      }
    } catch (error) {
      logger.error(`Error processing feed ${feed.name}`, error);
      errors++;
    }

    return { synced, errors };
  }

  /**
   * Parse RSS XML into article objects (basic parser)
   */
  private parseRSS(xml: string, _feed: RSSFeed): {
    url: string;
    title: string;
    author?: string;
    publishedAt: Date | null;
    summary?: string;
    topics?: string[];
  }[] {
    const articles: ReturnType<typeof this.parseRSS> = [];

    // Simple regex-based RSS parser for <item> elements
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
      const item = match[1];
      const title = this.extractTag(item, 'title');
      const link = this.extractTag(item, 'link');
      const description = this.extractTag(item, 'description');
      const pubDate = this.extractTag(item, 'pubDate');
      const author = this.extractTag(item, 'dc:creator') || this.extractTag(item, 'author');
      const categories = this.extractAllTags(item, 'category');

      if (title && link) {
        articles.push({
          url: link,
          title: this.stripCDATA(title),
          author: author ? this.stripCDATA(author) : undefined,
          publishedAt: pubDate ? new Date(pubDate) : null,
          summary: description ? this.stripHTML(this.stripCDATA(description)).slice(0, 500) : undefined,
          topics: categories.length > 0 ? categories.map(c => this.stripCDATA(c)) : undefined,
        });
      }
    }

    return articles;
  }

  private extractTag(xml: string, tag: string): string | null {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
    const match = regex.exec(xml);
    return match ? match[1].trim() : null;
  }

  private extractAllTags(xml: string, tag: string): string[] {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'gi');
    const results: string[] = [];
    let match;
    while ((match = regex.exec(xml)) !== null) {
      results.push(match[1].trim());
    }
    return results;
  }

  private stripCDATA(text: string): string {
    return text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
  }

  private stripHTML(text: string): string {
    return text.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim();
  }

  private tierToScore(tier: number): number {
    const scores: Record<number, number> = { 1: 95, 2: 85, 3: 70, 4: 55, 5: 40, 6: 25 };
    return scores[tier] || 50;
  }

  /**
   * Get recent news articles
   */
  async getRecentArticles(params?: {
    source?: string;
    query?: string;
    limit?: number;
    offset?: number;
  }) {
    const { source, query, limit = 20, offset = 0 } = params || {};

    const where: any = {};
    if (source) where.source = source;
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { summary: { contains: query, mode: 'insensitive' } },
      ];
    }

    const [articles, total] = await Promise.all([
      prisma.newsArticle.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.newsArticle.count({ where }),
    ]);

    return { data: articles, total };
  }

  /**
   * Get news articles related to a specific bill (by keyword matching)
   */
  async getArticlesByBill(billId: string, limit: number = 10) {
    const bill = await prisma.bill.findUnique({
      where: { billId },
      select: { title: true, shortTitle: true, billType: true, billNumber: true },
    });

    if (!bill) return { data: [], total: 0 };

    // Search by bill number or title keywords
    const searchTerms = [
      `${bill.billType?.toUpperCase()} ${bill.billNumber}`,
      ...(bill.shortTitle || '').split(' ').filter(w => w.length > 4).slice(0, 3),
    ].filter(Boolean);

    if (searchTerms.length === 0) return { data: [], total: 0 };

    const articles = await prisma.newsArticle.findMany({
      where: {
        OR: searchTerms.map(term => ({
          OR: [
            { title: { contains: term, mode: 'insensitive' as const } },
            { summary: { contains: term, mode: 'insensitive' as const } },
          ],
        })),
      },
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });

    return { data: articles, total: articles.length };
  }
}

export const newsAggregatorService = new NewsAggregatorService();
