/**
 * Knowledge Graph Types
 * Type definitions for the legislative relationship graph
 */

export type NodeType = 'member' | 'bill' | 'committee' | 'lobbyist' | 'donor' | 'district';

export type EdgeType =
  | 'sponsors'       // member → bill
  | 'cosponsors'     // member → bill
  | 'voted_on'       // member → bill (with position)
  | 'member_of'      // member → committee
  | 'chairs'         // member → committee
  | 'lobbied_for'    // lobbyist → bill
  | 'donated_to'     // donor → member
  | 'represents'     // member → district
  | 'referred_to'    // bill → committee
  | 'amends';        // bill → bill

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  data: Record<string, unknown>;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: EdgeType;
  weight: number;
  data?: Record<string, unknown>;
}

export interface PathResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  length: number;
}

export interface ConnectionResult {
  node: GraphNode;
  edges: GraphEdge[];
  depth: number;
}

export interface InfluenceScore {
  nodeId: string;
  score: number;
  factors: {
    factor: string;
    value: number;
  }[];
}
