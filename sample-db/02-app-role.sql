-- Read-only role for the app's run_readonly_sql escape-hatch tool.
-- Runs after 01-init.sql on container init (docker-entrypoint-initdb.d executes
-- files in filename order). Additive only — doesn't touch the provided schema.

CREATE ROLE voiceops_readonly LOGIN PASSWORD 'voiceops_readonly';

GRANT CONNECT ON DATABASE voiceops TO voiceops_readonly;
GRANT USAGE ON SCHEMA public TO voiceops_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO voiceops_readonly;

-- Covers tables created later (e.g. dashboard_instances in a future phase) as long as
-- they're created by the same role running this statement (voiceops, via POSTGRES_USER).
ALTER DEFAULT PRIVILEGES FOR ROLE voiceops IN SCHEMA public GRANT SELECT ON TABLES TO voiceops_readonly;
