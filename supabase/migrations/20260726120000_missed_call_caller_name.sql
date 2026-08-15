-- Include the caller name in the missed-call push sent after an unanswered call.
create or replace function public.tr_push_missed_call()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _caller_name text;
begin
  if new.status = 'missed' and old.status is distinct from 'missed' then
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
