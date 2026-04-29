-- Single-row table to store forfeit ceremony state for live sync between admin and public screen
create table ceremony_state (
  id uuid primary key default gen_random_uuid(),
  phase text default 'idle',
  winner_name text,
  loser_name text,
  stag_forfeit text,
  loser_forfeit text,
  loser_penalty text,
  updated_at timestamptz default now()
);

-- Insert the single row
insert into ceremony_state (phase) values ('idle');

-- Realtime + RLS
alter publication supabase_realtime add table ceremony_state;
alter table ceremony_state enable row level security;
create policy "Public read access" on ceremony_state for select using (true);
create policy "Public update" on ceremony_state for update using (true);
