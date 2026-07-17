alter table public.messages
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references auth.users(id);

create or replace function public.soft_delete_message(p_message_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _sender uuid;
begin
  if _uid is null then
    raise exception 'not_authenticated';
  end if;

  select sender_id into _sender
  from public.messages
  where id = p_message_id;

  if _sender is null then
    raise exception 'message_not_found';
  end if;

  if _sender <> _uid then
    raise exception 'only_sender_can_delete';
  end if;

  update public.messages
  set deleted_at = coalesce(deleted_at, now()),
      deleted_by = coalesce(deleted_by, _uid)
  where id = p_message_id;
end;
$$;

grant execute on function public.soft_delete_message(uuid) to authenticated;

alter table public.items
  add column if not exists deleted_at timestamptz;

create or replace function public.soft_delete_item(p_item_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
begin
  if _uid is null then
    raise exception 'not_authenticated';
  end if;

  update public.items
  set status = 'deleted',
      deleted_at = coalesce(deleted_at, now())
  where id = p_item_id
    and user_id = _uid;

  if not found then
    raise exception 'item_not_found';
  end if;
end;
$$;

grant execute on function public.soft_delete_item(uuid) to authenticated;
