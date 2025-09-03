## Nyon Agents

Serverless-safe AI agent scaffolding for Vercel and Netlify with Supabase state.

### Features
- Stepwise agent runtime (fits serverless timeouts)
- Supabase-backed run/state persistence
- Vercel and Netlify function adapters (start/resume/run/message)
- Web playground (Vite + React + Tailwind)

### Setup
1) Install deps: `npm i`
2) Choose state backend:
   - Supabase: run `db/schema.sql`, set `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
   - Upstash Redis (no SQL): set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
3) Set `OPENAI_API_KEY` on hosting.

### Usage
- Vercel endpoints: `/api/start`, `/api/resume`, `/api/run`, `/api/message`
- Netlify endpoints: `/.netlify/functions/start`, `/.netlify/functions/resume`, `/.netlify/functions/run`, `/.netlify/functions/message`
- Web app: deployed from `web/` (Netlify `publish=web/dist`).

### Extend
- Add tools via `Tool` and incorporate in `AgentRuntime`.
- Queue resumes to continue long flows.

