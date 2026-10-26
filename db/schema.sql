
create table if not exists exams (
  id text primary key,
  title text not null,
  pass_mark integer not null default 0,
  players jsonb not null default '[]'::jsonb,
  tasks jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
create table if not exists exam_results (
  id uuid primary key default gen_random_uuid(),
  player_name text not null,
  exam_id text not null default 'default',
  exam_title text not null,
  score integer not null,
  total integer not null,
  passed boolean not null,
  per_task jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists exam_results_created_idx on exam_results(created_at desc);
