/**
 * Congress.gov API Service
 * Complete integration with official Congress.gov REST API
 * 
 * API Documentation: https://api.congress.gov/
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
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

export class CongressService {
  private readonly client: AxiosInstance;
  private readonly baseURL = 'https://api.congress.gov/v3';
  private readonly apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Congress.gov API key is required');
    }

    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
      },
      params: {
        api_key: this.apiKey,
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
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

  /**
   * Search votes
   */
  async searchVotes(params: VoteSearchParams): Promise<ServiceResponse<PaginatedResponse<Vote>>> {
    try {
      const { offset = 0, limit = 20, congress, chamber } = params;

      let endpoint = '/vote';
      if (congress && chamber) {
        endpoint = `/vote/${congress}/${chamber}`;
      }

      const response = await this.client.get<CongressGovResponse<Vote>>(endpoint, {
        params: { offset, limit },
      });

      const votes = response.data.votes as Vote[];
      const pagination = response.data.pagination as { count: number };

      return {
        success: true,
        data: {
          data: votes,
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
   * Get vote details
   */
  async getVoteDetails(
    congress: number,
    chamber: string,
    rollNumber: number
  ): Promise<ServiceResponse<Vote>> {
    try {
      const response = await this.client.get<{ vote: Vote }>(
        `/vote/${congress}/${chamber}/${rollNumber}`
      );

      return {
        success: true,
        data: response.data.vote,
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
    const key = apiKey || process.env.CONGRESS_GOV_API_KEY;
    if (!key) {
      throw new Error('Congress.gov API key not provided');
    }
    congressService = new CongressService(key);
  }
  return congressService;
}

export default CongressService;
