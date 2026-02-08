/**
 * Graph Ingestion Service
 * Builds the knowledge graph from PostgreSQL data
 */

import { prisma } from '../lib/prisma';
import { graphEngine } from './engine';
import { createLogger } from '../lib/logger';

const logger = createLogger('graph-ingestion');

class GraphIngestionService {
  /**
   * Build the complete knowledge graph from database
   */
  async buildGraph(): Promise<{ nodes: number; edges: number; duration: number }> {
    const start = Date.now();
    graphEngine.clear();

    logger.info('Building knowledge graph from database...');

    await Promise.all([
      this.ingestMembers(),
      this.ingestBills(),
      this.ingestCommittees(),
    ]);

    // These depend on members/bills/committees being ingested first
    await Promise.all([
      this.ingestSponsorships(),
      this.ingestCommitteeMemberships(),
      this.ingestCosponsorships(),
      this.ingestContributions(),
    ]);

    const duration = Date.now() - start;
    const stats = graphEngine.getStats();
    logger.info(`Graph built: ${stats.nodes} nodes, ${stats.edges} edges in ${duration}ms`);

    return { nodes: stats.nodes, edges: stats.edges, duration };
  }

  private async ingestMembers(): Promise<void> {
    const members = await prisma.member.findMany({
      where: { currentMember: true },
      select: { bioguideId: true, fullName: true, party: true, state: true, district: true, chamber: true },
    });

    for (const m of members) {
      graphEngine.addNode({
        id: `member:${m.bioguideId}`,
        type: 'member',
        label: m.fullName,
        data: { bioguideId: m.bioguideId, party: m.party, state: m.state, district: m.district, chamber: m.chamber },
      });
    }

    logger.info(`Ingested ${members.length} member nodes`);
  }

  private async ingestBills(): Promise<void> {
    const bills = await prisma.bill.findMany({
      select: { billId: true, title: true, billType: true, billNumber: true, congress: true, policyArea: true },
      take: 5000,
      orderBy: { latestActionDate: 'desc' },
    });

    for (const b of bills) {
      graphEngine.addNode({
        id: `bill:${b.billId}`,
        type: 'bill',
        label: b.title || `${b.billType}${b.billNumber}`,
        data: { billId: b.billId, billType: b.billType, billNumber: b.billNumber, congress: b.congress, policyArea: b.policyArea },
      });
    }

    logger.info(`Ingested ${bills.length} bill nodes`);
  }

  private async ingestCommittees(): Promise<void> {
    const committees = await prisma.committee.findMany({
      select: { committeeCode: true, name: true, chamber: true, committeeType: true },
    });

    for (const c of committees) {
      graphEngine.addNode({
        id: `committee:${c.committeeCode}`,
        type: 'committee',
        label: c.name,
        data: { committeeCode: c.committeeCode, chamber: c.chamber, committeeType: c.committeeType },
      });
    }

    logger.info(`Ingested ${committees.length} committee nodes`);
  }

  private async ingestSponsorships(): Promise<void> {
    const sponsorships = await prisma.bill.findMany({
      where: { sponsorBioguideId: { not: null } },
      select: { billId: true, sponsorBioguideId: true },
      take: 5000,
    });

    let edgeCount = 0;
    for (const s of sponsorships) {
      if (s.sponsorBioguideId) {
        graphEngine.addEdge({
          source: `member:${s.sponsorBioguideId}`,
          target: `bill:${s.billId}`,
          type: 'sponsors',
          weight: 3,
        });
        edgeCount++;
      }
    }

    logger.info(`Ingested ${edgeCount} sponsorship edges`);
  }

  private async ingestCosponsorships(): Promise<void> {
    const cosponsors = await prisma.cosponsor.findMany({
      select: { billId: true, memberBioguideId: true, isOriginalCosponsor: true },
      take: 20000,
    });

    let edgeCount = 0;
    for (const c of cosponsors) {
      graphEngine.addEdge({
        source: `member:${c.memberBioguideId}`,
        target: `bill:${c.billId}`,
        type: 'cosponsors',
        weight: c.isOriginalCosponsor ? 2 : 1,
      });
      edgeCount++;
    }

    logger.info(`Ingested ${edgeCount} cosponsorship edges`);
  }

  private async ingestCommitteeMemberships(): Promise<void> {
    const memberships = await prisma.committeeMembership.findMany({
      select: { committeeCode: true, memberBioguideId: true, isChair: true, isRankingMember: true },
    });

    let edgeCount = 0;
    for (const m of memberships) {
      graphEngine.addEdge({
        source: `member:${m.memberBioguideId}`,
        target: `committee:${m.committeeCode}`,
        type: m.isChair ? 'chairs' : 'member_of',
        weight: m.isChair ? 5 : (m.isRankingMember ? 3 : 1),
      });
      edgeCount++;
    }

    logger.info(`Ingested ${edgeCount} committee membership edges`);
  }

  private async ingestContributions(): Promise<void> {
    // Aggregate top donors per member
    const topDonors = await prisma.campaignContribution.groupBy({
      by: ['memberBioguideId', 'contributorName', 'contributorType'],
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
      take: 5000,
    });

    let edgeCount = 0;
    const donorNodes = new Set<string>();

    for (const d of topDonors) {
      const donorId = `donor:${d.contributorName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;

      if (!donorNodes.has(donorId)) {
        graphEngine.addNode({
          id: donorId,
          type: 'donor',
          label: d.contributorName,
          data: { contributorType: d.contributorType },
        });
        donorNodes.add(donorId);
      }

      graphEngine.addEdge({
        source: donorId,
        target: `member:${d.memberBioguideId}`,
        type: 'donated_to',
        weight: Math.min(5, Math.ceil(Number(d._sum.amount || 0) / 10000)),
        data: { totalAmount: d._sum.amount, count: d._count },
      });
      edgeCount++;
    }

    logger.info(`Ingested ${donorNodes.size} donor nodes and ${edgeCount} contribution edges`);
  }
}

export const graphIngestionService = new GraphIngestionService();
