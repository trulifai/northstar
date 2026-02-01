/**
 * Votes Routes
 * 
 * Endpoints for roll-call votes
 */

const express = require('express');
const router = express.Router();

/**
 * GET /api/votes
 * 
 * List recent votes
 * 
 * Query params:
 * - congress: Congress number (default: current)
 * - chamber: house or senate
 * - limit: Results per page
 */
router.get('/', async (req, res, next) => {
  try {
    // TODO: Implement vote listing
    res.status(501).json({
      error: 'Not Implemented',
      message: 'Vote listing coming soon'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/votes/:voteId
 * 
 * Get details for a specific vote
 * 
 * Example: GET /api/votes/hr123-118
 */
router.get('/:voteId', async (req, res, next) => {
  try {
    // TODO: Implement vote details
    res.status(501).json({
      error: 'Not Implemented',
      message: 'Vote details coming soon'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
