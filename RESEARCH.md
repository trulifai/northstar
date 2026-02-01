# Congressional Data API Tool - Research & Feature Analysis

**Project Goal:** Build a congressional data API service (similar to CongressMCP) as a standalone tool  
**Research Date:** 2026-02-01  
**Researcher:** Botty

---

## Executive Summary

**The Opportunity:**
- CongressMCP exists but charges for hosted service
- ProPublica Congress API shut down (was free, no longer available)
- GovTrack API deprecated (ended bulk data/API)
- Congress.gov API is official but low-level and complex
- **Market gap:** Easy-to-use, free/affordable congressional data API

**Our Edge:**
- Clean REST API (simpler than Congress.gov)
- Natural language queries (AI-powered search)
- Real-time updates (30min refresh like ProPublica had)
- Free tier + paid premium features
- Built for developers AND non-technical users

---

## Competitive Analysis

### 1. CongressMCP (Current Leader)
**URL:** https://congressmcp.lawgiver.ai  
**GitHub:** https://github.com/amurshak/congressMCP

**Features:**
- 92 operations across 6 categories
- Natural language queries via MCP protocol
- Hosted service (paid API key required)
- Self-hosting option (Python-based)

**Strengths:**
- Comprehensive coverage (bills, votes, members, committees, hearings, CRS reports)
- MCP integration (works with Claude, ChatGPT, etc.)
- Active development

**Weaknesses:**
- MCP-focused (not a general REST API)
- Paid service (pricing unknown)
- Python backend (slower than Node.js/Go)
- Self-hosting requires technical knowledge

**License:** Sustainable Use License (can't offer competing hosted service)

---

### 2. ProPublica Congress API (SHUT DOWN)
**URL:** https://projects.propublica.org/api-docs/congress-api/  
**Status:** No longer available (discontinued)

**What They Had:**
- Roll-call votes (House 1991+, Senate 1989+)
- Member data (all members ever, detailed from 1995+)
- Bills (1995+)
- Nominations (2001+)
- Committee data
- Press releases
- Lobbying data
- 5000 requests/day limit
- Updated every 30 minutes (votes)

**Why They Shut Down:**
- Unknown (docs say "no longer available")
- Possibly cost/maintenance burden
- Congress.gov API improved enough to replace it

**Lesson:** Free API requires sustainable business model or it dies

---

### 3. GovTrack API (DEPRECATED)
**URL:** https://congressionaldata.org/ending-govtracks-bulk-data-and-api/  
**Status:** Ended bulk data/API service

**What They Had:**
- Historical data (votes from 1789, bills from 1973)
- Bulk downloads
- Fed into Sunlight Foundation → ProPublica API

**Why They Shut Down:**
- Congress.gov API matured
- Recognized their API "worked" (mission accomplished)
- Still publish historical data separately

---

### 4. LegiScan API (State + Federal)
**URL:** https://legiscan.com/legiscan  
**Status:** Active, commercial service

**Features:**
- 50 states + Congress
- Bill tracking, full text, roll calls
- Structured JSON
- Powers GAITS tracking platform

**Pricing:**
- Commercial service (pricing not public)
- API access requires subscription

---

### 5. Congress.gov API (Official Source)
**URL:** https://api.congress.gov  
**Status:** Active, free with API key

**Features:**
- Official Library of Congress data
- Comprehensive (bills, amendments, members, committees, nominations, treaties, etc.)
- Bulk data downloads
- RESTful JSON API

**Strengths:**
- Official source (most authoritative)
- Free with API key
- Well-documented

**Weaknesses:**
- Complex data structures (nested JSON)
- Low-level (requires lots of parsing)
- No natural language queries
- No aggregated analytics
- Rate limits (unknown, but exist)

---

## Feature Comparison Matrix

| Feature | CongressMCP | ProPublica (dead) | GovTrack (dead) | Congress.gov | **Our Tool** |
|---------|-------------|-------------------|-----------------|--------------|--------------|
| Bills tracking | ✅ | ✅ | ✅ | ✅ | ✅ |
| Votes (roll-call) | ✅ | ✅ (1989+) | ✅ (1789+) | ✅ | ✅ |
| Members/Legislators | ✅ | ✅ | ✅ | ✅ | ✅ |
| Committees | ✅ | ✅ | ✅ | ✅ | ✅ |
| Nominations | ✅ | ✅ (2001+) | ❌ | ✅ | ✅ |
| Hearings | ✅ | ❌ | ❌ | ✅ | ✅ |
| CRS Reports | ✅ | ❌ | ❌ | ❌ | ⚠️ (if available) |
| Press releases | ❌ | ✅ | ❌ | ❌ | 🎯 **NEW** |
| Lobbying data | ❌ | ✅ | ❌ | ❌ | 🎯 **NEW** |
| **Natural language** | ✅ (MCP) | ❌ | ❌ | ❌ | 🎯 **AI-powered** |
| **Sentiment analysis** | ❌ | ❌ | ❌ | ❌ | 🎯 **NEW** |
| **Trend detection** | ❌ | ❌ | ❌ | ❌ | 🎯 **NEW** |
| **District impact** | ❌ | ❌ | ❌ | ❌ | 🎯 **NEW** |
| REST API | ❌ | ✅ | ✅ | ✅ | ✅ |
| MCP support | ✅ | ❌ | ❌ | ❌ | ⚠️ (maybe v2) |
| Free tier | ❌ | ✅ (was) | ✅ (was) | ✅ | ✅ |
| Self-hosting | ✅ | ❌ | ✅ | N/A | ✅ |
| Real-time updates | ✅ | ✅ (30min) | ❌ | ✅ | ✅ |

---

## Our Unique Features (Differentiation)

### 🎯 1. AI-Powered Natural Language Search
**Example:** "Show me climate bills from California senators with bipartisan support"
- Parse natural language → structured query
- Use LLM to understand intent
- Return relevant results with explanations

**Tech:** Gemini/Claude for query parsing, vector embeddings for semantic search

---

### 🎯 2. Sentiment Analysis & Public Opinion
**Example:** "What's public sentiment on H.R. 1234?"
- Aggregate news articles, social media (if available)
- Analyze constituent feedback
- Track sentiment over time

**Tech:** TrulifAI Brain for credibility + sentiment analysis

---

### 🎯 3. Trend Detection & Alerts
**Example:** "Alert me when infrastructure bills spike in activity"
- Detect unusual patterns (surge in bills/hearings)
- Predict likelihood of passage
- Historical trend comparison

**Tech:** Time-series analysis, anomaly detection

---

### 🎯 4. District Impact Analysis
**Example:** "How does H.R. 5678 affect Texas 8th district?"
- Connect bills to district demographics (Census data)
- Identify affected programs/spending
- Show local impact estimates

**Tech:** Census API + USASpending API integration (we already have this in Sakshi!)

---

### 🎯 5. Lobbying Intelligence
**Example:** "Who's lobbying for this bill?"
- Track lobbying disclosure reports
- Link lobbyists to bills/members
- Show money flow and influence

**Tech:** Senate Lobbying Disclosure Database

---

### 🎯 6. Press Release & Communications Tracking
**Example:** "What are senators saying about AI regulation?"
- Scrape/track official press releases
- Analyze messaging by party/member
- Detect coordinated messaging campaigns

**Tech:** RSS feeds, web scraping, NLP analysis

---

### 🎯 7. Developer-Friendly SDK
**Example:** One-line installation, simple queries
```javascript
const congress = require('trulifai-congress');
const bills = await congress.bills.search('climate change', { bipartisan: true });
```

**Tech:** Node.js, Python, Ruby SDKs with great docs

---

## Technical Architecture Proposal

### Option A: Standalone API Service (Recommended)
**Tech Stack:**
- **Backend:** Node.js (Express) or Go (Fiber/Gin) - fast, scalable
- **Database:** PostgreSQL (relational) + Redis (caching)
- **AI/ML:** Gemini API (natural language), Python microservice (ML models)
- **Hosting:** Google Cloud Run (serverless, auto-scaling)
- **Auth:** API keys (free tier) + OAuth (premium)

**Advantages:**
- Fast (Go/Node.js > Python)
- Scalable (Cloud Run auto-scales)
- Cheap (pay only for usage)
- Can integrate with Sakshi later

---

### Option B: Extend Sakshi Backend
**Tech Stack:**
- Use existing Sakshi backend (`congressApi.ts`)
- Add new endpoints for advanced features
- Deploy as separate Cloud Run service

**Advantages:**
- Reuse existing code (Census, USASpending, Congress.gov integrations)
- Faster to market
- Shared infrastructure

**Disadvantages:**
- Couples with Sakshi (harder to sell separately)
- Less focus on standalone product

---

### Recommended: Option A (Standalone)
**Why:**
- Standalone = marketable product
- Can license to others
- Sakshi can be a customer of this API
- Cleaner architecture

---

## Data Sources & APIs

### Primary Source: Congress.gov API
**Endpoint:** https://api.congress.gov  
**Data:**
- Bills, amendments, resolutions
- Members (current + historical)
- Committees, subcommittees
- Nominations, treaties
- Congressional Record
- Committee reports, hearings

**Free with API key:** https://api.congress.gov/sign-up/

---

### Supplementary Sources:

1. **Senate Lobbying Disclosure**
   - URL: https://lda.senate.gov/api/v1/
   - Data: Lobbying registrations, reports

2. **OpenSecrets (Campaign Finance)**
   - URL: https://www.opensecrets.org/api/
   - Data: Campaign contributions, PACs

3. **ProPublica Nonprofit Explorer** (for lobbying orgs)
   - URL: https://projects.propublica.org/nonprofits/api
   - Data: IRS 990 forms, nonprofit finances

4. **GovInfo (GPO)**
   - URL: https://www.govinfo.gov/developers
   - Data: Federal Register, Congressional Record, hearings

5. **Census API** (already integrated in Sakshi)
   - District demographics

6. **USASpending API** (already integrated in Sakshi)
   - Federal spending by district

7. **Twitter/X API** (if budget allows)
   - Legislator social media activity

---

## Monetization Strategy

### Free Tier (Public Good)
- 1,000 requests/day
- Basic endpoints (bills, votes, members)
- Attribution required

### Developer Tier ($29/month)
- 10,000 requests/day
- All endpoints (including AI features)
- Email support
- No attribution required

### Enterprise Tier ($299/month)
- 100,000 requests/day
- Dedicated support
- Custom integrations
- White-label option
- SLA guarantee

### Premium Features (Add-ons)
- Real-time webhooks (+$49/month)
- Historical bulk data (+$99 one-time)
- Custom ML models (+$199/month)

**Target Customers:**
- News organizations
- Political campaigns
- Advocacy groups
- Research institutions
- Government contractors
- SaaS companies (like Sakshi!)

---

## Development Roadmap

### Phase 1: MVP (2-3 weeks)
**Core Features:**
- [ ] Congress.gov API integration (bills, members, votes)
- [ ] REST API with authentication
- [ ] Basic search & filtering
- [ ] Rate limiting
- [ ] Documentation (Swagger/OpenAPI)

**Endpoints:**
- `GET /bills` - List/search bills
- `GET /bills/{bill-id}` - Bill details
- `GET /members` - List members
- `GET /members/{bioguide-id}` - Member details
- `GET /votes` - List votes
- `GET /votes/{vote-id}` - Vote details

---

### Phase 2: AI Features (2-3 weeks)
**AI-Powered Features:**
- [ ] Natural language search
- [ ] Bill summarization
- [ ] Sentiment analysis (news articles)
- [ ] Trend detection

**New Endpoints:**
- `POST /search/natural` - Natural language query
- `GET /bills/{bill-id}/summary` - AI-generated summary
- `GET /bills/{bill-id}/sentiment` - Public sentiment
- `GET /trends` - Trending bills/topics

---

### Phase 3: Advanced Analytics (3-4 weeks)
**Advanced Features:**
- [ ] Lobbying data integration
- [ ] District impact analysis
- [ ] Press release tracking
- [ ] Voting pattern analysis

**New Endpoints:**
- `GET /lobbying/bills/{bill-id}` - Lobbying activity
- `GET /districts/{state}/{number}/impact` - District impact
- `GET /members/{bioguide-id}/press-releases` - Press releases
- `GET /members/{bioguide-id}/voting-patterns` - Voting analysis

---

### Phase 4: Developer Tools (1-2 weeks)
**Developer Experience:**
- [ ] Node.js SDK
- [ ] Python SDK
- [ ] Interactive API explorer
- [ ] Webhooks (real-time updates)
- [ ] Usage dashboard

---

## Success Metrics

**Technical:**
- < 200ms API response time (p95)
- 99.9% uptime
- < 1% error rate

**Business:**
- 100 free tier users (Month 1)
- 10 paid users (Month 3)
- $1,000 MRR (Month 6)

**Community:**
- 50 GitHub stars (Month 3)
- 5 community contributors (Month 6)
- Featured on Product Hunt (Month 2)

---

## Risks & Mitigations

### Risk 1: Congress.gov API rate limits
**Mitigation:**
- Aggressive caching (Redis, 30min TTL)
- Database for frequently accessed data
- Bulk data imports (nightly sync)

### Risk 2: CongressMCP license (can't compete)
**Mitigation:**
- We're building a REST API, not MCP server
- Different use case (developers vs AI agents)
- Could partner with them (white-label our AI features)

### Risk 3: Low adoption (no one uses it)
**Mitigation:**
- Free tier for community goodwill
- Marketing to developer communities (Reddit, HackerNews)
- Integrations with popular tools (Zapier, n8n)

### Risk 4: Cost of AI features
**Mitigation:**
- Cache AI results (same query = cached response)
- Batch processing for summarization
- Offer AI features in paid tiers only

---

## Next Steps

### 1. Project Setup (You decide)
**Option A: New repo from scratch**
```bash
mkdir congressional-api
cd congressional-api
npm init -y
```

**Option B: Fork CongressMCP and modify**
- Study their code
- Replace MCP protocol with REST API
- Add our unique features

**Recommendation:** Option A (cleaner, no license issues)

---

### 2. Tech Stack Decision
**Backend:**
- Node.js + Express (familiar, fast)
- OR Go (faster, smaller memory footprint)

**Recommendation:** Node.js (faster development, reuse Sakshi knowledge)

---

### 3. First Milestone: "Hello Congress"
**Goal:** Basic API that returns bills from Congress.gov
**Time:** 1 week
**Deliverables:**
- `GET /bills` endpoint
- Congress.gov integration
- Basic caching
- API documentation

---

## Questions for Bob

1. **Scope:** MVP only, or go straight to AI features?
2. **Tech stack:** Node.js or Go?
3. **Hosting:** Google Cloud (reuse Sakshi setup) or somewhere else?
4. **Timeline:** Side project (slow) or priority (fast)?
5. **Monetization:** Open-source + donations, or paid tiers from day 1?
6. **Branding:** Name ideas? (TrulifAI Congress API? CivicData API? LegisAPI?)

---

## Conclusion

**This is viable.** ProPublica and GovTrack shut down their APIs, leaving a market gap. CongressMCP is MCP-focused, not a general REST API. We can build a better developer experience with AI features that don't exist elsewhere.

**Unique value:** AI + district impact + lobbying intelligence + developer-friendly.

**Risk:** Low (free Congress.gov API, proven demand, can reuse Sakshi infrastructure).

**Reward:** Standalone product, potential revenue, helps Sakshi (we become our own customer).

**Recommendation:** Build it. Start with MVP in Node.js, deploy to Cloud Run, iterate based on feedback.
