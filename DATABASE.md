# Northstar - Complete Database Schema

**Database:** PostgreSQL 15+  
**ORM:** Prisma (TypeScript-native)  
**Migrations:** Prisma Migrate

---

## Core Tables

### 1. Bills
```sql
CREATE TABLE bills (
  id                    SERIAL PRIMARY KEY,
  bill_id               VARCHAR(50) UNIQUE NOT NULL, -- 'hr1234-118'
  congress              INTEGER NOT NULL,
  bill_type             VARCHAR(10) NOT NULL, -- 'hr', 's', 'hjres', etc.
  bill_number           INTEGER NOT NULL,
  title                 TEXT,
  short_title           TEXT,
  official_title        TEXT,
  popular_title         TEXT,
  introduced_date       DATE,
  latest_action_date    DATE,
  latest_action_text    TEXT,
  status                VARCHAR(50), -- 'introduced', 'passed_house', 'passed_senate', 'enacted'
  sponsor_bioguide_id   VARCHAR(10) REFERENCES members(bioguide_id),
  policy_area           VARCHAR(255),
  subjects              JSONB, -- Array of subject tags
  summary_text          TEXT, -- Official CRS summary
  ai_summary            TEXT, -- Gemini-generated summary
  full_text_url         TEXT,
  congress_gov_url      TEXT,
  
  -- Analytics fields
  passage_probability   DECIMAL(5,2), -- ML prediction (0-100)
  bipartisan_score      DECIMAL(5,2),
  media_sentiment       DECIMAL(5,2), -- -1.0 to 1.0
  lobbying_count        INTEGER DEFAULT 0,
  
  -- Metadata
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW(),
  last_synced_at        TIMESTAMP,
  
  -- Indexes
  CONSTRAINT bills_congress_type_number_unique UNIQUE (congress, bill_type, bill_number)
);

CREATE INDEX idx_bills_congress ON bills(congress);
CREATE INDEX idx_bills_status ON bills(status);
CREATE INDEX idx_bills_introduced_date ON bills(introduced_date);
CREATE INDEX idx_bills_sponsor ON bills(sponsor_bioguide_id);
CREATE INDEX idx_bills_subjects ON bills USING GIN(subjects);
```

### 2. Members (Representatives & Senators)
```sql
CREATE TABLE members (
  id                    SERIAL PRIMARY KEY,
  bioguide_id           VARCHAR(10) UNIQUE NOT NULL, -- 'S000033' (Bernie Sanders)
  first_name            VARCHAR(100),
  last_name             VARCHAR(100),
  full_name             VARCHAR(255),
  party                 VARCHAR(20), -- 'D', 'R', 'I', etc.
  state                 VARCHAR(2), -- Two-letter state code
  district              INTEGER, -- NULL for senators
  chamber               VARCHAR(10), -- 'house' or 'senate'
  
  -- Contact information
  office_address        TEXT,
  phone                 VARCHAR(20),
  email                 VARCHAR(255),
  website               TEXT,
  
  -- Social media
  twitter_handle        VARCHAR(50),
  facebook_url          TEXT,
  youtube_url           TEXT,
  
  -- Service dates
  current_member        BOOLEAN DEFAULT TRUE,
  terms_served          INTEGER,
  first_elected         DATE,
  current_term_start    DATE,
  current_term_end      DATE,
  
  -- Analytics
  bills_sponsored       INTEGER DEFAULT 0,
  bills_cosponsored     INTEGER DEFAULT 0,
  votes_cast            INTEGER DEFAULT 0,
  votes_missed          INTEGER DEFAULT 0,
  bipartisan_score      DECIMAL(5,2),
  influence_score       DECIMAL(5,2),
  media_mentions        INTEGER DEFAULT 0,
  
  -- Metadata
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW(),
  last_synced_at        TIMESTAMP
);

CREATE INDEX idx_members_bioguide ON members(bioguide_id);
CREATE INDEX idx_members_state ON members(state);
CREATE INDEX idx_members_party ON members(party);
CREATE INDEX idx_members_chamber ON members(chamber);
CREATE INDEX idx_members_current ON members(current_member);
```

### 3. Cosponsors (Bill Sponsorship)
```sql
CREATE TABLE cosponsors (
  id                    SERIAL PRIMARY KEY,
  bill_id               VARCHAR(50) REFERENCES bills(bill_id) ON DELETE CASCADE,
  member_bioguide_id    VARCHAR(10) REFERENCES members(bioguide_id),
  sponsored_date        DATE,
  is_original_cosponsor BOOLEAN DEFAULT FALSE,
  withdrawn_date        DATE,
  
  created_at            TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT cosponsors_unique UNIQUE (bill_id, member_bioguide_id)
);

CREATE INDEX idx_cosponsors_bill ON cosponsors(bill_id);
CREATE INDEX idx_cosponsors_member ON cosponsors(member_bioguide_id);
```

### 4. Votes (Roll-Call Votes)
```sql
CREATE TABLE votes (
  id                    SERIAL PRIMARY KEY,
  vote_id               VARCHAR(50) UNIQUE NOT NULL, -- 'h123-118'
  congress              INTEGER NOT NULL,
  chamber               VARCHAR(10), -- 'house' or 'senate'
  session               INTEGER,
  roll_number           INTEGER,
  vote_date             TIMESTAMP,
  vote_question         TEXT, -- "On Passage"
  vote_type             VARCHAR(50), -- 'roll-call', 'voice', etc.
  vote_result           VARCHAR(50), -- 'passed', 'failed', 'agreed to'
  
  -- Bill reference (if vote was on a bill)
  bill_id               VARCHAR(50) REFERENCES bills(bill_id),
  amendment_id          VARCHAR(50),
  
  -- Vote totals
  yea_total             INTEGER,
  nay_total             INTEGER,
  present_total         INTEGER,
  not_voting_total      INTEGER,
  
  -- Party breakdown
  democrat_yea          INTEGER,
  democrat_nay          INTEGER,
  republican_yea        INTEGER,
  republican_nay        INTEGER,
  independent_yea       INTEGER,
  independent_nay       INTEGER,
  
  -- Analytics
  bipartisan            BOOLEAN, -- Did both parties vote together?
  party_line_vote       BOOLEAN, -- Strict party-line vote?
  
  -- Metadata
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_votes_congress ON votes(congress);
CREATE INDEX idx_votes_chamber ON votes(chamber);
CREATE INDEX idx_votes_date ON votes(vote_date);
CREATE INDEX idx_votes_bill ON votes(bill_id);
```

### 5. Vote Positions (Individual Member Votes)
```sql
CREATE TABLE vote_positions (
  id                    SERIAL PRIMARY KEY,
  vote_id               VARCHAR(50) REFERENCES votes(vote_id) ON DELETE CASCADE,
  member_bioguide_id    VARCHAR(10) REFERENCES members(bioguide_id),
  position              VARCHAR(20), -- 'Yea', 'Nay', 'Present', 'Not Voting'
  
  created_at            TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT vote_positions_unique UNIQUE (vote_id, member_bioguide_id)
);

CREATE INDEX idx_vote_positions_vote ON vote_positions(vote_id);
CREATE INDEX idx_vote_positions_member ON vote_positions(member_bioguide_id);
CREATE INDEX idx_vote_positions_position ON vote_positions(position);
```

### 6. Committees
```sql
CREATE TABLE committees (
  id                    SERIAL PRIMARY KEY,
  committee_code        VARCHAR(10) UNIQUE NOT NULL, -- 'HSAG' (House Agriculture)
  name                  VARCHAR(255),
  chamber               VARCHAR(10), -- 'house', 'senate', 'joint'
  committee_type        VARCHAR(50), -- 'standing', 'select', 'joint'
  parent_committee_code VARCHAR(10) REFERENCES committees(committee_code), -- For subcommittees
  
  -- Leadership
  chair_bioguide_id     VARCHAR(10) REFERENCES members(bioguide_id),
  ranking_member_id     VARCHAR(10) REFERENCES members(bioguide_id),
  
  -- Contact
  phone                 VARCHAR(20),
  address               TEXT,
  website               TEXT,
  
  -- Metadata
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_committees_chamber ON committees(chamber);
CREATE INDEX idx_committees_type ON committees(committee_type);
```

### 7. Committee Membership
```sql
CREATE TABLE committee_memberships (
  id                    SERIAL PRIMARY KEY,
  committee_code        VARCHAR(10) REFERENCES committees(committee_code),
  member_bioguide_id    VARCHAR(10) REFERENCES members(bioguide_id),
  rank                  INTEGER, -- Seniority ranking
  is_chair              BOOLEAN DEFAULT FALSE,
  is_ranking_member     BOOLEAN DEFAULT FALSE,
  start_date            DATE,
  end_date              DATE,
  
  created_at            TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT committee_memberships_unique UNIQUE (committee_code, member_bioguide_id)
);

CREATE INDEX idx_committee_memberships_committee ON committee_memberships(committee_code);
CREATE INDEX idx_committee_memberships_member ON committee_memberships(member_bioguide_id);
```

### 8. Amendments
```sql
CREATE TABLE amendments (
  id                    SERIAL PRIMARY KEY,
  amendment_id          VARCHAR(50) UNIQUE NOT NULL, -- 'hamdt123-118'
  congress              INTEGER NOT NULL,
  amendment_type        VARCHAR(10), -- 'hamdt', 'samdt', 'suamdt'
  amendment_number      INTEGER,
  
  -- Bill reference
  bill_id               VARCHAR(50) REFERENCES bills(bill_id),
  
  -- Amendment details
  sponsor_bioguide_id   VARCHAR(10) REFERENCES members(bioguide_id),
  submitted_date        DATE,
  purpose               TEXT,
  description           TEXT,
  status                VARCHAR(50),
  
  -- Text
  amendment_text        TEXT,
  
  -- Metadata
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_amendments_congress ON amendments(congress);
CREATE INDEX idx_amendments_bill ON amendments(bill_id);
CREATE INDEX idx_amendments_sponsor ON amendments(sponsor_bioguide_id);
```

### 9. Bill Actions (Legislative History)
```sql
CREATE TABLE bill_actions (
  id                    SERIAL PRIMARY KEY,
  bill_id               VARCHAR(50) REFERENCES bills(bill_id) ON DELETE CASCADE,
  action_date           DATE,
  action_time           TIME,
  action_text           TEXT,
  action_code           VARCHAR(50),
  chamber               VARCHAR(10), -- 'house', 'senate', NULL
  action_type           VARCHAR(100), -- 'IntroReferral', 'Floor', 'Committee', etc.
  
  created_at            TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bill_actions_bill ON bill_actions(bill_id);
CREATE INDEX idx_bill_actions_date ON bill_actions(action_date);
```

---

## Lobbying & Finance Tables

### 10. Lobbying Reports
```sql
CREATE TABLE lobbying_reports (
  id                    SERIAL PRIMARY KEY,
  report_id             VARCHAR(100) UNIQUE NOT NULL,
  filing_date           DATE,
  filing_type           VARCHAR(50), -- 'Registration', 'Quarterly Report'
  
  -- Filer information
  registrant_name       VARCHAR(255),
  registrant_id         VARCHAR(50),
  client_name           VARCHAR(255),
  client_id             VARCHAR(50),
  
  -- Financial
  income_amount         DECIMAL(12,2), -- Lobbying income
  expense_amount        DECIMAL(12,2), -- Lobbying expenses
  
  -- Issues
  general_issue_codes   JSONB, -- Array of issue codes
  specific_issues       TEXT,
  
  -- Bills mentioned
  bills_mentioned       JSONB, -- Array of bill_ids
  
  -- Lobbyists
  lobbyists             JSONB, -- Array of lobbyist names
  
  -- Government entities
  government_entities   JSONB, -- Array of agencies/committees
  
  created_at            TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_lobbying_registrant ON lobbying_reports(registrant_name);
CREATE INDEX idx_lobbying_client ON lobbying_reports(client_name);
CREATE INDEX idx_lobbying_date ON lobbying_reports(filing_date);
CREATE INDEX idx_lobbying_bills ON lobbying_reports USING GIN(bills_mentioned);
```

### 11. Campaign Contributions
```sql
CREATE TABLE campaign_contributions (
  id                    SERIAL PRIMARY KEY,
  member_bioguide_id    VARCHAR(10) REFERENCES members(bioguide_id),
  contributor_name      VARCHAR(255),
  contributor_type      VARCHAR(50), -- 'Individual', 'PAC', 'Party', 'Candidate'
  amount                DECIMAL(10,2),
  contribution_date     DATE,
  cycle                 INTEGER, -- Election cycle year (2024, 2026, etc.)
  
  -- Classification
  industry_name         VARCHAR(255),
  sector_name           VARCHAR(255),
  
  -- Source
  source                VARCHAR(50) DEFAULT 'OpenSecrets',
  external_id           VARCHAR(100),
  
  created_at            TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_contributions_member ON campaign_contributions(member_bioguide_id);
CREATE INDEX idx_contributions_cycle ON campaign_contributions(cycle);
CREATE INDEX idx_contributions_industry ON campaign_contributions(industry_name);
```

---

## District Intelligence Tables

### 12. Districts (Congressional Districts)
```sql
CREATE TABLE districts (
  id                    SERIAL PRIMARY KEY,
  state                 VARCHAR(2) NOT NULL,
  district_number       INTEGER NOT NULL, -- 0 for at-large
  congress              INTEGER NOT NULL, -- District boundaries change
  
  -- Current member
  member_bioguide_id    VARCHAR(10) REFERENCES members(bioguide_id),
  
  -- Demographics (from Census API)
  total_population      INTEGER,
  median_age            DECIMAL(4,1),
  median_income         DECIMAL(10,2),
  poverty_rate          DECIMAL(5,2),
  unemployment_rate     DECIMAL(5,2),
  
  -- Race/ethnicity percentages
  percent_white         DECIMAL(5,2),
  percent_black         DECIMAL(5,2),
  percent_hispanic      DECIMAL(5,2),
  percent_asian         DECIMAL(5,2),
  percent_other         DECIMAL(5,2),
  
  -- Education
  percent_bachelors     DECIMAL(5,2),
  percent_graduate      DECIMAL(5,2),
  
  -- Housing
  median_home_value     DECIMAL(12,2),
  homeownership_rate    DECIMAL(5,2),
  
  -- Veterans
  veteran_population    INTEGER,
  
  -- Full JSON for detailed data
  census_data_json      JSONB,
  
  -- Geography
  geojson_boundary      JSONB, -- GeoJSON polygon
  
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT districts_unique UNIQUE (state, district_number, congress)
);

CREATE INDEX idx_districts_state ON districts(state);
CREATE INDEX idx_districts_member ON districts(member_bioguide_id);
```

### 13. Federal Spending (District-Level)
```sql
CREATE TABLE federal_spending (
  id                    SERIAL PRIMARY KEY,
  state                 VARCHAR(2),
  district_number       INTEGER,
  fiscal_year           INTEGER,
  
  -- Spending categories
  total_obligations     DECIMAL(15,2),
  defense_spending      DECIMAL(15,2),
  healthcare_spending   DECIMAL(15,2),
  education_spending    DECIMAL(15,2),
  infrastructure_spend  DECIMAL(15,2),
  agriculture_spending  DECIMAL(15,2),
  
  -- Top awards
  top_awards_json       JSONB, -- Array of major contracts/grants
  
  -- Source
  source                VARCHAR(50) DEFAULT 'USASpending',
  
  created_at            TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT spending_unique UNIQUE (state, district_number, fiscal_year)
);

CREATE INDEX idx_spending_state ON federal_spending(state);
CREATE INDEX idx_spending_year ON federal_spending(fiscal_year);
```

---

## Media & Intelligence Tables

### 14. News Articles
```sql
CREATE TABLE news_articles (
  id                    SERIAL PRIMARY KEY,
  url                   TEXT UNIQUE,
  title                 TEXT,
  source                VARCHAR(255),
  author                VARCHAR(255),
  published_at          TIMESTAMP,
  
  -- Content
  summary               TEXT,
  full_text             TEXT,
  
  -- Mentions
  bills_mentioned       JSONB, -- Array of bill_ids
  members_mentioned     JSONB, -- Array of bioguide_ids
  
  -- Sentiment (TrulifAI Brain)
  sentiment_score       DECIMAL(5,2), -- -1.0 to 1.0
  credibility_score     DECIMAL(5,2), -- 0.0 to 1.0
  bias_rating           VARCHAR(50), -- 'left', 'center', 'right'
  
  -- Classification
  topics                JSONB, -- Array of topic tags
  
  created_at            TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_news_published ON news_articles(published_at);
CREATE INDEX idx_news_bills ON news_articles USING GIN(bills_mentioned);
CREATE INDEX idx_news_members ON news_articles USING GIN(members_mentioned);
```

### 15. Hearings
```sql
CREATE TABLE hearings (
  id                    SERIAL PRIMARY KEY,
  hearing_id            VARCHAR(100) UNIQUE,
  congress              INTEGER,
  chamber               VARCHAR(10),
  committee_code        VARCHAR(10) REFERENCES committees(committee_code),
  
  -- Hearing details
  title                 TEXT,
  hearing_date          DATE,
  hearing_type          VARCHAR(50),
  location              TEXT,
  
  -- Content
  description           TEXT,
  transcript_url        TEXT,
  video_url             TEXT,
  
  -- Witnesses
  witnesses             JSONB, -- Array of witness objects
  
  -- Bills discussed
  bills_discussed       JSONB, -- Array of bill_ids
  
  created_at            TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_hearings_committee ON hearings(committee_code);
CREATE INDEX idx_hearings_date ON hearings(hearing_date);
```

---

## User & Enterprise Tables

### 16. Users (For Multi-Office Management)
```sql
CREATE TABLE users (
  id                    SERIAL PRIMARY KEY,
  email                 VARCHAR(255) UNIQUE NOT NULL,
  password_hash         VARCHAR(255),
  
  -- Profile
  first_name            VARCHAR(100),
  last_name             VARCHAR(100),
  role                  VARCHAR(50), -- 'admin', 'staff', 'viewer'
  
  -- Office affiliation
  office_id             INTEGER REFERENCES offices(id),
  member_bioguide_id    VARCHAR(10) REFERENCES members(bioguide_id),
  
  -- Authentication
  api_key               VARCHAR(100) UNIQUE,
  last_login_at         TIMESTAMP,
  
  -- Metadata
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_api_key ON users(api_key);
CREATE INDEX idx_users_office ON users(office_id);
```

### 17. Offices (Congressional Offices)
```sql
CREATE TABLE offices (
  id                    SERIAL PRIMARY KEY,
  name                  VARCHAR(255), -- "Office of Senator Bernie Sanders"
  member_bioguide_id    VARCHAR(10) REFERENCES members(bioguide_id),
  
  -- Subscription
  tier                  VARCHAR(50), -- 'pilot', 'standard', 'enterprise'
  active                BOOLEAN DEFAULT TRUE,
  subscription_start    DATE,
  subscription_end      DATE,
  
  -- Usage limits
  monthly_api_calls     INTEGER DEFAULT 0,
  api_call_limit        INTEGER,
  
  -- Settings
  settings_json         JSONB,
  
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_offices_member ON offices(member_bioguide_id);
```

### 18. Bill Tracking (User-Specific)
```sql
CREATE TABLE bill_tracking (
  id                    SERIAL PRIMARY KEY,
  user_id               INTEGER REFERENCES users(id) ON DELETE CASCADE,
  bill_id               VARCHAR(50) REFERENCES bills(bill_id) ON DELETE CASCADE,
  
  -- Tracking preferences
  alert_on_update       BOOLEAN DEFAULT TRUE,
  alert_on_vote         BOOLEAN DEFAULT TRUE,
  notes                 TEXT,
  
  created_at            TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT tracking_unique UNIQUE (user_id, bill_id)
);

CREATE INDEX idx_tracking_user ON bill_tracking(user_id);
CREATE INDEX idx_tracking_bill ON bill_tracking(bill_id);
```

---

## Caching & Analytics Tables

### 19. API Cache
```sql
CREATE TABLE api_cache (
  id                    SERIAL PRIMARY KEY,
  cache_key             VARCHAR(255) UNIQUE NOT NULL,
  cache_value           JSONB,
  expires_at            TIMESTAMP,
  
  created_at            TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cache_key ON api_cache(cache_key);
CREATE INDEX idx_cache_expires ON api_cache(expires_at);
```

### 20. Analytics Events
```sql
CREATE TABLE analytics_events (
  id                    SERIAL PRIMARY KEY,
  event_type            VARCHAR(100), -- 'api_call', 'search', 'export', etc.
  user_id               INTEGER REFERENCES users(id),
  api_key               VARCHAR(100),
  
  -- Request details
  endpoint              VARCHAR(255),
  method                VARCHAR(10),
  query_params          JSONB,
  response_time_ms      INTEGER,
  status_code           INTEGER,
  
  -- Metadata
  ip_address            VARCHAR(50),
  user_agent            TEXT,
  
  created_at            TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_analytics_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_created ON analytics_events(created_at);
```

---

## Views (For Complex Queries)

### Member Dashboard View
```sql
CREATE VIEW member_dashboard AS
SELECT 
  m.bioguide_id,
  m.full_name,
  m.party,
  m.state,
  m.chamber,
  COUNT(DISTINCT b.bill_id) AS bills_sponsored,
  COUNT(DISTINCT c.bill_id) AS bills_cosponsored,
  COUNT(DISTINCT vp.vote_id) AS votes_cast,
  AVG(CASE WHEN vp.position = 'Not Voting' THEN 1 ELSE 0 END) * 100 AS absentee_rate
FROM members m
LEFT JOIN bills b ON b.sponsor_bioguide_id = m.bioguide_id
LEFT JOIN cosponsors c ON c.member_bioguide_id = m.bioguide_id
LEFT JOIN vote_positions vp ON vp.member_bioguide_id = m.bioguide_id
GROUP BY m.bioguide_id;
```

---

## Prisma Schema (TypeScript ORM)

Save this as `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Bill {
  id                  Int       @id @default(autoincrement())
  billId              String    @unique @map("bill_id")
  congress            Int
  billType            String    @map("bill_type")
  billNumber          Int       @map("bill_number")
  title               String?
  shortTitle          String?   @map("short_title")
  introducedDate      DateTime? @map("introduced_date")
  latestActionDate    DateTime? @map("latest_action_date")
  latestActionText    String?   @map("latest_action_text")
  status              String?
  sponsorBioguideId   String?   @map("sponsor_bioguide_id")
  policyArea          String?   @map("policy_area")
  subjects            Json?
  summaryText         String?   @map("summary_text")
  aiSummary           String?   @map("ai_summary")
  passageProbability  Decimal?  @map("passage_probability")
  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime  @updatedAt @map("updated_at")
  
  sponsor             Member?   @relation("SponsoredBills", fields: [sponsorBioguideId], references: [bioguideId])
  cosponsors          Cosponsor[]
  actions             BillAction[]
  votes               Vote[]
  amendments          Amendment[]
  
  @@map("bills")
}

model Member {
  id              Int       @id @default(autoincrement())
  bioguideId      String    @unique @map("bioguide_id")
  firstName       String    @map("first_name")
  lastName        String    @map("last_name")
  fullName        String    @map("full_name")
  party           String
  state           String
  district        Int?
  chamber         String
  currentMember   Boolean   @default(true) @map("current_member")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  
  sponsoredBills  Bill[]    @relation("SponsoredBills")
  cosponsors      Cosponsor[]
  votePositions   VotePosition[]
  
  @@map("members")
}

// ... (continue for all other models)
```

---

## Database Setup Commands

```bash
# Initialize Prisma
npm install prisma @prisma/client
npx prisma init

# Create migrations
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate

# Seed database (optional)
npx prisma db seed
```

---

**Next: Set up TypeScript project and implement Congress.gov API client!**
