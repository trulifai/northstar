/**
 * Members Routes
 * 
 * Endpoints for congressional members (representatives and senators)
 */

const express = require('express');
const router = express.Router();

/**
 * GET /api/members
 * 
 * List congressional members
 * 
 * Query params:
 * - congress: Congress number (default: current)
 * - chamber: house, senate, or both (default: both)
 * - state: Two-letter state code
 * - party: D, R, or I
 */
router.get('/', async (req, res, next) => {
  try {
    // TODO: Implement member listing
    res.status(501).json({
      error: 'Not Implemented',
      message: 'Member listing coming soon'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/members/:bioguideId
 * 
 * Get details for a specific member
 * 
 * Example: GET /api/members/S000033 (Bernie Sanders)
 */
router.get('/:bioguideId', async (req, res, next) => {
  try {
    // TODO: Implement member details
    res.status(501).json({
      error: 'Not Implemented',
      message: 'Member details coming soon'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
