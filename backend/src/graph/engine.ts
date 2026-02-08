/**
 * Knowledge Graph Engine
 * In-memory typed graph with adjacency lists, BFS/DFS pathfinding
 */

import { GraphNode, GraphEdge, NodeType, PathResult, ConnectionResult, InfluenceScore } from './types';

export class GraphEngine {
  private nodes = new Map<string, GraphNode>();
  private adjacency = new Map<string, GraphEdge[]>();
  private reverseAdjacency = new Map<string, GraphEdge[]>();

  get nodeCount(): number { return this.nodes.size; }
  get edgeCount(): number {
    let count = 0;
    for (const edges of this.adjacency.values()) count += edges.length;
    return count;
  }

  /**
   * Add a node to the graph
   */
  addNode(node: GraphNode): void {
    this.nodes.set(node.id, node);
    if (!this.adjacency.has(node.id)) this.adjacency.set(node.id, []);
    if (!this.reverseAdjacency.has(node.id)) this.reverseAdjacency.set(node.id, []);
  }

  /**
   * Add a directed edge between two nodes
   */
  addEdge(edge: GraphEdge): void {
    const outEdges = this.adjacency.get(edge.source) || [];
    // Avoid duplicate edges
    const exists = outEdges.some(e => e.target === edge.target && e.type === edge.type);
    if (!exists) {
      outEdges.push(edge);
      this.adjacency.set(edge.source, outEdges);

      const inEdges = this.reverseAdjacency.get(edge.target) || [];
      inEdges.push(edge);
      this.reverseAdjacency.set(edge.target, inEdges);
    }
  }

  /**
   * Get a node by ID
   */
  getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  /**
   * Get all edges from a node
   */
  getEdgesFrom(id: string): GraphEdge[] {
    return this.adjacency.get(id) || [];
  }

  /**
   * Get all edges to a node
   */
  getEdgesTo(id: string): GraphEdge[] {
    return this.reverseAdjacency.get(id) || [];
  }

  /**
   * Get all connections from a node within a depth limit (BFS)
   */
  getConnections(nodeId: string, maxDepth: number = 2, filterType?: NodeType): ConnectionResult[] {
    const results: ConnectionResult[] = [];
    const visited = new Set<string>();
    const queue: { id: string; depth: number; edges: GraphEdge[] }[] = [{ id: nodeId, depth: 0, edges: [] }];

    visited.add(nodeId);

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.depth > maxDepth) break;

      if (current.id !== nodeId) {
        const node = this.nodes.get(current.id);
        if (node && (!filterType || node.type === filterType)) {
          results.push({ node, edges: current.edges, depth: current.depth });
        }
      }

      if (current.depth < maxDepth) {
        // Traverse both outgoing and incoming edges
        const outEdges = this.adjacency.get(current.id) || [];
        const inEdges = this.reverseAdjacency.get(current.id) || [];
        const allNeighbors = [
          ...outEdges.map(e => ({ id: e.target, edge: e })),
          ...inEdges.map(e => ({ id: e.source, edge: e })),
        ];

        for (const { id, edge } of allNeighbors) {
          if (!visited.has(id)) {
            visited.add(id);
            queue.push({ id, depth: current.depth + 1, edges: [...current.edges, edge] });
          }
        }
      }
    }

    return results;
  }

  /**
   * Find shortest path between two nodes (BFS)
   */
  findPath(fromId: string, toId: string, maxDepth: number = 6): PathResult | null {
    if (!this.nodes.has(fromId) || !this.nodes.has(toId)) return null;
    if (fromId === toId) return { nodes: [this.nodes.get(fromId)!], edges: [], length: 0 };

    const visited = new Set<string>();
    const parent = new Map<string, { nodeId: string; edge: GraphEdge }>();
    const queue: string[] = [fromId];
    visited.add(fromId);

    let depth = 0;
    let levelSize = queue.length;

    while (queue.length > 0 && depth < maxDepth) {
      const current = queue.shift()!;
      levelSize--;

      const outEdges = this.adjacency.get(current) || [];
      const inEdges = this.reverseAdjacency.get(current) || [];
      const neighbors = [
        ...outEdges.map(e => ({ id: e.target, edge: e })),
        ...inEdges.map(e => ({ id: e.source, edge: e })),
      ];

      for (const { id, edge } of neighbors) {
        if (!visited.has(id)) {
          visited.add(id);
          parent.set(id, { nodeId: current, edge });
          queue.push(id);

          if (id === toId) {
            // Reconstruct path
            const pathNodes: GraphNode[] = [];
            const pathEdges: GraphEdge[] = [];
            let cur = toId;

            while (cur !== fromId) {
              const p = parent.get(cur)!;
              pathNodes.unshift(this.nodes.get(cur)!);
              pathEdges.unshift(p.edge);
              cur = p.nodeId;
            }
            pathNodes.unshift(this.nodes.get(fromId)!);

            return { nodes: pathNodes, edges: pathEdges, length: pathNodes.length - 1 };
          }
        }
      }

      if (levelSize === 0) {
        depth++;
        levelSize = queue.length;
      }
    }

    return null; // No path found
  }

  /**
   * Compute influence score for a node based on graph centrality
   */
  computeInfluence(nodeId: string): InfluenceScore {
    const factors: InfluenceScore['factors'] = [];

    const outEdges = this.adjacency.get(nodeId) || [];
    const inEdges = this.reverseAdjacency.get(nodeId) || [];

    // Degree centrality
    const outDegree = outEdges.length;
    const inDegree = inEdges.length;
    const totalDegree = outDegree + inDegree;
    factors.push({ factor: 'connections', value: totalDegree });

    // Weighted connections
    const totalWeight = [...outEdges, ...inEdges].reduce((sum, e) => sum + e.weight, 0);
    factors.push({ factor: 'weighted_connections', value: totalWeight });

    // Connection diversity (how many different node types are connected)
    const connectedTypes = new Set<string>();
    for (const e of outEdges) {
      const target = this.nodes.get(e.target);
      if (target) connectedTypes.add(target.type);
    }
    for (const e of inEdges) {
      const source = this.nodes.get(e.source);
      if (source) connectedTypes.add(source.type);
    }
    factors.push({ factor: 'type_diversity', value: connectedTypes.size });

    // Compute overall score (normalized to 0-100)
    const score = Math.min(100, Math.round(
      (totalDegree * 2) + (totalWeight * 0.5) + (connectedTypes.size * 10)
    ));

    return { nodeId, score, factors };
  }

  /**
   * Get nodes by type
   */
  getNodesByType(type: NodeType, limit?: number): GraphNode[] {
    const results: GraphNode[] = [];
    for (const node of this.nodes.values()) {
      if (node.type === type) {
        results.push(node);
        if (limit && results.length >= limit) break;
      }
    }
    return results;
  }

  /**
   * Clear the entire graph
   */
  clear(): void {
    this.nodes.clear();
    this.adjacency.clear();
    this.reverseAdjacency.clear();
  }

  /**
   * Get graph stats
   */
  getStats(): {
    nodes: number;
    edges: number;
    nodesByType: Record<string, number>;
    edgesByType: Record<string, number>;
  } {
    const nodesByType: Record<string, number> = {};
    for (const node of this.nodes.values()) {
      nodesByType[node.type] = (nodesByType[node.type] || 0) + 1;
    }

    const edgesByType: Record<string, number> = {};
    for (const edges of this.adjacency.values()) {
      for (const edge of edges) {
        edgesByType[edge.type] = (edgesByType[edge.type] || 0) + 1;
      }
    }

    return {
      nodes: this.nodeCount,
      edges: this.edgeCount,
      nodesByType,
      edgesByType,
    };
  }
}

export const graphEngine = new GraphEngine();
