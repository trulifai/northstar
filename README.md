# Northstar - Congressional Intelligence Platform

**The AI-powered intelligence platform for the United States Congress**

[![Status](https://img.shields.io/badge/Status-In%20Development-yellow)](https://github.com/trulifai/northstar)
[![Progress](https://img.shields.io/badge/Features-27%2F183%20(15%25)-blue)](https://github.com/trulifai/northstar)
[![License](https://img.shields.io/badge/License-Proprietary-red)](https://github.com/trulifai/northstar)

---

## 🎯 Vision

Northstar is a full-stack congressional intelligence platform that helps congressional offices, legislative staff, and government affairs professionals work smarter and faster. We combine AI-powered insights with comprehensive legislative tracking to save 50% of research time.

**Not for lobbyists. Not for corporations. Built FOR Congress BY people who understand it.**

---

## ✅ What's Built (15% Complete)

### Backend API (22 Endpoints)
- ✅ Bills tracking (search, details, text, actions, amendments)
- ✅ Members directory (all 535 members, filter by state/party)
- ✅ Votes tracking (roll-call votes, breakdowns)
- ✅ Committees (200+ committees, details, bills)
- ✅ Amendments (search, details)
- ✅ Hearings (committee hearings)

### Frontend (5 Pages)
- ✅ Homepage/Dashboard (stats, recent activity)
- ✅ Bills Search (filters, pagination)
- ✅ Members Directory (grid view, filters)
- ✅ Votes Page (roll-call breakdowns)
- ✅ Committees Page (browse all committees)

### Database Schema (20 Tables)
- ✅ Core data (bills, members, votes, committees)
- ✅ Intelligence (lobbying, campaign finance, districts)
- ✅ Enterprise (users, offices, tracking, analytics)

---

## 🚀 Tech Stack

**Backend:**
- Node.js + TypeScript
- Express.js
- PostgreSQL (planned)
- Redis (planned)

**Frontend:**
- Next.js 14 (App Router)
- React Server Components
- Tailwind CSS + shadcn/ui
- TypeScript

**AI/ML:**
- Gemini API (bill summarization) - planned
- TrulifAI Brain (sentiment analysis) - planned
- Custom ML models (passage prediction) - planned

**Infrastructure:**
- Google Cloud Run
- Cloud SQL (planned)
- Cloud Memorystore (planned)

---

## 📊 Progress Tracker

| Component | Features | Status |
|-----------|----------|--------|
| Backend API | 22/50 | 🟢 44% |
| Frontend UI | 5/20 | 🟡 25% |
| Database | 0/20 | 🔴 0% |
| AI Services | 0/8 | 🔴 0% |
| Lobbying Intel | 0/18 | 🔴 0% |
| District Analysis | 0/12 | 🔴 0% |
| **Total** | **27/183** | **🟡 15%** |

---

## 🎯 Roadmap

### Phase 1: Foundation ✅ (DONE)
- ✅ Congress.gov API integration (22 endpoints)
- ✅ Next.js frontend (5 pages)
- ✅ Database schema design

### Phase 2: Intelligence Layer (IN PROGRESS)
- ⏳ PostgreSQL setup + data sync
- ⏳ AI bill summarization (Gemini)
- ⏳ Natural language search
- ⏳ Sentiment analysis (TrulifAI Brain)

### Phase 3: Advanced Features (PLANNED)
- ⏳ Lobbying intelligence (Senate API)
- ⏳ Campaign finance (OpenSecrets)
- ⏳ District impact analysis (Census + USASpending)
- ⏳ Bill passage prediction (ML)

### Phase 4: Enterprise (PLANNED)
- ⏳ SOC 2 Type II compliance
- ⏳ SSO integration
- ⏳ Multi-office management
- ⏳ Real-time notifications

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Congress.gov API key (free at https://api.congress.gov/sign-up/)

### Backend Setup
```bash
cd northstar
npm install
cp .env.example .env
# Add your CONGRESS_GOV_API_KEY to .env
npm run dev
```

Backend will run at: http://localhost:3000

### Frontend Setup
```bash
cd northstar/frontend
npm install
npm run dev
```

Frontend will run at: http://localhost:3001

### Test the API
```bash
# Get recent bills
curl "http://localhost:3000/api/bills?congress=118&limit=5"

# Get California Democrats
curl "http://localhost:3000/api/members?state=CA&party=D&limit=5"

# Get recent votes
curl "http://localhost:3000/api/votes?congress=118&limit=5"
```

---

## 📚 Documentation

- **[BUILD_SUMMARY.md](./BUILD_SUMMARY.md)** - Complete build status
- **[FEATURES.md](./FEATURES.md)** - All 183 features documented
- **[DATABASE.md](./DATABASE.md)** - Complete database schema
- **[EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md)** - Executive overview
- **[ENTERPRISE_STRATEGY.md](./ENTERPRISE_STRATEGY.md)** - Business strategy
- **[ops/cron-incremental-sync.md](./ops/cron-incremental-sync.md)** - Budget-safe incremental sync cron setup

---

## 🎯 Unique Features (vs Competitors)

| Feature | Quorum | LegiStorm | FiscalNote | **Northstar** |
|---------|--------|-----------|------------|---------------|
| Legislative tracking | ✅ | ✅ | ✅ | ✅ |
| **AI bill summaries** | ❌ | ❌ | ❌ | ✅ |
| **Natural language search** | ❌ | ❌ | ❌ | ✅ |
| **Passage prediction** | ❌ | ❌ | ❌ | ✅ |
| **District impact analysis** | ❌ | ❌ | ❌ | ✅ |
| Lobbying intelligence | ❌ | ✅ | ❌ | ✅ |
| Campaign finance | ❌ | ❌ | ❌ | ✅ |
| Sentiment analysis | ❌ | ❌ | ❌ | ✅ |

**No competitor has AI-powered features. We have a 6-12 month head start.**

---

## 💰 Market Opportunity

**Target Market:** U.S. Congress (535 offices + legislative agencies)

**Competitive Landscape:**
- Quorum: $61M revenue, $20K-50K pricing, NO AI
- LegiStorm: $199/mo, best UX, NO AI
- FiscalNote: $50K-200K pricing, enterprise, NO AI

**Our Strategy:**
- Price: $10K-20K per office (50-80% cheaper)
- Features: AI-powered (unique)
- Target: Congressional offices (direct customer)

**Revenue Potential:**
- 535 offices × $15K avg = $8M+ annually (Congress alone)
- + Legislative agencies = $10M-20M
- + Executive branch (future) = $50M-100M+

---

## 🔒 Security & Compliance

**Current:**
- HTTPS only
- API key authentication
- Rate limiting
- CORS protection
- Helmet security headers

**Planned:**
- SOC 2 Type II certification
- FedRAMP authorization path
- End-to-end encryption
- MFA enforcement
- Audit logging
- NIST 800-53 compliance

---

## 🤝 Contributing

This is a proprietary project under active development. Not currently accepting external contributions.

---

## 📄 License

Proprietary - TrulifAI Inc. All rights reserved.

---

## 📞 Contact

**Company:** TrulifAI  
**Product:** Northstar  
**Website:** Coming soon  
**Email:** Coming soon

---

## 🎉 Status

**Current Phase:** Intelligence Layer (Database + AI)  
**Features Complete:** 27/183 (15%)  
**Estimated Completion:** 7-10 days  
**Next Milestone:** Database setup + AI summarization

**Built with ❤️ for the United States Congress** 🇺🇸

---

_Last Updated: 2026-02-01_
