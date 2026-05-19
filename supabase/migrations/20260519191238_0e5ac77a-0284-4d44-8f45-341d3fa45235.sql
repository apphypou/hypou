
-- Store project_url in vault (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'project_url') THEN
    PERFORM vault.create_secret('https://gfvqympaaglkplzbocbl.supabase.co', 'project_url');
  END IF;
END $$;

-- Update notify_push to not require service_role_key
CREATE OR REPLACE FUNCTION public.notify_push(p_user uuid, p_title text, p_body text, p_data jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  _url text;
begin
  begin
    select decrypted_secret into _url from vault.decrypted_secrets where name = 'project_url' limit 1;
  exception when others then
    return;
  end;

  if _url is null then
    return;
  end if;

  perform net.http_post(
    url := _url || '/functions/v1/send-push',
    headers := jsonb_build_object('Content-Type','application/json'),
    body := jsonb_build_object(
      'user_id', p_user,
      'title', p_title,
      'body', p_body,
      'data', p_data
    )
  );
end;
$function$;
