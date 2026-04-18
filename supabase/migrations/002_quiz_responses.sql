-- Quiz responses
create table quiz_responses (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id),
  question_number integer not null,
  answer text not null,
  is_correct boolean not null,
  created_at timestamptz default now(),
  unique(player_id, question_number)
);

-- Enable realtime
alter publication supabase_realtime add table quiz_responses;

-- RLS
alter table quiz_responses enable row level security;
create policy "Public read access" on quiz_responses for select using (true);
create policy "Public insert" on quiz_responses for insert with check (true);
