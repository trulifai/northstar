/**
 * Bills Routes
 * 
 * Endpoints for searching and retrieving bill data
 */

const express = require('express');
const router = express.Router();
const congressService = require('../services/congressService');

/**
 * GET /api/bills
 * 
 * Search and list bills
 * 
 * Query params:
 * - congress: Congress number (default: current)
 * - limit: Results per page (default: 20, max: 250)
 * - offset: Pagination offset (default: 0)
 * - sort: Sort order (updateDate-desc, updateDate-asc)
 * - type: Bill type (hr, s, hjres, sjres, hconres, sconres, hres, sres)
 * 
 * Example: GET /api/bills?congress=118&limit=10&sort=updateDate-desc
 */
router.get('/', async (req, res, next) => {
  try {
    const {
      congress = '118',
      limit = 20,
      offset = 0,
      sort = 'updateDate-desc',
      type
    } = req.query;

    // TODO: Call Congress.gov API
    // const bills = await congressService.getBills({ congress, limit, offset, sort, type });

    // DEMO: Return sample data for now
    const bills = {
      request: {
        congress,
        limit,
        offset,
        sort,
        type
      },
      bills: [
        {
          billNumber: "H.R. 1234",
          title: "Example Climate Change Bill",
          congress: 118,
          type: "HR",
          introducedDate: "2025-01-15",
          updateDate: "2025-01-30",
          sponsors: [
            {
              name: "Rep. Example",
              party: "D",
              state: "CA"
            }
          ],
          status: "Introduced"
        }
      ],
      pagination: {
        count: 1,
        next: `/api/bills?congress=${congress}&limit=${limit}&offset=${parseInt(offset) + parseInt(limit)}`
      }
    };

    res.json(bills);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/bills/:billId
 * 
 * Get details for a specific bill
 * 
 * Example: GET /api/bills/hr1234-118
 */
router.get('/:billId', async (req, res, next) => {
  try {
    const { billId } = req.params;

    // TODO: Parse billId (format: hr1234-118 → type=hr, number=1234, congress=118)
    // TODO: Call Congress.gov API for bill details
    // const bill = await congressService.getBillDetails(billId);

    // DEMO: Return sample data
    const bill = {
      billNumber: "H.R. 1234",
      title: "Example Climate Change Bill",
      congress: 118,
      type: "HR",
      introducedDate: "2025-01-15",
      updateDate: "2025-01-30",
      sponsors: [
        {
          name: "Rep. Example",
          party: "D",
          state: "CA",
          bioguideId: "E000001"
        }
      ],
      cosponsors: [],
      committees: ["Energy and Commerce"],
      actions: [
        {
          date: "2025-01-15",
          text: "Introduced in House"
        }
      ],
      summary: "A bill to address climate change through renewable energy incentives.",
      status: "Introduced",
      url: "https://www.congress.gov/bill/118th-congress/house-bill/1234"
    };

    res.json(bill);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/bills/search (Phase 2: AI Feature)
 * 
 * Natural language search for bills
 * 
 * Body:
 * {
 *   "query": "climate bills from Texas senators"
 * }
 */
router.post('/search', async (req, res, next) => {
  try {
    const { query } = req.body;

    // TODO: Phase 2 - Use Gemini to parse natural language query
    // TODO: Convert to structured Congress.gov API parameters
    // TODO: Return results with explanation

    res.status(501).json({
      error: 'Not Implemented',
      message: 'Natural language search coming in Phase 2'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
