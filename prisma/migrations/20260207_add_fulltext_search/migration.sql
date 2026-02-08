-- Full-text search indexes for bills
-- Uses GIN indexes on expression-based tsvector for efficient text search
-- No schema changes needed - just indexes on existing columns

CREATE INDEX IF NOT EXISTS idx_bills_fulltext_title
ON bills USING GIN (to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(short_title, '')));

CREATE INDEX IF NOT EXISTS idx_bills_fulltext_summary
ON bills USING GIN (to_tsvector('english', COALESCE(summary_text, '')));

CREATE INDEX IF NOT EXISTS idx_bills_fulltext_action
ON bills USING GIN (to_tsvector('english', COALESCE(latest_action_text, '')));

-- Combined index for searching across all bill text fields
CREATE INDEX IF NOT EXISTS idx_bills_fulltext_combined
ON bills USING GIN (to_tsvector('english',
  COALESCE(title, '') || ' ' ||
  COALESCE(short_title, '') || ' ' ||
  COALESCE(summary_text, '') || ' ' ||
  COALESCE(latest_action_text, '')
));

-- Full-text search index for members
CREATE INDEX IF NOT EXISTS idx_members_fulltext_name
ON members USING GIN (to_tsvector('english', full_name));

-- Full-text search index for hearings
CREATE INDEX IF NOT EXISTS idx_hearings_fulltext_title
ON hearings USING GIN (to_tsvector('english', COALESCE(title, '')));

-- Policy area index for bill filtering
CREATE INDEX IF NOT EXISTS idx_bills_policy_area ON bills (policy_area);

-- Lobbying report text search
CREATE INDEX IF NOT EXISTS idx_lobbying_fulltext
ON lobbying_reports USING GIN (to_tsvector('english',
  COALESCE(registrant_name, '') || ' ' ||
  COALESCE(client_name, '') || ' ' ||
  COALESCE(specific_issues, '')
));
