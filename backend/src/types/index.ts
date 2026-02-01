/**
 * Northstar Type Definitions
 * Complete TypeScript types for Congressional Intelligence Platform
 */

// ============================================================================
// Congress.gov API Types
// ============================================================================

export interface CongressGovBill {
  congress: number;
  type: BillType;
  number: number;
  originChamber: Chamber;
  title: string;
  latestAction: {
    actionDate: string;
    text: string;
  };
  introducedDate: string;
  updateDate: string;
  url: string;
}

export interface BillDetails extends CongressGovBill {
  constitutionalAuthorityStatementText?: string;
  sponsors?: Sponsor[];
  cosponsors?: Cosponsor[];
  actions?: BillAction[];
  titles?: BillTitle[];
  subjects?: Subject[];
  summaries?: BillSummary[];
  committeeReports?: CommitteeReport[];
  relatedBills?: RelatedBill[];
  amendments?: Amendment[];
  textVersions?: TextVersion[];
  cboCostEstimates?: CBOEstimate[];
  laws?: Law[];
  policyArea?: {
    name: string;
  };
}

export interface Member {
  bioguideId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  party: Party;
  state: string;
  district?: number;
  chamber: Chamber;
  terms?: Term[];
  sponsoredLegislation?: {
    count: number;
    url: string;
  };
  cosponsoredLegislation?: {
    count: number;
    url: string;
  };
}

export interface Vote {
  congress: number;
  chamber: Chamber;
  session: number;
  rollNumber: number;
  date: string;
  question: string;
  result: VoteResult;
  bill?: {
    billType: BillType;
    billNumber: number;
  };
  amendment?: {
    amendmentType: string;
    amendmentNumber: number;
  };
  votes: {
    yea: number;
    nay: number;
    present: number;
    notVoting: number;
  };
  party?: {
    democratic?: { yea: number; nay: number };
    republican?: { yea: number; nay: number };
    independent?: { yea: number; nay: number };
  };
}

export interface Committee {
  systemCode: string;
  name: string;
  chamber: Chamber;
  committeeType: CommitteeType;
  subcommittees?: Committee[];
  parent?: {
    systemCode: string;
    name: string;
  };
}

export interface Amendment {
  congress: number;
  number: number;
  type: AmendmentType;
  purpose?: string;
  description?: string;
  sponsor?: Sponsor;
  submittedDate: string;
  proposedDate?: string;
  actions?: AmendmentAction[];
}

export interface Hearing {
  jacketNumber: string;
  congress: number;
  chamber: Chamber;
  committees?: Committee[];
  title: string;
  date?: string;
  formats?: HearingFormat[];
}

// ============================================================================
// Supporting Types
// ============================================================================

export type BillType = 
  | 'hr'      // House Bill
  | 's'       // Senate Bill
  | 'hjres'   // House Joint Resolution
  | 'sjres'   // Senate Joint Resolution
  | 'hconres' // House Concurrent Resolution
  | 'sconres' // Senate Concurrent Resolution
  | 'hres'    // House Simple Resolution
  | 'sres';   // Senate Simple Resolution

export type Chamber = 'house' | 'senate';

export type Party = 'D' | 'R' | 'I' | 'ID' | 'L';

export type BillStatus =
  | 'introduced'
  | 'referred'
  | 'reported'
  | 'passed_house'
  | 'passed_senate'
  | 'resolving_differences'
  | 'to_president'
  | 'became_law'
  | 'vetoed'
  | 'failed';

export type VoteResult = 
  | 'Passed'
  | 'Failed'
  | 'Agreed to'
  | 'Rejected';

export type CommitteeType = 
  | 'Standing'
  | 'Select'
  | 'Joint'
  | 'Special';

export type AmendmentType = 'hamdt' | 'samdt' | 'suamdt';

export interface Sponsor {
  bioguideId: string;
  fullName: string;
  firstName: string;
  lastName: string;
  party: Party;
  state: string;
  district?: number;
  isByRequest?: boolean;
}

export interface Cosponsor extends Sponsor {
  sponsorshipDate: string;
  isOriginalCosponsor: boolean;
  sponsorshipWithdrawnDate?: string;
}

export interface BillAction {
  actionDate: string;
  actionTime?: string;
  text: string;
  type: string;
  actionCode?: string;
  sourceSystem: {
    code: number;
    name: string;
  };
  committees?: {
    name: string;
    systemCode: string;
  }[];
}

export interface BillTitle {
  title: string;
  titleType: string;
  titleTypeCode?: number;
  chamberCode?: string;
  chamberName?: string;
}

export interface Subject {
  name: string;
  updateDate: string;
}

export interface BillSummary {
  versionCode: string;
  actionDate: string;
  actionDesc: string;
  updateDate: string;
  text: string;
}

export interface CommitteeReport {
  citation: string;
  type: string;
  url: string;
}

export interface RelatedBill {
  congress: number;
  number: number;
  type: BillType;
  title: string;
  relationshipDetails?: {
    type: string;
    identifiedBy: string;
  }[];
}

export interface TextVersion {
  type: string;
  date: string;
  formats: {
    type: string;
    url: string;
  }[];
}

export interface CBOEstimate {
  description: string;
  pubDate: string;
  title: string;
  url: string;
}

export interface Law {
  number: string;
  type: string;
}

export interface Term {
  congress: number;
  chamber: Chamber;
  startYear: number;
  endYear: number;
}

export interface AmendmentAction {
  actionDate: string;
  text: string;
}

export interface HearingFormat {
  type: string;
  url: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface CongressGovResponse<T> {
  [key: string]: T[] | { count: number };
  pagination?: {
    count: number;
    next?: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    offset: number;
    limit: number;
    hasMore: boolean;
  };
}

// ============================================================================
// Northstar Enhanced Types (with AI/Analytics)
// ============================================================================

export interface EnhancedBill extends BillDetails {
  aiSummary?: string;
  passageProbability?: number;
  bipartisanScore?: number;
  mediaSentiment?: number;
  lobbyingActivity?: LobbyingActivity;
  districtImpact?: DistrictImpact[];
  newsAnalysis?: NewsAnalysis;
}

export interface LobbyingActivity {
  totalReports: number;
  totalSpending: number;
  topLobbyists: {
    name: string;
    client: string;
    amount: number;
  }[];
  recentActivity: LobbyingReport[];
}

export interface LobbyingReport {
  reportId: string;
  filingDate: string;
  registrantName: string;
  clientName: string;
  amount: number;
  issues: string[];
  specificIssues: string;
}

export interface DistrictImpact {
  state: string;
  district: number;
  impactScore: number;
  affectedPrograms: string[];
  estimatedBenefit?: number;
  demographics: DistrictDemographics;
}

export interface DistrictDemographics {
  totalPopulation: number;
  medianIncome: number;
  povertyRate: number;
  unemploymentRate: number;
  veteranPopulation: number;
  medianAge: number;
  education: {
    bachelorsOrHigher: number;
  };
}

export interface NewsAnalysis {
  totalArticles: number;
  averageSentiment: number;
  credibilityScore: number;
  topSources: string[];
  recentArticles: NewsArticle[];
  trendingTopics: string[];
}

export interface NewsArticle {
  url: string;
  title: string;
  source: string;
  publishedAt: string;
  sentiment: number;
  credibility: number;
  summary: string;
}

export interface MemberAnalytics {
  votingPatterns: {
    partyLineVotes: number;
    bipartisanVotes: number;
    missedVotes: number;
    totalVotes: number;
    absenteeRate: number;
  };
  legislativeProductivity: {
    billsSponsored: number;
    billsPassed: number;
    successRate: number;
  };
  influenceScore: number;
  bipartisanScore: number;
  campaignFinance: CampaignFinance;
  pressActivity: PressActivity;
}

export interface CampaignFinance {
  totalRaised: number;
  totalSpent: number;
  cashOnHand: number;
  topDonors: Donor[];
  industryBreakdown: IndustryContribution[];
}

export interface Donor {
  name: string;
  amount: number;
  type: 'Individual' | 'PAC' | 'Party';
}

export interface IndustryContribution {
  industry: string;
  amount: number;
  percentage: number;
}

export interface PressActivity {
  totalReleases: number;
  recentReleases: PressRelease[];
  topTopics: string[];
}

export interface PressRelease {
  title: string;
  date: string;
  url: string;
  summary: string;
}

// ============================================================================
// Search & Query Types
// ============================================================================

export interface BillSearchParams {
  query?: string;
  congress?: number;
  billType?: BillType;
  status?: BillStatus;
  sponsor?: string;
  subject?: string;
  committee?: string;
  offset?: number;
  limit?: number;
  sort?: 'updateDate' | 'introducedDate' | 'relevance';
  order?: 'asc' | 'desc';
}

export interface MemberSearchParams {
  query?: string;
  state?: string;
  party?: Party;
  chamber?: Chamber;
  currentMember?: boolean;
  offset?: number;
  limit?: number;
}

export interface VoteSearchParams {
  congress?: number;
  chamber?: Chamber;
  startDate?: string;
  endDate?: string;
  billId?: string;
  offset?: number;
  limit?: number;
}

// ============================================================================
// Database Model Types (Prisma-compatible)
// ============================================================================

export interface DBBill {
  id: number;
  billId: string;
  congress: number;
  billType: string;
  billNumber: number;
  title?: string;
  shortTitle?: string;
  introducedDate?: Date;
  latestActionDate?: Date;
  latestActionText?: string;
  status?: string;
  sponsorBioguideId?: string;
  policyArea?: string;
  subjects?: any; // JSONB
  summaryText?: string;
  aiSummary?: string;
  passageProbability?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DBMember {
  id: number;
  bioguideId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  party: string;
  state: string;
  district?: number;
  chamber: string;
  currentMember: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Service Response Types
// ============================================================================

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: ServiceError;
  meta?: {
    cached?: boolean;
    source?: string;
    timestamp?: string;
  };
}

export interface ServiceError {
  code: string;
  message: string;
  details?: any;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface AppConfig {
  port: number;
  env: 'development' | 'staging' | 'production';
  apiKeys: {
    congressGov: string;
    gemini?: string;
    trulifai?: string;
    openSecrets?: string;
    census?: string;
  };
  database: {
    url: string;
  };
  redis?: {
    host: string;
    port: number;
    password?: string;
  };
  cache: {
    ttl: number;
    enabled: boolean;
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
}

export interface RequestContext {
  userId?: number;
  apiKey?: string;
  officeId?: number;
  tier?: 'free' | 'developer' | 'enterprise';
}
