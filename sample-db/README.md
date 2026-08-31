# VoiceOps Sample Database

Run:
```
docker compose up -d
```

Connect:
```
psql postgresql://voiceops:voiceops@localhost:5432/voiceops
```

Contains:
- **300 calls** with full transcripts (10-40 utterances each, diverse scenarios)
- **8 reps** across 2 teams
- **8 coaching skills** with scoring
- **Product insights** (extraction projects with structured data per call)
- **Objection tracking** (competitor mentions, price gaps, handling patterns)
- **Call metadata** (direction, state, disposition, competitor, outcome)
- **Coaching documents**

Tables:
- `orgs` — organizations
- `integration_persons` — reps/agents
- `calls` — call records with AI summaries
- `utterances` — transcript lines (speaker + timing)
- `call_metadata` — key-value metadata per call
- `coaching_skills` — skill definitions
- `comment_suggestions` — per-call skill scores
- `insight_projects` — analysis project configs
- `insight_raw_extractions` — structured extraction results (JSONB)
- `coaching_documents` — coaching docs for reps
