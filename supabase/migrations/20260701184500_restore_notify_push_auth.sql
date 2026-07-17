-- Restore the Bearer header expected by supabase/functions/send-push.
-- Uses a dedicated push secret instead of Supabase reserved env names.
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
    select decrypted_secret into _key from vault.decrypted_secrets where name = 'push_hook_secret' limit 1;
  exception when others then
    return;
  end;

  if _url is null or _key is null then
    return;
  end if;

  perform net.http_post(
    url := _url || '/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _key
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
