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
    
    return fetchApi<Bill[]>(`/bills?${query.toString()}`);
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
    
    return fetchApi<Member[]>(`/members?${query.toString()}`);
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
    
    return fetchApi<Vote[]>(`/votes?${query.toString()}`);
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
    
    return fetchApi<Committee[]>(`/committees?${query.toString()}`);
  },
};

export default {
  bills: billsApi,
  members: membersApi,
  votes: votesApi,
  committees: committeesApi,
};
