-- Persisted dashboard panel state. Additive, app-owned — doesn't touch the
-- provided sample-db schema. Runs after 01-init.sql and 02-app-role.sql.

CREATE TABLE dashboard_instances (
  id SERIAL PRIMARY KEY,
  -- a dashboard is a single unified canvas now — view stays for schema
  -- stability but every row is 'dashboard'; what it contains is entirely
  -- driven by params (overviews + per-entity cards), not by view
  view TEXT NOT NULL CHECK (view = 'dashboard'),
  title TEXT NOT NULL,
  params JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_dashboard_instances_updated ON dashboard_instances(updated_at DESC);
