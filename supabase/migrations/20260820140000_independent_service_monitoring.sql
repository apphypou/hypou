CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'hypou-service-health-check') THEN
    PERFORM cron.unschedule((SELECT jobid FROM cron.job WHERE jobname = 'hypou-service-health-check'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'hypou_health_check_secret') THEN
    RAISE EXCEPTION 'Missing Vault secret hypou_health_check_secret required for independent service monitoring';
  END IF;

  PERFORM cron.schedule(
    'hypou-service-health-check',
    '*/5 * * * *',
    $job$
      SELECT net.http_post(
        url := 'https://gfvqympaaglkplzbocbl.supabase.co/functions/v1/admin-health-check',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-health-check-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'hypou_health_check_secret')
        ),
        body := jsonb_build_object('scheduled_at', now()),
        timeout_milliseconds := 5000
      );
    $job$
  );
END;
$$;
