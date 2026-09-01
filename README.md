# VoiceOps Chatbot

A conversational analytics chatbot for sales managers at Acme Insurance — ask about reps, calls,
coaching scores, and competitive intelligence in plain language. Generates inline charts and
persistent, filterable dashboard artifacts you can drill into, come back to, and ask the bot to
tweak.

## Prerequisites

- Docker (for Postgres, and optionally the whole app)
- Node.js 20+ (only needed if running the app locally instead of via Docker)
- An Anthropic API key

## Option A — run everything in Docker

From `sample-db/`:

```bash
export ANTHROPIC_API_KEY=sk-...
docker compose up -d
```

Or create `sample-db/.env` with `ANTHROPIC_API_KEY=sk-...` and just run `docker compose up -d` —
compose loads that file automatically. Open [http://localhost:3000](http://localhost:3000).

This builds and runs the app itself (`app/Dockerfile`) alongside Postgres, networked together —
no local Node install needed.

## Option B — run the app locally, Postgres in Docker

1. Start Postgres only:

   ```bash
   cd sample-db
   docker compose up -d postgres
   ```

2. Set up the app's environment — create `app/.env.local`:

   ```bash
   DATABASE_URL=postgresql://voiceops:voiceops@localhost:5432/voiceops
   DATABASE_URL_READONLY=postgresql://voiceops_readonly:voiceops_readonly@localhost:5432/voiceops
   ANTHROPIC_API_KEY=sk-...
   ANTHROPIC_MODEL=claude-haiku-4-5-20251001
   ```

3. Install and run:

   ```bash
   cd app
   npm install
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

## Notes

- `sample-db/*.sql` are the database init scripts (the provided schema, an additive read-only
  role for the SQL escape-hatch tool, and the app-owned `dashboard_instances` table) — they run
  automatically the first time the Postgres container starts.
- Generated charts are written to `app/public/generated/` at runtime and served via
  `app/app/api/generated/[filename]`, not Next's static file serving (which only serves files
  present at build time).
