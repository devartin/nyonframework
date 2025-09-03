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

-- Agent presets store for easy UI configuration
create table if not exists public.agent_presets (
  preset_id uuid primary key default gen_random_uuid(),
  name text not null,
  agent_id text not null,
  model text not null,
  system_prompt text,
  tools jsonb,
  created_at timestamptz not null default now()
);

alter table public.agent_presets disable row level security;

