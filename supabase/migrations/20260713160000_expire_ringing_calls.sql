-- The caller can disappear before its local timeout fires. Keep ringing calls
-- from blocking a conversation by expiring them from the database itself.
create extension if not exists pg_cron;

create or replace function public.expire_ringing_calls()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  expired_count integer;
begin
  update public.call_sessions
  set status = 'missed'
  where status = 'ringing'
    and started_at <= now() - interval '45 seconds';

  get diagnostics expired_count = row_count;
  return expired_count;
end;
$$;

revoke all on function public.expire_ringing_calls() from public;
grant execute on function public.expire_ringing_calls() to service_role;

create or replace function public.tr_push_missed_call()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'missed' and old.status is distinct from 'missed' then
    perform public.notify_push(
      new.callee_id,
      'Chamada perdida',
      case when new.kind = 'video' then 'Você perdeu uma chamada de vídeo.' else 'Você perdeu uma chamada de áudio.' end,
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
  after update on public.call_sessions
  for each row execute function public.tr_push_missed_call();

do $$
declare
  existing_job_id bigint;
begin
  select jobid
    into existing_job_id
    from cron.job
   where jobname = 'hypou-expire-ringing-calls';

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;

  perform cron.schedule(
    'hypou-expire-ringing-calls',
    '* * * * *',
    'select public.expire_ringing_calls();'
  );
end;
$$;
