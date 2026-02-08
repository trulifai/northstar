/**
 * Knowledge Graph Routes
 * Relationship queries, pathfinding, and influence analysis
 */

import { Router, Request, Response } from 'express';
import { graphEngine } from '../graph/engine';
import { graphIngestionService } from '../graph/ingestion.service';
import { asyncHandler, NotFoundError } from '../middleware/errorHandler';
import { cacheResponse } from '../middleware/cacheMiddleware';
import { CacheTTL, CachePrefix } from '../lib/cache';
import type { NodeType } from '../graph/types';

const router = Router();

/**
 * GET /api/graph/stats
 * Get knowledge graph statistics
 */
router.get(
  '/stats',
  cacheResponse({ ttlSeconds: CacheTTL.SHORT, prefix: CachePrefix.GRAPH }),
  asyncHandler(async (_req: Request, res: Response) => {
    const stats = graphEngine.getStats();

    res.json({
      success: true,
      data: stats,
    });
  })
);

/**
 * GET /api/graph/connections/:nodeId
 * Get all connections from a node
 */
router.get(
  '/connections/:nodeId',
  cacheResponse({ ttlSeconds: CacheTTL.MEDIUM, prefix: CachePrefix.GRAPH }),
  asyncHandler(async (req: Request, res: Response) => {
    const nodeId = req.params.nodeId as string;
    const depth = Math.min(parseInt(req.query.depth as string) || 2, 4);
    const filterType = req.query.type as NodeType | undefined;

    const node = graphEngine.getNode(nodeId);
    if (!node) throw new NotFoundError('Graph node');

    const connections = graphEngine.getConnections(nodeId, depth, filterType);

    res.json({
      success: true,
      data: {
        source: node,
        connections: connections.slice(0, 100),
        total: connections.length,
      },
    });
  })
);

/**
 * GET /api/graph/path/:from/:to
 * Find shortest path between two nodes
 */
router.get(
  '/path/:from/:to',
  cacheResponse({ ttlSeconds: CacheTTL.MEDIUM, prefix: CachePrefix.GRAPH }),
  asyncHandler(async (req: Request, res: Response) => {
    const fromId = req.params.from as string;
    const toId = req.params.to as string;

    const path = graphEngine.findPath(fromId, toId);

    if (!path) {
      res.json({
        success: true,
        data: null,
        message: 'No path found between these nodes',
      });
      return;
    }

    res.json({
      success: true,
      data: path,
    });
  })
);

/**
 * GET /api/graph/influence/:nodeId
 * Compute influence score for a node
 */
router.get(
  '/influence/:nodeId',
  cacheResponse({ ttlSeconds: CacheTTL.LONG, prefix: CachePrefix.GRAPH }),
  asyncHandler(async (req: Request, res: Response) => {
    const nodeId = req.params.nodeId as string;

    const node = graphEngine.getNode(nodeId);
    if (!node) throw new NotFoundError('Graph node');

    const influence = graphEngine.computeInfluence(nodeId);

    res.json({
      success: true,
      data: influence,
    });
  })
);

/**
 * POST /api/graph/build
 * Build/rebuild the knowledge graph from database
 */
router.post(
  '/build',
  asyncHandler(async (_req: Request, res: Response) => {
    const result = await graphIngestionService.buildGraph();

    res.json({
      success: true,
      data: result,
    });
  })
);

export default router;
