-- Database availability is measured independently from an open admin browser.
-- Other providers remain explicitly "Sem monitoramento" until a secure probe is
-- configured for each one.

CREATE OR REPLACE FUNCTION public.record_database_uptime_check()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM 1;
  INSERT INTO public.uptime_checks (component, status, latency_ms, checked_at)
  VALUES ('database', 'operational', NULL, now());
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'hypou-database-uptime') THEN
      PERFORM cron.unschedule((SELECT jobid FROM cron.job WHERE jobname = 'hypou-database-uptime'));
    END IF;
    PERFORM cron.schedule('hypou-database-uptime', '*/5 * * * *', 'SELECT public.record_database_uptime_check();');
  END IF;
END;
$$;
