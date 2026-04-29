-- Allow deleting quiz responses (needed for restart entire event)
create policy "Public delete" on quiz_responses for delete using (true);
