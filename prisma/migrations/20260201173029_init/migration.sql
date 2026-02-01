-- CreateTable
CREATE TABLE "bills" (
    "id" SERIAL NOT NULL,
    "bill_id" TEXT NOT NULL,
    "congress" INTEGER NOT NULL,
    "bill_type" TEXT NOT NULL,
    "bill_number" INTEGER NOT NULL,
    "title" TEXT,
    "short_title" TEXT,
    "official_title" TEXT,
    "popular_title" TEXT,
    "introduced_date" DATE,
    "latest_action_date" DATE,
    "latest_action_text" TEXT,
    "status" TEXT,
    "sponsor_bioguide_id" TEXT,
    "policy_area" TEXT,
    "subjects" JSONB,
    "summary_text" TEXT,
    "ai_summary" TEXT,
    "full_text_url" TEXT,
    "congress_gov_url" TEXT,
    "passage_probability" DECIMAL(5,2),
    "bipartisan_score" DECIMAL(5,2),
    "media_sentiment" DECIMAL(5,2),
    "lobbying_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_synced_at" TIMESTAMP(3),

    CONSTRAINT "bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "members" (
    "id" SERIAL NOT NULL,
    "bioguide_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "party" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "district" INTEGER,
    "chamber" TEXT NOT NULL,
    "office_address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "twitter_handle" TEXT,
    "facebook_url" TEXT,
    "youtube_url" TEXT,
    "current_member" BOOLEAN NOT NULL DEFAULT true,
    "terms_served" INTEGER NOT NULL DEFAULT 0,
    "first_elected" DATE,
    "current_term_start" DATE,
    "current_term_end" DATE,
    "bills_sponsored" INTEGER NOT NULL DEFAULT 0,
    "bills_cosponsored" INTEGER NOT NULL DEFAULT 0,
    "votes_cast" INTEGER NOT NULL DEFAULT 0,
    "votes_missed" INTEGER NOT NULL DEFAULT 0,
    "bipartisan_score" DECIMAL(5,2),
    "influence_score" DECIMAL(5,2),
    "media_mentions" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_synced_at" TIMESTAMP(3),

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cosponsors" (
    "id" SERIAL NOT NULL,
    "bill_id" TEXT NOT NULL,
    "member_bioguide_id" TEXT NOT NULL,
    "sponsored_date" DATE,
    "is_original_cosponsor" BOOLEAN NOT NULL DEFAULT false,
    "withdrawn_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cosponsors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votes" (
    "id" SERIAL NOT NULL,
    "vote_id" TEXT NOT NULL,
    "congress" INTEGER NOT NULL,
    "chamber" TEXT NOT NULL,
    "session" INTEGER,
    "roll_number" INTEGER NOT NULL,
    "vote_date" TIMESTAMP(3) NOT NULL,
    "vote_question" TEXT,
    "vote_type" TEXT,
    "vote_result" TEXT,
    "bill_id" TEXT,
    "amendment_id" TEXT,
    "yea_total" INTEGER,
    "nay_total" INTEGER,
    "present_total" INTEGER,
    "not_voting_total" INTEGER,
    "democrat_yea" INTEGER,
    "democrat_nay" INTEGER,
    "republican_yea" INTEGER,
    "republican_nay" INTEGER,
    "independent_yea" INTEGER,
    "independent_nay" INTEGER,
    "bipartisan" BOOLEAN,
    "party_line_vote" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vote_positions" (
    "id" SERIAL NOT NULL,
    "vote_id" TEXT NOT NULL,
    "member_bioguide_id" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vote_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "committees" (
    "id" SERIAL NOT NULL,
    "committee_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "chamber" TEXT NOT NULL,
    "committee_type" TEXT,
    "parent_committee_code" TEXT,
    "chair_bioguide_id" TEXT,
    "ranking_member_id" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "website" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "committees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "committee_memberships" (
    "id" SERIAL NOT NULL,
    "committee_code" TEXT NOT NULL,
    "member_bioguide_id" TEXT NOT NULL,
    "rank" INTEGER,
    "is_chair" BOOLEAN NOT NULL DEFAULT false,
    "is_ranking_member" BOOLEAN NOT NULL DEFAULT false,
    "start_date" DATE,
    "end_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "committee_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amendments" (
    "id" SERIAL NOT NULL,
    "amendment_id" TEXT NOT NULL,
    "congress" INTEGER NOT NULL,
    "amendment_type" TEXT NOT NULL,
    "amendment_number" INTEGER NOT NULL,
    "bill_id" TEXT,
    "sponsor_bioguide_id" TEXT,
    "submitted_date" DATE,
    "purpose" TEXT,
    "description" TEXT,
    "status" TEXT,
    "amendment_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "amendments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_actions" (
    "id" SERIAL NOT NULL,
    "bill_id" TEXT NOT NULL,
    "action_date" DATE NOT NULL,
    "action_time" TEXT,
    "action_text" TEXT NOT NULL,
    "action_code" TEXT,
    "chamber" TEXT,
    "action_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bill_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lobbying_reports" (
    "id" SERIAL NOT NULL,
    "report_id" TEXT NOT NULL,
    "filing_date" DATE,
    "filing_type" TEXT,
    "registrant_name" TEXT,
    "registrant_id" TEXT,
    "client_name" TEXT,
    "client_id" TEXT,
    "income_amount" DECIMAL(12,2),
    "expense_amount" DECIMAL(12,2),
    "general_issue_codes" JSONB,
    "specific_issues" TEXT,
    "bills_mentioned" JSONB,
    "lobbyists" JSONB,
    "government_entities" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lobbying_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_contributions" (
    "id" SERIAL NOT NULL,
    "member_bioguide_id" TEXT NOT NULL,
    "contributor_name" TEXT NOT NULL,
    "contributor_type" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "contribution_date" DATE,
    "cycle" INTEGER NOT NULL,
    "industry_name" TEXT,
    "sector_name" TEXT,
    "source" TEXT NOT NULL DEFAULT 'OpenSecrets',
    "external_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_contributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "districts" (
    "id" SERIAL NOT NULL,
    "state" TEXT NOT NULL,
    "district_number" INTEGER NOT NULL,
    "congress" INTEGER NOT NULL,
    "member_bioguide_id" TEXT,
    "total_population" INTEGER,
    "median_age" DECIMAL(4,1),
    "median_income" DECIMAL(10,2),
    "poverty_rate" DECIMAL(5,2),
    "unemployment_rate" DECIMAL(5,2),
    "percent_white" DECIMAL(5,2),
    "percent_black" DECIMAL(5,2),
    "percent_hispanic" DECIMAL(5,2),
    "percent_asian" DECIMAL(5,2),
    "percent_other" DECIMAL(5,2),
    "percent_bachelors" DECIMAL(5,2),
    "percent_graduate" DECIMAL(5,2),
    "median_home_value" DECIMAL(12,2),
    "homeownership_rate" DECIMAL(5,2),
    "veteran_population" INTEGER,
    "census_data_json" JSONB,
    "geojson_boundary" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "federal_spending" (
    "id" SERIAL NOT NULL,
    "state" TEXT NOT NULL,
    "district_number" INTEGER NOT NULL,
    "congress" INTEGER NOT NULL,
    "fiscal_year" INTEGER NOT NULL,
    "total_obligations" DECIMAL(15,2),
    "defense_spending" DECIMAL(15,2),
    "healthcare_spending" DECIMAL(15,2),
    "education_spending" DECIMAL(15,2),
    "infrastructure_spend" DECIMAL(15,2),
    "agriculture_spending" DECIMAL(15,2),
    "top_awards_json" JSONB,
    "source" TEXT NOT NULL DEFAULT 'USASpending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "federal_spending_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_articles" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source" TEXT,
    "author" TEXT,
    "published_at" TIMESTAMP(3),
    "summary" TEXT,
    "full_text" TEXT,
    "bills_mentioned" JSONB,
    "members_mentioned" JSONB,
    "sentiment_score" DECIMAL(5,2),
    "credibility_score" DECIMAL(5,2),
    "bias_rating" TEXT,
    "topics" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hearings" (
    "id" SERIAL NOT NULL,
    "hearing_id" TEXT NOT NULL,
    "congress" INTEGER,
    "chamber" TEXT,
    "committee_code" TEXT,
    "title" TEXT,
    "hearing_date" DATE,
    "hearing_type" TEXT,
    "location" TEXT,
    "description" TEXT,
    "transcript_url" TEXT,
    "video_url" TEXT,
    "witnesses" JSONB,
    "bills_discussed" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hearings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "role" TEXT,
    "office_id" INTEGER,
    "member_bioguide_id" TEXT,
    "api_key" TEXT,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offices" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "member_bioguide_id" TEXT,
    "tier" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "subscription_start" DATE,
    "subscription_end" DATE,
    "monthly_api_calls" INTEGER NOT NULL DEFAULT 0,
    "api_call_limit" INTEGER,
    "settings_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_tracking" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "bill_id" TEXT NOT NULL,
    "alert_on_update" BOOLEAN NOT NULL DEFAULT true,
    "alert_on_vote" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bill_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_cache" (
    "id" SERIAL NOT NULL,
    "cache_key" TEXT NOT NULL,
    "cache_value" JSONB NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" SERIAL NOT NULL,
    "event_type" TEXT NOT NULL,
    "user_id" INTEGER,
    "api_key" TEXT,
    "endpoint" TEXT,
    "method" TEXT,
    "query_params" JSONB,
    "response_time_ms" INTEGER,
    "status_code" INTEGER,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_BillLobbyingReports" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_BillLobbyingReports_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_BillNewsArticles" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_BillNewsArticles_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_MemberNewsArticles" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_MemberNewsArticles_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "bills_bill_id_key" ON "bills"("bill_id");

-- CreateIndex
CREATE INDEX "bills_congress_idx" ON "bills"("congress");

-- CreateIndex
CREATE INDEX "bills_status_idx" ON "bills"("status");

-- CreateIndex
CREATE INDEX "bills_introduced_date_idx" ON "bills"("introduced_date");

-- CreateIndex
CREATE INDEX "bills_sponsor_bioguide_id_idx" ON "bills"("sponsor_bioguide_id");

-- CreateIndex
CREATE UNIQUE INDEX "bills_congress_bill_type_bill_number_key" ON "bills"("congress", "bill_type", "bill_number");

-- CreateIndex
CREATE UNIQUE INDEX "members_bioguide_id_key" ON "members"("bioguide_id");

-- CreateIndex
CREATE INDEX "members_bioguide_id_idx" ON "members"("bioguide_id");

-- CreateIndex
CREATE INDEX "members_state_idx" ON "members"("state");

-- CreateIndex
CREATE INDEX "members_party_idx" ON "members"("party");

-- CreateIndex
CREATE INDEX "members_chamber_idx" ON "members"("chamber");

-- CreateIndex
CREATE INDEX "members_current_member_idx" ON "members"("current_member");

-- CreateIndex
CREATE INDEX "cosponsors_bill_id_idx" ON "cosponsors"("bill_id");

-- CreateIndex
CREATE INDEX "cosponsors_member_bioguide_id_idx" ON "cosponsors"("member_bioguide_id");

-- CreateIndex
CREATE UNIQUE INDEX "cosponsors_bill_id_member_bioguide_id_key" ON "cosponsors"("bill_id", "member_bioguide_id");

-- CreateIndex
CREATE UNIQUE INDEX "votes_vote_id_key" ON "votes"("vote_id");

-- CreateIndex
CREATE INDEX "votes_congress_idx" ON "votes"("congress");

-- CreateIndex
CREATE INDEX "votes_chamber_idx" ON "votes"("chamber");

-- CreateIndex
CREATE INDEX "votes_vote_date_idx" ON "votes"("vote_date");

-- CreateIndex
CREATE INDEX "votes_bill_id_idx" ON "votes"("bill_id");

-- CreateIndex
CREATE INDEX "vote_positions_vote_id_idx" ON "vote_positions"("vote_id");

-- CreateIndex
CREATE INDEX "vote_positions_member_bioguide_id_idx" ON "vote_positions"("member_bioguide_id");

-- CreateIndex
CREATE INDEX "vote_positions_position_idx" ON "vote_positions"("position");

-- CreateIndex
CREATE UNIQUE INDEX "vote_positions_vote_id_member_bioguide_id_key" ON "vote_positions"("vote_id", "member_bioguide_id");

-- CreateIndex
CREATE UNIQUE INDEX "committees_committee_code_key" ON "committees"("committee_code");

-- CreateIndex
CREATE INDEX "committees_chamber_idx" ON "committees"("chamber");

-- CreateIndex
CREATE INDEX "committees_committee_type_idx" ON "committees"("committee_type");

-- CreateIndex
CREATE INDEX "committee_memberships_committee_code_idx" ON "committee_memberships"("committee_code");

-- CreateIndex
CREATE INDEX "committee_memberships_member_bioguide_id_idx" ON "committee_memberships"("member_bioguide_id");

-- CreateIndex
CREATE UNIQUE INDEX "committee_memberships_committee_code_member_bioguide_id_key" ON "committee_memberships"("committee_code", "member_bioguide_id");

-- CreateIndex
CREATE UNIQUE INDEX "amendments_amendment_id_key" ON "amendments"("amendment_id");

-- CreateIndex
CREATE INDEX "amendments_congress_idx" ON "amendments"("congress");

-- CreateIndex
CREATE INDEX "amendments_bill_id_idx" ON "amendments"("bill_id");

-- CreateIndex
CREATE INDEX "amendments_sponsor_bioguide_id_idx" ON "amendments"("sponsor_bioguide_id");

-- CreateIndex
CREATE INDEX "bill_actions_bill_id_idx" ON "bill_actions"("bill_id");

-- CreateIndex
CREATE INDEX "bill_actions_action_date_idx" ON "bill_actions"("action_date");

-- CreateIndex
CREATE UNIQUE INDEX "lobbying_reports_report_id_key" ON "lobbying_reports"("report_id");

-- CreateIndex
CREATE INDEX "lobbying_reports_registrant_name_idx" ON "lobbying_reports"("registrant_name");

-- CreateIndex
CREATE INDEX "lobbying_reports_client_name_idx" ON "lobbying_reports"("client_name");

-- CreateIndex
CREATE INDEX "lobbying_reports_filing_date_idx" ON "lobbying_reports"("filing_date");

-- CreateIndex
CREATE INDEX "campaign_contributions_member_bioguide_id_idx" ON "campaign_contributions"("member_bioguide_id");

-- CreateIndex
CREATE INDEX "campaign_contributions_cycle_idx" ON "campaign_contributions"("cycle");

-- CreateIndex
CREATE INDEX "campaign_contributions_industry_name_idx" ON "campaign_contributions"("industry_name");

-- CreateIndex
CREATE INDEX "districts_state_idx" ON "districts"("state");

-- CreateIndex
CREATE INDEX "districts_member_bioguide_id_idx" ON "districts"("member_bioguide_id");

-- CreateIndex
CREATE UNIQUE INDEX "districts_state_district_number_congress_key" ON "districts"("state", "district_number", "congress");

-- CreateIndex
CREATE INDEX "federal_spending_state_idx" ON "federal_spending"("state");

-- CreateIndex
CREATE INDEX "federal_spending_fiscal_year_idx" ON "federal_spending"("fiscal_year");

-- CreateIndex
CREATE UNIQUE INDEX "federal_spending_state_district_number_congress_fiscal_year_key" ON "federal_spending"("state", "district_number", "congress", "fiscal_year");

-- CreateIndex
CREATE UNIQUE INDEX "news_articles_url_key" ON "news_articles"("url");

-- CreateIndex
CREATE INDEX "news_articles_published_at_idx" ON "news_articles"("published_at");

-- CreateIndex
CREATE UNIQUE INDEX "hearings_hearing_id_key" ON "hearings"("hearing_id");

-- CreateIndex
CREATE INDEX "hearings_committee_code_idx" ON "hearings"("committee_code");

-- CreateIndex
CREATE INDEX "hearings_hearing_date_idx" ON "hearings"("hearing_date");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_api_key_key" ON "users"("api_key");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_api_key_idx" ON "users"("api_key");

-- CreateIndex
CREATE INDEX "users_office_id_idx" ON "users"("office_id");

-- CreateIndex
CREATE INDEX "offices_member_bioguide_id_idx" ON "offices"("member_bioguide_id");

-- CreateIndex
CREATE INDEX "bill_tracking_user_id_idx" ON "bill_tracking"("user_id");

-- CreateIndex
CREATE INDEX "bill_tracking_bill_id_idx" ON "bill_tracking"("bill_id");

-- CreateIndex
CREATE UNIQUE INDEX "bill_tracking_user_id_bill_id_key" ON "bill_tracking"("user_id", "bill_id");

-- CreateIndex
CREATE UNIQUE INDEX "api_cache_cache_key_key" ON "api_cache"("cache_key");

-- CreateIndex
CREATE INDEX "api_cache_cache_key_idx" ON "api_cache"("cache_key");

-- CreateIndex
CREATE INDEX "api_cache_expires_at_idx" ON "api_cache"("expires_at");

-- CreateIndex
CREATE INDEX "analytics_events_event_type_idx" ON "analytics_events"("event_type");

-- CreateIndex
CREATE INDEX "analytics_events_user_id_idx" ON "analytics_events"("user_id");

-- CreateIndex
CREATE INDEX "analytics_events_created_at_idx" ON "analytics_events"("created_at");

-- CreateIndex
CREATE INDEX "_BillLobbyingReports_B_index" ON "_BillLobbyingReports"("B");

-- CreateIndex
CREATE INDEX "_BillNewsArticles_B_index" ON "_BillNewsArticles"("B");

-- CreateIndex
CREATE INDEX "_MemberNewsArticles_B_index" ON "_MemberNewsArticles"("B");

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_sponsor_bioguide_id_fkey" FOREIGN KEY ("sponsor_bioguide_id") REFERENCES "members"("bioguide_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cosponsors" ADD CONSTRAINT "cosponsors_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bills"("bill_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cosponsors" ADD CONSTRAINT "cosponsors_member_bioguide_id_fkey" FOREIGN KEY ("member_bioguide_id") REFERENCES "members"("bioguide_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bills"("bill_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vote_positions" ADD CONSTRAINT "vote_positions_vote_id_fkey" FOREIGN KEY ("vote_id") REFERENCES "votes"("vote_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vote_positions" ADD CONSTRAINT "vote_positions_member_bioguide_id_fkey" FOREIGN KEY ("member_bioguide_id") REFERENCES "members"("bioguide_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committees" ADD CONSTRAINT "committees_parent_committee_code_fkey" FOREIGN KEY ("parent_committee_code") REFERENCES "committees"("committee_code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committee_memberships" ADD CONSTRAINT "committee_memberships_committee_code_fkey" FOREIGN KEY ("committee_code") REFERENCES "committees"("committee_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committee_memberships" ADD CONSTRAINT "committee_memberships_member_bioguide_id_fkey" FOREIGN KEY ("member_bioguide_id") REFERENCES "members"("bioguide_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amendments" ADD CONSTRAINT "amendments_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bills"("bill_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amendments" ADD CONSTRAINT "amendments_sponsor_bioguide_id_fkey" FOREIGN KEY ("sponsor_bioguide_id") REFERENCES "members"("bioguide_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_actions" ADD CONSTRAINT "bill_actions_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bills"("bill_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_contributions" ADD CONSTRAINT "campaign_contributions_member_bioguide_id_fkey" FOREIGN KEY ("member_bioguide_id") REFERENCES "members"("bioguide_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "districts" ADD CONSTRAINT "districts_member_bioguide_id_fkey" FOREIGN KEY ("member_bioguide_id") REFERENCES "members"("bioguide_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "federal_spending" ADD CONSTRAINT "federal_spending_state_district_number_congress_fkey" FOREIGN KEY ("state", "district_number", "congress") REFERENCES "districts"("state", "district_number", "congress") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hearings" ADD CONSTRAINT "hearings_committee_code_fkey" FOREIGN KEY ("committee_code") REFERENCES "committees"("committee_code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_member_bioguide_id_fkey" FOREIGN KEY ("member_bioguide_id") REFERENCES "members"("bioguide_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offices" ADD CONSTRAINT "offices_member_bioguide_id_fkey" FOREIGN KEY ("member_bioguide_id") REFERENCES "members"("bioguide_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_tracking" ADD CONSTRAINT "bill_tracking_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_tracking" ADD CONSTRAINT "bill_tracking_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bills"("bill_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BillLobbyingReports" ADD CONSTRAINT "_BillLobbyingReports_A_fkey" FOREIGN KEY ("A") REFERENCES "bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BillLobbyingReports" ADD CONSTRAINT "_BillLobbyingReports_B_fkey" FOREIGN KEY ("B") REFERENCES "lobbying_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BillNewsArticles" ADD CONSTRAINT "_BillNewsArticles_A_fkey" FOREIGN KEY ("A") REFERENCES "bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BillNewsArticles" ADD CONSTRAINT "_BillNewsArticles_B_fkey" FOREIGN KEY ("B") REFERENCES "news_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MemberNewsArticles" ADD CONSTRAINT "_MemberNewsArticles_A_fkey" FOREIGN KEY ("A") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MemberNewsArticles" ADD CONSTRAINT "_MemberNewsArticles_B_fkey" FOREIGN KEY ("B") REFERENCES "news_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
