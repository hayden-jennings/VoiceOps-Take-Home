-- Persisted dashboard panel state. Additive, app-owned — doesn't touch the
-- provided sample-db schema. Runs after 01-init.sql and 02-app-role.sql.

CREATE TABLE dashboard_instances (
  id SERIAL PRIMARY KEY,
  view TEXT NOT NULL CHECK (view IN ('rep_scorecard', 'competitive_intelligence', 'call_explorer', 'objection_funnel')),
  title TEXT NOT NULL,
  params JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_dashboard_instances_updated ON dashboard_instances(updated_at DESC);
