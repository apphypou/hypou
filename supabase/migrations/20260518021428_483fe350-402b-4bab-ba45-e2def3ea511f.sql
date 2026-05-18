-- Enable pg_net for HTTP calls from the database
create extension if not exists pg_net with schema extensions;

-- =========================================================
-- device_tokens
-- =========================================================
create table if not exists public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  platform text not null check (platform in ('ios','android','web')),
  token text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.device_tokens enable row level security;

drop policy if exists "Users can view own tokens" on public.device_tokens;
create policy "Users can view own tokens" on public.device_tokens
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can insert own tokens" on public.device_tokens;
create policy "Users can insert own tokens" on public.device_tokens
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can update own tokens" on public.device_tokens;
create policy "Users can update own tokens" on public.device_tokens
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own tokens" on public.device_tokens;
create policy "Users can delete own tokens" on public.device_tokens
  for delete to authenticated using (auth.uid() = user_id);

create index if not exists idx_device_tokens_user on public.device_tokens(user_id);

create trigger update_device_tokens_updated_at
  before update on public.device_tokens
  for each row execute function public.update_updated_at_column();

-- =========================================================
-- notify_push helper (calls edge function via pg_net)
-- =========================================================
create or replace function public.notify_push(
  p_user uuid,
  p_title text,
  p_body text,
  p_data jsonb default '{}'::jsonb
) returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  _url text;
  _key text;
begin
  begin
    select decrypted_secret into _url from vault.decrypted_secrets where name = 'project_url' limit 1;
    select decrypted_secret into _key from vault.decrypted_secrets where name = 'service_role_key' limit 1;
  exception when others then
    return;
  end;

  if _url is null or _key is null then
    return;
  end if;

  perform net.http_post(
    url := _url || '/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization','Bearer ' || _key
    ),
    body := jsonb_build_object(
      'user_id', p_user,
      'title', p_title,
      'body', p_body,
      'data', p_data
    )
  );
end;
$$;

-- =========================================================
-- Trigger: new chat message
-- =========================================================
create or replace function public.tr_push_new_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  _recipient uuid;
  _sender_name text;
begin
  if new.message_type = 'system' then
    return new;
  end if;

  select case when m.user_a_id = new.sender_id then m.user_b_id else m.user_a_id end
    into _recipient
    from public.conversations c
    join public.matches m on m.id = c.match_id
    where c.id = new.conversation_id;

  if _recipient is null then return new; end if;

  select coalesce(display_name, 'Alguém') into _sender_name
    from public.public_profiles where user_id = new.sender_id;

  perform public.notify_push(
    _recipient,
    coalesce(_sender_name, 'Nova mensagem'),
    left(coalesce(new.content, ''), 140),
    jsonb_build_object(
      'type','message',
      'conversation_id', new.conversation_id
    )
  );
  return new;
end; $$;

drop trigger if exists trg_push_new_message on public.messages;
create trigger trg_push_new_message
  after insert on public.messages
  for each row execute function public.tr_push_new_message();

-- =========================================================
-- Trigger: incoming call
-- =========================================================
create or replace function public.tr_push_call_ringing()
returns trigger language plpgsql security definer set search_path = public as $$
declare _name text;
begin
  if new.status <> 'ringing' then return new; end if;
  select coalesce(display_name, 'Alguém') into _name
    from public.public_profiles where user_id = new.caller_id;

  perform public.notify_push(
    new.callee_id,
    coalesce(_name, 'Alguém') || ' está te ligando',
    case when new.kind = 'video' then 'Chamada de vídeo' else 'Chamada de áudio' end,
    jsonb_build_object(
      'type','call',
      'call_session_id', new.id,
      'conversation_id', new.conversation_id,
      'kind', new.kind
    )
  );
  return new;
end; $$;

drop trigger if exists trg_push_call_ringing on public.call_sessions;
create trigger trg_push_call_ringing
  after insert on public.call_sessions
  for each row execute function public.tr_push_call_ringing();

-- =========================================================
-- Trigger: new proposal
-- =========================================================
create or replace function public.tr_push_new_proposal()
returns trigger language plpgsql security definer set search_path = public as $$
declare _name text; _item text;
begin
  select coalesce(display_name, 'Alguém') into _name
    from public.public_profiles where user_id = new.user_a_id;
  select name into _item from public.items where id = new.item_b_id;

  perform public.notify_push(
    new.user_b_id,
    'Nova proposta! 🔔',
    coalesce(_name,'Alguém') || ' quer trocar pelo seu ' || coalesce(_item, 'item'),
    jsonb_build_object('type','proposal','match_id', new.id)
  );
  return new;
end; $$;

drop trigger if exists trg_push_new_proposal on public.matches;
create trigger trg_push_new_proposal
  after insert on public.matches
  for each row execute function public.tr_push_new_proposal();

-- =========================================================
-- Trigger: match accepted
-- =========================================================
create or replace function public.tr_push_match_accepted()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.status = 'accepted' or new.status <> 'accepted' then return new; end if;

  perform public.notify_push(
    new.user_a_id,
    'Hypou! 🎉',
    'Sua proposta foi aceita. Combine a entrega no chat.',
    jsonb_build_object('type','match','match_id', new.id)
  );
  perform public.notify_push(
    new.user_b_id,
    'Hypou! 🎉',
    'Vocês fecharam uma troca! Abra o chat pra combinar.',
    jsonb_build_object('type','match','match_id', new.id)
  );
  return new;
end; $$;

drop trigger if exists trg_push_match_accepted on public.matches;
create trigger trg_push_match_accepted
  after update on public.matches
  for each row execute function public.tr_push_match_accepted();