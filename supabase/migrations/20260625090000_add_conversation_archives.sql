-- Per-user archive state. The conversation itself remains intact so trade and
-- safety history is available even after a block, cancellation, or item deletion.
create table if not exists public.conversation_archives (
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  archived_at timestamptz not null default now(),
  primary key (user_id, conversation_id)
);

create index if not exists conversation_archives_conversation_id_idx
  on public.conversation_archives (conversation_id);

alter table public.conversation_archives enable row level security;

-- An archive row is personal, but it must also belong to a conversation from a
-- match that the current user participates in. Checking only user_id would let
-- an authenticated user archive an arbitrary conversation UUID.
drop policy if exists "Users manage their own conversation archives" on public.conversation_archives;
drop policy if exists "Conversation archive rows are visible to participants" on public.conversation_archives;
drop policy if exists "Participants can archive their conversations" on public.conversation_archives;
drop policy if exists "Participants can unarchive their conversations" on public.conversation_archives;

create policy "Conversation archive rows are visible to participants"
  on public.conversation_archives
  for select
  to authenticated
  using (
    user_id = auth.uid()
    and exists (
      select 1
      from public.conversations c
      join public.matches m on m.id = c.match_id
      where c.id = conversation_archives.conversation_id
        and (m.user_a_id = auth.uid() or m.user_b_id = auth.uid())
    )
  );

create policy "Participants can archive their conversations"
  on public.conversation_archives
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.conversations c
      join public.matches m on m.id = c.match_id
      where c.id = conversation_archives.conversation_id
        and (m.user_a_id = auth.uid() or m.user_b_id = auth.uid())
    )
  );

create policy "Participants can unarchive their conversations"
  on public.conversation_archives
  for delete
  to authenticated
  using (
    user_id = auth.uid()
    and exists (
      select 1
      from public.conversations c
      join public.matches m on m.id = c.match_id
      where c.id = conversation_archives.conversation_id
        and (m.user_a_id = auth.uid() or m.user_b_id = auth.uid())
    )
  );
