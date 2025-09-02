create table if not exists public.agent_runs (
  run_id text primary key,
  agent_id text not null,
  status text not null check (status in ('pending','running','awaiting','completed','failed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  messages jsonb not null default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  cursor jsonb
);

create index if not exists agent_runs_agent_id_idx on public.agent_runs (agent_id);
create index if not exists agent_runs_status_idx on public.agent_runs (status);

-- RLS disabled for simplicity. Enable and add policies before exposing publicly.
alter table public.agent_runs disable row level security;

