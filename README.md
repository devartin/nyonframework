## Nyon Agents

Serverless-safe AI agent scaffolding for Vercel and Netlify with Supabase state.

### Features
- Stepwise agent runtime (fits serverless timeouts)
- Supabase-backed run/state persistence
- Vercel and Netlify function adapters (start/resume)

### Setup
1) Install deps: `npm i`
2) In Supabase, run `db/schema.sql`.
3) Set env: `OPENAI_API_KEY` on hosting platform.

### Usage
Request body example:

```json
{
  "supabaseUrl": "https://xyz.supabase.co",
  "supabaseAnonKey": "...",
  "agentId": "demo",
  "model": "gpt-4o-mini",
  "userInput": "Plan a 3-day NYC trip",
  "systemPrompt": "You are a helpful travel planner."
}
```

- Vercel: POST `/api/start` or `/api/resume`.
- Netlify: POST `/.netlify/functions/start` or `/.netlify/functions/resume`.

### Extend
- Add tools via `Tool` interface and incorporate in step execution.
- For long flows, call `resume` via a queue/webhook to continue.

