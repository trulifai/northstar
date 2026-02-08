/**
 * District Intelligence Service
 * Census demographics, federal spending, and bill impact scoring
 *
 * Data sources:
 * - Census ACS 5-year estimates (api.census.gov) - API key in config
 * - USASpending (api.usaspending.gov) - no API key needed
 */

import { prisma } from '../lib/prisma';
import { createLogger } from '../lib/logger';
import { cache, CacheTTL, buildCacheKey } from '../lib/cache';

const logger = createLogger('district-service');

export interface DistrictProfile {
  state: string;
  districtNumber: number;
  representative: {
    bioguideId: string;
    name: string;
    party: string;
  } | null;
  demographics: {
    totalPopulation: number | null;
    medianIncome: number | null;
    povertyRate: number | null;
    unemploymentRate: number | null;
    medianAge: number | null;
    percentBachelors: number | null;
  };
  spending: {
    totalObligations: number | null;
    defenseSpending: number | null;
    healthcareSpending: number | null;
    educationSpending: number | null;
    infrastructureSpend: number | null;
  } | null;
}

export interface BillImpactScore {
  billId: string;
  districtKey: string;
  overallImpact: number; // 0-100
  factors: {
    factor: string;
    score: number;
    reason: string;
  }[];
}

class DistrictService {
  /**
   * Get district profile with demographics and spending
   */
  async getDistrictProfile(state: string, districtNumber: number, congress: number = 118): Promise<DistrictProfile | null> {
    const cacheKey = buildCacheKey('district', state, districtNumber, congress);
    const cached = cache.get<DistrictProfile>(cacheKey);
    if (cached) return cached;

    const district = await prisma.district.findUnique({
      where: {
        state_districtNumber_congress: { state, districtNumber, congress },
      },
      include: {
        member: true,
        spending: {
          orderBy: { fiscalYear: 'desc' },
          take: 1,
        },
      },
    });

    if (!district) return null;

    const latestSpending = district.spending[0] || null;

    const profile: DistrictProfile = {
      state: district.state,
      districtNumber: district.districtNumber,
      representative: district.member ? {
        bioguideId: district.member.bioguideId,
        name: district.member.fullName,
        party: district.member.party,
      } : null,
      demographics: {
        totalPopulation: district.totalPopulation,
        medianIncome: district.medianIncome ? Number(district.medianIncome) : null,
        povertyRate: district.povertyRate ? Number(district.povertyRate) : null,
        unemploymentRate: district.unemploymentRate ? Number(district.unemploymentRate) : null,
        medianAge: district.medianAge ? Number(district.medianAge) : null,
        percentBachelors: district.percentBachelors ? Number(district.percentBachelors) : null,
      },
      spending: latestSpending ? {
        totalObligations: latestSpending.totalObligations ? Number(latestSpending.totalObligations) : null,
        defenseSpending: latestSpending.defenseSpending ? Number(latestSpending.defenseSpending) : null,
        healthcareSpending: latestSpending.healthcareSpending ? Number(latestSpending.healthcareSpending) : null,
        educationSpending: latestSpending.educationSpending ? Number(latestSpending.educationSpending) : null,
        infrastructureSpend: latestSpending.infrastructureSpend ? Number(latestSpending.infrastructureSpend) : null,
      } : null,
    };

    cache.set(cacheKey, profile, CacheTTL.HOUR);
    return profile;
  }

  /**
   * List all districts for a state
   */
  async getDistrictsByState(state: string, congress: number = 118) {
    const districts = await prisma.district.findMany({
      where: { state, congress },
      include: { member: true },
      orderBy: { districtNumber: 'asc' },
    });

    return districts.map(d => ({
      state: d.state,
      districtNumber: d.districtNumber,
      representative: d.member ? {
        bioguideId: d.member.bioguideId,
        name: d.member.fullName,
        party: d.member.party,
      } : null,
      totalPopulation: d.totalPopulation,
      medianIncome: d.medianIncome ? Number(d.medianIncome) : null,
    }));
  }

  /**
   * Compare two districts on key metrics
   */
  async compareDistricts(
    stateA: string, districtA: number,
    stateB: string, districtB: number,
    congress: number = 118
  ) {
    const [profileA, profileB] = await Promise.all([
      this.getDistrictProfile(stateA, districtA, congress),
      this.getDistrictProfile(stateB, districtB, congress),
    ]);

    return { districtA: profileA, districtB: profileB };
  }

  /**
   * Score how a bill would impact a specific district
   * Uses district demographics to estimate relevance
   */
  async scoreBillImpact(billId: string, state: string, districtNumber: number): Promise<BillImpactScore | null> {
    const cacheKey = buildCacheKey('impact', billId, state, districtNumber);
    const cached = cache.get<BillImpactScore>(cacheKey);
    if (cached) return cached;

    const [bill, district] = await Promise.all([
      prisma.bill.findUnique({ where: { billId } }),
      prisma.district.findUnique({
        where: { state_districtNumber_congress: { state, districtNumber, congress: 118 } },
      }),
    ]);

    if (!bill || !district) return null;

    const factors: BillImpactScore['factors'] = [];
    const policyArea = (bill.policyArea || '').toLowerCase();

    // Healthcare impact
    if (policyArea.includes('health')) {
      const povertyRate = Number(district.povertyRate || 0);
      const score = povertyRate > 15 ? 80 : povertyRate > 10 ? 60 : 40;
      factors.push({
        factor: 'Healthcare Access',
        score,
        reason: `District poverty rate ${povertyRate.toFixed(1)}% ${povertyRate > 15 ? 'significantly increases' : 'moderately affects'} healthcare bill relevance`,
      });
    }

    // Education impact
    if (policyArea.includes('education')) {
      const bachelors = Number(district.percentBachelors || 0);
      const score = bachelors < 20 ? 80 : bachelors < 30 ? 60 : 40;
      factors.push({
        factor: 'Education Level',
        score,
        reason: `${bachelors.toFixed(1)}% bachelor's degree rate ${bachelors < 20 ? 'strongly signals' : 'moderately indicates'} education bill relevance`,
      });
    }

    // Defense impact
    if (policyArea.includes('defense') || policyArea.includes('armed forces')) {
      const veterans = district.veteranPopulation || 0;
      const pop = district.totalPopulation || 1;
      const vetRate = (veterans / pop) * 100;
      const score = vetRate > 8 ? 85 : vetRate > 5 ? 65 : 35;
      factors.push({
        factor: 'Military/Veterans',
        score,
        reason: `${veterans.toLocaleString()} veterans (${vetRate.toFixed(1)}% of population)`,
      });
    }

    // Economy/labor impact
    if (policyArea.includes('economy') || policyArea.includes('labor') || policyArea.includes('employment')) {
      const unemployment = Number(district.unemploymentRate || 0);
      const score = unemployment > 6 ? 80 : unemployment > 4 ? 60 : 40;
      factors.push({
        factor: 'Employment',
        score,
        reason: `${unemployment.toFixed(1)}% unemployment rate`,
      });
    }

    // Default: moderate relevance based on population
    if (factors.length === 0) {
      factors.push({
        factor: 'General Relevance',
        score: 50,
        reason: 'Bill policy area does not match specific district characteristics',
      });
    }

    const overallImpact = Math.round(
      factors.reduce((sum, f) => sum + f.score, 0) / factors.length
    );

    const result: BillImpactScore = {
      billId,
      districtKey: `${state}-${districtNumber}`,
      overallImpact,
      factors,
    };

    cache.set(cacheKey, result, CacheTTL.HOUR);
    return result;
  }

  /**
   * Sync Census ACS data for a state (placeholder for Census API integration)
   */
  async syncCensusData(state: string, congress: number = 118): Promise<number> {
    logger.info(`Syncing Census data for ${state}, congress ${congress}`);
    // TODO: Integrate with Census API using config.apiKeys.census
    return 0;
  }
}

export const districtService = new DistrictService();
