/**
 * Congress.gov API Service
 * 
 * Handles all interactions with the official Congress.gov API
 * Documentation: https://api.congress.gov/
 */

const axios = require('axios');
const NodeCache = require('node-cache');

const API_BASE_URL = 'https://api.congress.gov/v3';
const API_KEY = process.env.CONGRESS_GOV_API_KEY;

// Cache responses for 30 minutes (like ProPublica did)
const cache = new NodeCache({ stdTTL: 1800 });

/**
 * Make authenticated request to Congress.gov API
 */
async function congressRequest(endpoint, params = {}) {
  if (!API_KEY) {
    throw new Error('CONGRESS_GOV_API_KEY not configured');
  }

  const cacheKey = `${endpoint}-${JSON.stringify(params)}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log(`Cache hit: ${cacheKey}`);
    return cached;
  }

  try {
    const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
      params: {
        ...params,
        api_key: API_KEY,
        format: 'json'
      },
      timeout: 10000
    });

    cache.set(cacheKey, response.data);
    return response.data;
  } catch (error) {
    console.error(`Congress.gov API error: ${error.message}`);
    throw new Error(`Failed to fetch from Congress.gov: ${error.message}`);
  }
}

/**
 * Get list of bills
 * 
 * @param {Object} options - Query options
 * @param {string} options.congress - Congress number (default: 118)
 * @param {number} options.limit - Results per page (default: 20)
 * @param {number} options.offset - Pagination offset (default: 0)
 * @param {string} options.sort - Sort order
 * @param {string} options.type - Bill type (hr, s, etc.)
 */
async function getBills(options = {}) {
  const {
    congress = '118',
    limit = 20,
    offset = 0,
    sort = 'updateDate+desc',
    type
  } = options;

  const endpoint = type 
    ? `/bill/${congress}/${type}`
    : `/bill/${congress}`;

  const data = await congressRequest(endpoint, {
    limit,
    offset,
    sort
  });

  // TODO: Transform data to simpler format
  return data;
}

/**
 * Get bill details
 * 
 * @param {string} billId - Format: hr1234-118 or full congress.gov ID
 */
async function getBillDetails(billId) {
  // TODO: Parse billId and fetch details
  // Example: hr1234-118 → /bill/118/hr/1234
  throw new Error('Not implemented');
}

/**
 * Get members
 */
async function getMembers(options = {}) {
  // TODO: Implement member listing
  throw new Error('Not implemented');
}

/**
 * Get votes
 */
async function getVotes(options = {}) {
  // TODO: Implement vote listing
  throw new Error('Not implemented');
}

module.exports = {
  getBills,
  getBillDetails,
  getMembers,
  getVotes
};
