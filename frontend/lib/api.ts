/**
 * Northstar API Client
 * Connects to backend API at http://localhost:3000/api
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    total: number;
    offset: number;
    limit: number;
    hasMore: boolean;
  };
  error?: string;
}

export interface Bill {
  congress: number;
  type: string;
  number: number;
  title: string;
  latestAction: {
    actionDate: string;
    text: string;
  };
  introducedDate?: string;
  url: string;
  originChamber?: string;
}

export interface Member {
  bioguideId: string;
  name: string;
  fullName?: string;
  partyName: string;
  state: string;
  district?: number;
  depiction?: {
    imageUrl: string;
  };
  url: string;
}

export interface Vote {
  congress: number;
  chamber: string;
  rollNumber: number;
  date: string;
  question: string;
  result: string;
  votes?: {
    yea: number;
    nay: number;
    present: number;
    notVoting: number;
  };
}

export interface Committee {
  systemCode: string;
  name: string;
  chamber: string;
  committeeType?: string;
  url: string;
}

interface BillApiRecord {
  congress: number;
  type?: string;
  number?: number;
  title?: string;
  latestAction?: {
    actionDate: string;
    text: string;
  };
  introducedDate?: string;
  url?: string;
  originChamber?: string;
  billType?: string;
  billNumber?: number;
  latestActionDate?: string;
  latestActionText?: string;
  congressGovUrl?: string;
}

interface MemberApiRecord {
  bioguideId: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  party?: string;
  partyName?: string;
  state: string;
  district?: number | null;
  depiction?: {
    imageUrl: string;
  };
  url?: string;
}

interface VoteApiRecord {
  congress: number;
  chamber: string;
  rollNumber: number;
  date?: string;
  question?: string;
  result?: string;
  votes?: {
    yea: number;
    nay: number;
    present: number;
    notVoting: number;
  };
  voteDate?: string;
  voteQuestion?: string;
  voteResult?: string;
}

interface CommitteeApiRecord {
  systemCode?: string;
  committeeCode?: string;
  name: string;
  chamber: string;
  committeeType?: string;
  website?: string;
  url?: string;
}

async function fetchApi<T>(endpoint: string): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);
  
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  
  return response.json();
}

// Bills API
export const billsApi = {
  search: async (params: { 
    congress?: number; 
    query?: string; 
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<Bill[]>> => {
    const query = new URLSearchParams();
    if (params.congress) query.append('congress', params.congress.toString());
    if (params.query) query.append('query', params.query);
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.offset) query.append('offset', params.offset.toString());
    
    const response = await fetchApi<BillApiRecord[]>(`/bills?${query.toString()}`);

    const data = (response.data || []).map((bill): Bill => ({
      congress: bill.congress,
      type: bill.type || bill.billType || 'bill',
      number: bill.number || bill.billNumber || 0,
      title: bill.title || '',
      latestAction: bill.latestAction || {
        actionDate: bill.latestActionDate || '',
        text: bill.latestActionText || '',
      },
      introducedDate: bill.introducedDate,
      url: bill.url || bill.congressGovUrl || '',
      originChamber: bill.originChamber,
    }));

    return { ...response, data };
  },
  
  getDetails: async (congress: number, billType: string, billNumber: number) => {
    return fetchApi(`/bills/${congress}/${billType}/${billNumber}`);
  },
};

// Members API
export const membersApi = {
  search: async (params: {
    state?: string;
    party?: string;
    chamber?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<Member[]>> => {
    const query = new URLSearchParams();
    if (params.state) query.append('state', params.state);
    if (params.party) query.append('party', params.party);
    if (params.chamber) query.append('chamber', params.chamber);
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.offset) query.append('offset', params.offset.toString());
    
    const response = await fetchApi<MemberApiRecord[]>(`/members?${query.toString()}`);

    const data = (response.data || []).map((member): Member => {
      const fallbackName = [member.firstName, member.lastName].filter(Boolean).join(' ').trim();

      return {
        bioguideId: member.bioguideId,
        name: member.name || member.fullName || fallbackName || member.bioguideId,
        fullName: member.fullName,
        partyName: member.partyName || member.party || 'Unknown',
        state: member.state,
        district: member.district ?? undefined,
        depiction: member.depiction,
        url: member.url || '',
      };
    });

    return { ...response, data };
  },
  
  getDetails: async (bioguideId: string) => {
    return fetchApi(`/members/${bioguideId}`);
  },
  
  getSponsoredBills: async (bioguideId: string, params?: { limit?: number; offset?: number }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.offset) query.append('offset', params.offset.toString());
    
    return fetchApi(`/members/${bioguideId}/sponsored-bills?${query.toString()}`);
  },
};

// Votes API
export const votesApi = {
  search: async (params: {
    congress?: number;
    chamber?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<Vote[]>> => {
    const query = new URLSearchParams();
    if (params.congress) query.append('congress', params.congress.toString());
    if (params.chamber) query.append('chamber', params.chamber);
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.offset) query.append('offset', params.offset.toString());
    
    const response = await fetchApi<VoteApiRecord[]>(`/votes?${query.toString()}`);

    const data = (response.data || []).map((vote): Vote => ({
      congress: vote.congress,
      chamber: vote.chamber,
      rollNumber: vote.rollNumber,
      date: vote.date || vote.voteDate || '',
      question: vote.question || vote.voteQuestion || '',
      result: vote.result || vote.voteResult || '',
      votes: vote.votes,
    }));

    return { ...response, data };
  },
};

// Committees API
export const committeesApi = {
  search: async (params: {
    chamber?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<Committee[]>> => {
    const query = new URLSearchParams();
    if (params.chamber) query.append('chamber', params.chamber);
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.offset) query.append('offset', params.offset.toString());
    
    const response = await fetchApi<CommitteeApiRecord[]>(`/committees?${query.toString()}`);

    const data = (response.data || []).map((committee): Committee => ({
      systemCode: committee.systemCode || committee.committeeCode || '',
      name: committee.name,
      chamber: committee.chamber,
      committeeType: committee.committeeType,
      url: committee.url || committee.website || '',
    }));

    return { ...response, data };
  },
};

// Stats API
export const statsApi = {
  get: async (): Promise<ApiResponse<{
    counts: {
      bills: number;
      members: number;
      committees: number;
      votes: number;
      amendments: number;
      hearings: number;
      lobbyingReports: number;
      campaignContributions: number;
    };
    lastSync: {
      bills: string | null;
      members: string | null;
      votes: string | null;
    };
    congress: number;
  }>> => {
    return fetchApi('/stats');
  },
};

const apiClient = {
  bills: billsApi,
  members: membersApi,
  votes: votesApi,
  committees: committeesApi,
  stats: statsApi,
};

export default apiClient;
