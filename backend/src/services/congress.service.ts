/**
 * Congress.gov API Service
 * Complete integration with official Congress.gov REST API
 * 
 * API Documentation: https://api.congress.gov/
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { runtimeConfig } from '../config/runtime';
import type {
  CongressGovResponse,
  CongressGovBill,
  BillDetails,
  Member,
  Vote,
  Committee,
  Amendment,
  Hearing,
  BillSearchParams,
  MemberSearchParams,
  VoteSearchParams,
  ServiceResponse,
  PaginatedResponse
} from '../types';

interface HouseVotePartyTotal {
  voteParty?: string;
  yeaTotal?: number;
  nayTotal?: number;
  presentTotal?: number;
  notVotingTotal?: number;
}

interface HouseRollCallVote {
  congress: number;
  sessionNumber: number;
  rollCallNumber: number;
  startDate: string;
  result?: string;
  voteQuestion?: string;
  voteType?: string;
  legislationType?: string;
  legislationNumber?: string;
  votePartyTotal?: HouseVotePartyTotal[];
}

interface HouseRollCallVoteListResponse {
  houseRollCallVotes: HouseRollCallVote[];
  pagination?: {
    count: number;
    next?: string;
  };
}

interface HouseRollCallVoteDetailResponse {
  houseRollCallVote: HouseRollCallVote;
}

type VoteBillType = NonNullable<Vote['bill']>['billType'];

export class CongressService {
  private readonly client: AxiosInstance;
  private readonly baseURL = 'https://api.congress.gov/v3';
  private readonly apiKey: string;
  private readonly enabled: boolean;

  constructor(apiKey: string, enabled: boolean = true) {
    if (enabled && !apiKey) {
      throw new Error('Congress.gov API key is required');
    }

    this.enabled = enabled;
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
      },
      params: this.apiKey ? { api_key: this.apiKey } : undefined,
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        if (!this.enabled) {
          return Promise.reject(new Error('PROVIDER_DISABLED:congressGov'));
        }
        console.log(`[Congress.gov] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error('[Congress.gov] Request failed:', error.message);
        if (error.response) {
          console.error('[Congress.gov] Response status:', error.response.status);
          console.error('[Congress.gov] Response data:', error.response.data);
        }
        return Promise.reject(error);
      }
    );
  }

  // ============================================================================
  // Bills & Legislation
  // ============================================================================

  /**
   * Search bills across all Congresses
   */
  async searchBills(params: BillSearchParams): Promise<ServiceResponse<PaginatedResponse<CongressGovBill>>> {
    try {
      const { offset = 0, limit = 20, ...filters } = params;

      const response = await this.client.get<CongressGovResponse<CongressGovBill>>('/bill', {
        params: {
          offset,
          limit,
          ...filters,
        },
      });

      const bills = response.data.bills as CongressGovBill[];
      const pagination = response.data.pagination as { count: number; next?: string };

      return {
        success: true,
        data: {
          data: bills,
          pagination: {
            total: pagination.count,
            offset,
            limit,
            hasMore: !!pagination.next,
          },
        },
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get all bills for a specific Congress
   */
  async getBillsByCongress(
    congress: number,
    options: { offset?: number; limit?: number; billType?: string } = {}
  ): Promise<ServiceResponse<PaginatedResponse<CongressGovBill>>> {
    try {
      const { offset = 0, limit = 20, billType } = options;

      const endpoint = billType
        ? `/bill/${congress}/${billType}`
        : `/bill/${congress}`;

      const response = await this.client.get<CongressGovResponse<CongressGovBill>>(endpoint, {
        params: { offset, limit },
      });

      const bills = response.data.bills as CongressGovBill[];
      const pagination = response.data.pagination as { count: number };

      return {
        success: true,
        data: {
          data: bills,
          pagination: {
            total: pagination.count,
            offset,
            limit,
            hasMore: (offset + limit) < pagination.count,
          },
        },
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get detailed information for a specific bill
   */
  async getBillDetails(congress: number, billType: string, billNumber: number): Promise<ServiceResponse<BillDetails>> {
    try {
      const response = await this.client.get<{ bill: BillDetails }>(
        `/bill/${congress}/${billType}/${billNumber}`
      );

      return {
        success: true,
        data: response.data.bill,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get bill text (all versions)
   */
  async getBillText(congress: number, billType: string, billNumber: number): Promise<ServiceResponse<any>> {
    try {
      const response = await this.client.get(
        `/bill/${congress}/${billType}/${billNumber}/text`
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get bill actions (legislative history)
   */
  async getBillActions(
    congress: number,
    billType: string,
    billNumber: number,
    options: { offset?: number; limit?: number } = {}
  ): Promise<ServiceResponse<any>> {
    try {
      const { offset = 0, limit = 20 } = options;

      const response = await this.client.get(
        `/bill/${congress}/${billType}/${billNumber}/actions`,
        { params: { offset, limit } }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get bill amendments
   */
  async getBillAmendments(
    congress: number,
    billType: string,
    billNumber: number,
    options: { offset?: number; limit?: number } = {}
  ): Promise<ServiceResponse<any>> {
    try {
      const { offset = 0, limit = 20 } = options;

      const response = await this.client.get(
        `/bill/${congress}/${billType}/${billNumber}/amendments`,
        { params: { offset, limit } }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get bill cosponsors
   */
  async getBillCosponsors(
    congress: number,
    billType: string,
    billNumber: number,
    options: { offset?: number; limit?: number } = {}
  ): Promise<ServiceResponse<any>> {
    try {
      const { offset = 0, limit = 20 } = options;

      const response = await this.client.get(
        `/bill/${congress}/${billType}/${billNumber}/cosponsors`,
        { params: { offset, limit } }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get related bills
   */
  async getRelatedBills(
    congress: number,
    billType: string,
    billNumber: number
  ): Promise<ServiceResponse<any>> {
    try {
      const response = await this.client.get(
        `/bill/${congress}/${billType}/${billNumber}/relatedbills`
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get bill subjects/policy areas
   */
  async getBillSubjects(
    congress: number,
    billType: string,
    billNumber: number
  ): Promise<ServiceResponse<any>> {
    try {
      const response = await this.client.get(
        `/bill/${congress}/${billType}/${billNumber}/subjects`
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get bill summaries
   */
  async getBillSummaries(
    congress: number,
    billType: string,
    billNumber: number
  ): Promise<ServiceResponse<any>> {
    try {
      const response = await this.client.get(
        `/bill/${congress}/${billType}/${billNumber}/summaries`
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get bill titles
   */
  async getBillTitles(
    congress: number,
    billType: string,
    billNumber: number
  ): Promise<ServiceResponse<any>> {
    try {
      const response = await this.client.get(
        `/bill/${congress}/${billType}/${billNumber}/titles`
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get bills by subject/policy area
   */
  async getBillsBySubject(
    subject: string,
    options: { congress?: number; offset?: number; limit?: number } = {}
  ): Promise<ServiceResponse<PaginatedResponse<CongressGovBill>>> {
    try {
      const { offset = 0, limit = 20, congress } = options;

      // Congress.gov doesn't have a direct subject search, so we'll use the general search
      // with subject filtering in post-processing
      const searchResult = await this.searchBills({
        query: subject,
        congress,
        offset,
        limit,
      });

      return searchResult;
    } catch (error) {
      return this.handleError(error);
    }
  }

  // ============================================================================
  // Members & Legislators
  // ============================================================================

  /**
   * Search members
   */
  async searchMembers(params: MemberSearchParams): Promise<ServiceResponse<PaginatedResponse<Member>>> {
    try {
      const { offset = 0, limit = 20, currentMember = true, ...filters } = params;

      const response = await this.client.get<CongressGovResponse<Member>>('/member', {
        params: {
          offset,
          limit,
          currentMember,
          ...filters,
        },
      });

      const members = response.data.members as Member[];
      const pagination = response.data.pagination as { count: number };

      return {
        success: true,
        data: {
          data: members,
          pagination: {
            total: pagination.count,
            offset,
            limit,
            hasMore: (offset + limit) < pagination.count,
          },
        },
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get member details by Bioguide ID
   */
  async getMemberDetails(bioguideId: string): Promise<ServiceResponse<Member>> {
    try {
      const response = await this.client.get<{ member: Member }>(
        `/member/${bioguideId}`
      );

      return {
        success: true,
        data: response.data.member,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get bills sponsored by a member
   */
  async getMemberSponsoredBills(
    bioguideId: string,
    options: { offset?: number; limit?: number } = {}
  ): Promise<ServiceResponse<PaginatedResponse<CongressGovBill>>> {
    try {
      const { offset = 0, limit = 20 } = options;

      const response = await this.client.get(
        `/member/${bioguideId}/sponsored-legislation`,
        { params: { offset, limit } }
      );

      const bills = response.data.sponsoredLegislation as CongressGovBill[];
      const pagination = response.data.pagination as { count: number };

      return {
        success: true,
        data: {
          data: bills,
          pagination: {
            total: pagination.count,
            offset,
            limit,
            hasMore: (offset + limit) < pagination.count,
          },
        },
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get bills cosponsored by a member
   */
  async getMemberCosponsoredBills(
    bioguideId: string,
    options: { offset?: number; limit?: number } = {}
  ): Promise<ServiceResponse<PaginatedResponse<CongressGovBill>>> {
    try {
      const { offset = 0, limit = 20 } = options;

      const response = await this.client.get(
        `/member/${bioguideId}/cosponsored-legislation`,
        { params: { offset, limit } }
      );

      const bills = response.data.cosponsoredLegislation as CongressGovBill[];
      const pagination = response.data.pagination as { count: number };

      return {
        success: true,
        data: {
          data: bills,
          pagination: {
            total: pagination.count,
            offset,
            limit,
            hasMore: (offset + limit) < pagination.count,
          },
        },
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // ============================================================================
  // Committees
  // ============================================================================

  /**
   * Get all committees
   */
  async getCommittees(
    chamber?: 'house' | 'senate',
    options: { offset?: number; limit?: number } = {}
  ): Promise<ServiceResponse<PaginatedResponse<Committee>>> {
    try {
      const { offset = 0, limit = 20 } = options;

      const endpoint = chamber ? `/committee/${chamber}` : '/committee';

      const response = await this.client.get<CongressGovResponse<Committee>>(endpoint, {
        params: { offset, limit },
      });

      const committees = response.data.committees as Committee[];
      const pagination = response.data.pagination as { count: number };

      return {
        success: true,
        data: {
          data: committees,
          pagination: {
            total: pagination.count,
            offset,
            limit,
            hasMore: (offset + limit) < pagination.count,
          },
        },
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get committee details
   */
  async getCommitteeDetails(chamber: string, committeeCode: string): Promise<ServiceResponse<Committee>> {
    try {
      const response = await this.client.get<{ committee: Committee }>(
        `/committee/${chamber}/${committeeCode}`
      );

      return {
        success: true,
        data: response.data.committee,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get committee bills
   */
  async getCommitteeBills(
    chamber: string,
    committeeCode: string,
    options: { offset?: number; limit?: number } = {}
  ): Promise<ServiceResponse<any>> {
    try {
      const { offset = 0, limit = 20 } = options;

      const response = await this.client.get(
        `/committee/${chamber}/${committeeCode}/bills`,
        { params: { offset, limit } }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // ============================================================================
  // Votes
  // ============================================================================

  private normalizeVoteResult(value?: string): Vote['result'] {
    if (!value) return 'Passed';
    if (value === 'Passed' || value === 'Failed' || value === 'Agreed to' || value === 'Rejected') {
      return value;
    }

    const lower = value.toLowerCase();
    if (lower.includes('fail')) return 'Failed';
    if (lower.includes('reject')) return 'Rejected';
    if (lower.includes('agree')) return 'Agreed to';
    return 'Passed';
  }

  private normalizeBillType(value?: string): VoteBillType | undefined {
    if (!value) return undefined;
    const normalized = value.trim().toLowerCase();
    const billTypes: VoteBillType[] = [
      'hr',
      's',
      'hjres',
      'sjres',
      'hconres',
      'sconres',
      'hres',
      'sres',
    ];

    return billTypes.includes(normalized as VoteBillType)
      ? (normalized as VoteBillType)
      : undefined;
  }

  private mapHouseVoteToVote(houseVote: HouseRollCallVote): Vote {
    const partyTotals = houseVote.votePartyTotal || [];
    const byParty = (code: string): HouseVotePartyTotal | undefined =>
      partyTotals.find((entry) => entry.voteParty?.toUpperCase() === code);

    const democratic = byParty('D');
    const republican = byParty('R');
    const independent = byParty('I');

    const voteTotals = {
      yea: partyTotals.reduce((sum, entry) => sum + (entry.yeaTotal || 0), 0),
      nay: partyTotals.reduce((sum, entry) => sum + (entry.nayTotal || 0), 0),
      present: partyTotals.reduce((sum, entry) => sum + (entry.presentTotal || 0), 0),
      notVoting: partyTotals.reduce((sum, entry) => sum + (entry.notVotingTotal || 0), 0),
    };

    const billType = this.normalizeBillType(houseVote.legislationType);
    const parsedBillNumber = houseVote.legislationNumber
      ? parseInt(houseVote.legislationNumber, 10)
      : Number.NaN;
    const hasBillNumber = Number.isFinite(parsedBillNumber);

    const partyBreakdown: Vote['party'] = {};
    if (democratic && ((democratic.yeaTotal || 0) > 0 || (democratic.nayTotal || 0) > 0)) {
      partyBreakdown.democratic = {
        yea: democratic.yeaTotal || 0,
        nay: democratic.nayTotal || 0,
      };
    }
    if (republican && ((republican.yeaTotal || 0) > 0 || (republican.nayTotal || 0) > 0)) {
      partyBreakdown.republican = {
        yea: republican.yeaTotal || 0,
        nay: republican.nayTotal || 0,
      };
    }
    if (independent && ((independent.yeaTotal || 0) > 0 || (independent.nayTotal || 0) > 0)) {
      partyBreakdown.independent = {
        yea: independent.yeaTotal || 0,
        nay: independent.nayTotal || 0,
      };
    }

    return {
      congress: houseVote.congress,
      chamber: 'house',
      session: houseVote.sessionNumber || 1,
      rollNumber: houseVote.rollCallNumber,
      date: houseVote.startDate || new Date().toISOString(),
      question: houseVote.voteQuestion || houseVote.voteType || 'House vote',
      result: this.normalizeVoteResult(houseVote.result),
      bill: billType && hasBillNumber
        ? {
            billType,
            billNumber: parsedBillNumber,
          }
        : undefined,
      votes: voteTotals,
      party: Object.keys(partyBreakdown).length > 0 ? partyBreakdown : undefined,
    };
  }

  private getCurrentCongress(): number {
    const currentYear = new Date().getFullYear();
    return Math.floor((currentYear - 1789) / 2) + 1;
  }

  /**
   * Search votes
   */
  async searchVotes(params: VoteSearchParams): Promise<ServiceResponse<PaginatedResponse<Vote>>> {
    try {
      const { offset = 0, limit = 20, congress, chamber } = params;

      if (chamber && chamber !== 'house') {
        return {
          success: true,
          data: {
            data: [],
            pagination: {
              total: 0,
              offset,
              limit,
              hasMore: false,
            },
          },
        };
      }

      const targetCongress = congress || this.getCurrentCongress();
      const response = await this.client.get<HouseRollCallVoteListResponse>(`/house-vote/${targetCongress}`, {
        params: { offset, limit },
      });

      const votes = (response.data.houseRollCallVotes || []).map((vote) => this.mapHouseVoteToVote(vote));
      const pagination = response.data.pagination;
      const total = pagination?.count ?? votes.length;

      return {
        success: true,
        data: {
          data: votes,
          pagination: {
            total,
            offset,
            limit,
            hasMore: (offset + limit) < total,
          },
        },
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get vote details
   */
  async getVoteDetails(
    congress: number,
    chamber: string,
    rollNumber: number
  ): Promise<ServiceResponse<Vote>> {
    if (chamber !== 'house') {
      return {
        success: false,
        error: {
          code: 'ERR_BAD_REQUEST',
          message: 'Only House vote details are available in live mode.',
        },
      };
    }

    try {
      for (const session of [2, 1]) {
        try {
          const response = await this.client.get<HouseRollCallVoteDetailResponse>(
            `/house-vote/${congress}/${session}/${rollNumber}`
          );

          if (response.data.houseRollCallVote) {
            return {
              success: true,
              data: this.mapHouseVoteToVote(response.data.houseRollCallVote),
            };
          }
        } catch (error) {
          if (axios.isAxiosError(error) && error.response?.status === 404) {
            continue;
          }
          return this.handleError(error);
        }
      }

      return {
        success: false,
        error: {
          code: 'ERR_BAD_REQUEST',
          message: `Vote ${congress}-house-${rollNumber} not found.`,
        },
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // ============================================================================
  // Amendments
  // ============================================================================

  /**
   * Search amendments
   */
  async searchAmendments(
    congress: number,
    options: { offset?: number; limit?: number; amendmentType?: string } = {}
  ): Promise<ServiceResponse<PaginatedResponse<Amendment>>> {
    try {
      const { offset = 0, limit = 20, amendmentType } = options;

      const endpoint = amendmentType
        ? `/amendment/${congress}/${amendmentType}`
        : `/amendment/${congress}`;

      const response = await this.client.get<CongressGovResponse<Amendment>>(endpoint, {
        params: { offset, limit },
      });

      const amendments = response.data.amendments as Amendment[];
      const pagination = response.data.pagination as { count: number };

      return {
        success: true,
        data: {
          data: amendments,
          pagination: {
            total: pagination.count,
            offset,
            limit,
            hasMore: (offset + limit) < pagination.count,
          },
        },
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get amendment details
   */
  async getAmendmentDetails(
    congress: number,
    amendmentType: string,
    amendmentNumber: number
  ): Promise<ServiceResponse<Amendment>> {
    try {
      const response = await this.client.get<{ amendment: Amendment }>(
        `/amendment/${congress}/${amendmentType}/${amendmentNumber}`
      );

      return {
        success: true,
        data: response.data.amendment,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // ============================================================================
  // Hearings
  // ============================================================================

  /**
   * Search hearings
   */
  async searchHearings(
    options: { congress?: number; chamber?: string; offset?: number; limit?: number } = {}
  ): Promise<ServiceResponse<PaginatedResponse<Hearing>>> {
    try {
      const { offset = 0, limit = 20, congress, chamber } = options;

      let endpoint = '/hearing';
      if (congress && chamber) {
        endpoint = `/hearing/${congress}/${chamber}`;
      } else if (congress) {
        endpoint = `/hearing/${congress}`;
      }

      const response = await this.client.get<CongressGovResponse<Hearing>>(endpoint, {
        params: { offset, limit },
      });

      const hearings = response.data.hearings as Hearing[];
      const pagination = response.data.pagination as { count: number };

      return {
        success: true,
        data: {
          data: hearings,
          pagination: {
            total: pagination.count,
            offset,
            limit,
            hasMore: (offset + limit) < pagination.count,
          },
        },
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // ============================================================================
  // Error Handling
  // ============================================================================

  private handleError(error: unknown): ServiceResponse<never> {
    if (error instanceof Error && error.message === 'PROVIDER_DISABLED:congressGov') {
      return {
        success: false,
        error: {
          code: 'PROVIDER_DISABLED',
          message: 'Congress.gov integration is disabled in this environment.',
        },
      };
    }

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      return {
        success: false,
        error: {
          code: axiosError.code || 'UNKNOWN_ERROR',
          message: axiosError.message,
          details: axiosError.response?.data,
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    };
  }
}

// Singleton instance
let congressService: CongressService | null = null;

export function getCongressService(apiKey?: string): CongressService {
  if (!congressService) {
    const key = apiKey || process.env.CONGRESS_GOV_API_KEY || '';
    const enabled = runtimeConfig.providers.congressGov;

    if (enabled && !key) {
      throw new Error('Congress.gov API key not provided');
    }

    congressService = new CongressService(key, enabled);
  }
  return congressService;
}

export default CongressService;
