-- Teams
create table teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- Players
create table players (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  team_id uuid references teams(id),
  created_at timestamptz default now()
);

-- Rounds
create table rounds (
  id uuid primary key default gen_random_uuid(),
  number integer not null unique,
  name text not null,
  emoji text,
  scheduled_time text,
  format text,
  scoring_guidance text,
  max_team_points integer,
  has_individual_scoring boolean default false,
  has_sub_matches boolean default false,
  sub_match_count integer,
  points_per_win integer default 3,
  points_per_loss integer default 1,
  status text default 'upcoming' check (status in ('upcoming', 'live', 'completed')),
  created_at timestamptz default now()
);

-- Team scores
create table team_scores (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id),
  team_id uuid not null references teams(id),
  match_number integer,
  points integer not null,
  created_at timestamptz default now()
);

-- Individual scores
create table individual_scores (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id),
  player_id uuid not null references players(id),
  match_number integer,
  points integer not null,
  created_at timestamptz default now()
);

-- Forfeits
create table forfeits (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  is_used boolean default false,
  created_at timestamptz default now()
);

-- Enable realtime on tables that change during the event
alter publication supabase_realtime add table teams;
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table team_scores;
alter publication supabase_realtime add table individual_scores;
alter publication supabase_realtime add table rounds;
alter publication supabase_realtime add table forfeits;

-- Allow anonymous read access to all tables
alter table teams enable row level security;
alter table players enable row level security;
alter table rounds enable row level security;
alter table team_scores enable row level security;
alter table individual_scores enable row level security;
alter table forfeits enable row level security;

create policy "Public read access" on teams for select using (true);
create policy "Public read access" on players for select using (true);
create policy "Public read access" on rounds for select using (true);
create policy "Public read access" on team_scores for select using (true);
create policy "Public read access" on individual_scores for select using (true);
create policy "Public read access" on forfeits for select using (true);

-- Allow inserts/updates via anon key (admin panel — no auth for this event)
create policy "Public insert" on team_scores for insert with check (true);
create policy "Public insert" on individual_scores for insert with check (true);
create policy "Public insert" on forfeits for insert with check (true);
create policy "Public update" on teams for update using (true);
create policy "Public update" on rounds for update using (true);
create policy "Public update" on forfeits for update using (true);
create policy "Public update" on players for update using (true);
create policy "Public delete" on individual_scores for delete using (true);
create policy "Public delete" on team_scores for delete using (true);
