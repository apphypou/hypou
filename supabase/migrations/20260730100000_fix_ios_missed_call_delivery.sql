create table if not exists public.user_app_presence (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active boolean not null default false,
  last_seen timestamptz not null default now()
);

alter table public.user_app_presence enable row level security;

create or replace function public.set_app_presence(p_active boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;

  insert into public.user_app_presence (user_id, active, last_seen)
  values (auth.uid(), p_active, now())
  on conflict (user_id) do update
    set active = excluded.active,
        last_seen = excluded.last_seen;
end;
$$;

revoke all on function public.set_app_presence(boolean) from public;
grant execute on function public.set_app_presence(boolean) to authenticated;

create or replace function public.tr_push_missed_call()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _caller_name text;
begin
  if new.status = 'missed'
     and (tg_op = 'INSERT' or old.status is distinct from 'missed') then
    select coalesce(display_name, 'Alguém')
      into _caller_name
      from public.public_profiles
     where user_id = new.caller_id;

    perform public.notify_push(
      new.callee_id,
      'Chamada perdida',
      coalesce(_caller_name, 'Alguém') || ' ligou para você.',
      jsonb_build_object(
        'type', 'missed_call',
        'call_session_id', new.id,
        'conversation_id', new.conversation_id,
        'kind', new.kind
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_push_missed_call on public.call_sessions;
create trigger trg_push_missed_call
after insert or update on public.call_sessions
for each row execute function public.tr_push_missed_call();

create or replace function public.notify_call_ended()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _label text;
  _mins int;
  _secs int;
begin
  if new.status = 'missed'
     and (tg_op = 'INSERT' or old.status is distinct from 'missed') then
    _label := case when new.kind = 'video'
      then 'Chamada de vídeo perdida'
      else 'Chamada de áudio perdida'
    end;
  elsif tg_op = 'UPDATE'
    and new.status = 'ended'
    and old.status is distinct from 'ended' then
    if new.duration_seconds > 0 then
      _mins := new.duration_seconds / 60;
      _secs := new.duration_seconds % 60;
      _label := (case when new.kind = 'video' then 'Chamada de vídeo' else 'Chamada de áudio' end)
        || ' · ' || lpad(_mins::text, 2, '0') || ':' || lpad(_secs::text, 2, '0');
    else
      _label := case when new.kind = 'video'
        then 'Chamada de vídeo perdida'
        else 'Chamada de áudio perdida'
      end;
    end if;
  else
    return new;
  end if;

  insert into public.messages (conversation_id, sender_id, content, message_type)
  values (new.conversation_id, new.caller_id, _label, 'system');
  return new;
end;
$$;

drop trigger if exists trg_call_sessions_end_message on public.call_sessions;
create trigger trg_call_sessions_end_message
after insert or update on public.call_sessions
for each row execute function public.notify_call_ended();
