# Congressional API - Development Checklist

## Phase 0: Setup ✅
- [x] Research completed (RESEARCH.md)
- [x] Project structure created
- [x] Basic server skeleton
- [ ] Install dependencies (`npm install`)
- [ ] Get Congress.gov API key
- [ ] Copy `.env.example` to `.env` and configure
- [ ] Test server (`npm run dev`)

---

## Phase 1: MVP (Core Endpoints)

### Bills Endpoint
- [ ] Implement `getBills()` in congressService
  - [ ] Fetch from Congress.gov API
  - [ ] Transform data to simplified format
  - [ ] Test with different congress numbers
- [ ] Implement `getBillDetails()` 
  - [ ] Parse billId format (hr1234-118)
  - [ ] Fetch full bill data
  - [ ] Include sponsors, cosponsors, actions
- [ ] Add search by subject/topic
- [ ] Add pagination helpers
- [ ] Test endpoint with curl/Postman

### Members Endpoint
- [ ] Implement `getMembers()` in congressService
  - [ ] Fetch current members by chamber
  - [ ] Filter by state/party
- [ ] Implement `getMemberDetails()`
  - [ ] Include sponsored bills
  - [ ] Include committee memberships
- [ ] Test endpoint

### Votes Endpoint
- [ ] Implement `getVotes()` in congressService
  - [ ] Fetch recent roll-call votes
  - [ ] Filter by chamber
- [ ] Implement `getVoteDetails()`
  - [ ] Include member votes breakdown
  - [ ] Party vote totals
- [ ] Test endpoint

### Documentation
- [ ] Create API documentation (Swagger/OpenAPI)
- [ ] Add example requests/responses
- [ ] Create Postman collection
- [ ] Write README with usage examples

### Deployment
- [ ] Create Dockerfile
- [ ] Deploy to Google Cloud Run
- [ ] Set up custom domain (optional)
- [ ] Configure environment variables in Cloud Run
- [ ] Test production deployment

---

## Phase 2: AI Features

### Natural Language Search
- [ ] Set up Gemini API integration
- [ ] Create prompt templates for query parsing
- [ ] Implement `POST /api/bills/search` endpoint
- [ ] Test with example queries
  - "climate bills from Texas"
  - "recent healthcare votes"
  - "bills sponsored by Bernie Sanders"

### Bill Summarization
- [ ] Implement `GET /api/bills/:id/summary`
- [ ] Use Gemini to generate concise summaries
- [ ] Cache summaries (don't regenerate)

### Sentiment Analysis
- [ ] Integrate news article fetching
- [ ] Analyze sentiment using TrulifAI Brain
- [ ] Implement `GET /api/bills/:id/sentiment`

### Trend Detection
- [ ] Track bill introduction rates by topic
- [ ] Detect unusual activity spikes
- [ ] Implement `GET /api/trends`

---

## Phase 3: Advanced Features

### Lobbying Data
- [ ] Integrate Senate Lobbying Disclosure API
- [ ] Link lobbying reports to bills
- [ ] Implement `GET /api/lobbying/bills/:id`

### District Impact
- [ ] Reuse Census + USASpending integrations from Sakshi
- [ ] Analyze bill effects on districts
- [ ] Implement `GET /api/districts/:state/:number/impact`

### Press Releases
- [ ] Scrape official member press releases
- [ ] Store in database
- [ ] Implement `GET /api/members/:id/press-releases`

### Voting Patterns
- [ ] Analyze member voting history
- [ ] Calculate similarity scores
- [ ] Implement `GET /api/members/:id/voting-patterns`

---

## Phase 4: Developer Tools

### SDKs
- [ ] Create Node.js SDK
  - [ ] Authentication helper
  - [ ] Type definitions
  - [ ] Publish to npm
- [ ] Create Python SDK
  - [ ] Authentication helper
  - [ ] Type hints
  - [ ] Publish to PyPI

### Webhooks
- [ ] Design webhook system
- [ ] Allow users to subscribe to events
  - New bills introduced
  - Votes happening
  - Bill status changes
- [ ] Implement webhook delivery
- [ ] Add retry logic

### Dashboard
- [ ] Create usage dashboard
- [ ] Show API key stats
- [ ] Display rate limit usage
- [ ] Billing integration (if paid tiers)

---

## Monetization

### Free Tier
- [ ] Implement API key generation
- [ ] Set rate limits (1,000 req/day)
- [ ] Add attribution requirement check

### Paid Tiers
- [ ] Stripe integration
- [ ] Developer tier ($29/month)
  - 10,000 req/day
  - All endpoints
- [ ] Enterprise tier ($299/month)
  - 100,000 req/day
  - Priority support

---

## Marketing & Launch

### Pre-Launch
- [ ] Create landing page
- [ ] Write blog post announcement
- [ ] Create demo video
- [ ] Set up Twitter/X account

### Launch
- [ ] Post on Product Hunt
- [ ] Share on HackerNews
- [ ] Post on Reddit (r/programming, r/webdev)
- [ ] Tweet announcement
- [ ] Email developer communities

### Post-Launch
- [ ] Gather feedback
- [ ] Fix bugs
- [ ] Add requested features
- [ ] Build community (Discord/GitHub Discussions)

---

## Nice-to-Have (Future)

- [ ] GraphQL endpoint
- [ ] WebSocket support (real-time updates)
- [ ] Mobile SDKs (iOS, Android)
- [ ] Zapier integration
- [ ] n8n integration
- [ ] MCP server support (like CongressMCP)
- [ ] Browser extension
- [ ] CLI tool

---

## Questions & Decisions

**Tech Stack:**
- [ ] Node.js or Go?
- [ ] PostgreSQL or just cache + Congress.gov API?
- [ ] Redis or in-memory cache?

**Branding:**
- [ ] Choose project name
  - TrulifAI Congress API
  - CivicData API
  - LegisAPI
  - CongressHub
  - CapitolAPI
  - Other: _______

**Monetization:**
- [ ] Free tier limits?
- [ ] Paid tier pricing?
- [ ] Open-source or proprietary?

**Timeline:**
- [ ] Side project (slow, no pressure)
- [ ] Main focus (fast, 4-6 weeks to MVP)

---

**Current Status:** Setup phase, ready to begin when Bob decides on scope/timeline.
