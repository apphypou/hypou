-- Reviewed production SQL for migration 20260820134000_audit_staff_mutations.

CREATE OR REPLACE FUNCTION public.audit_staff_mutation() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE target uuid; action_name text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_staff(auth.uid()) THEN RETURN NEW; END IF;
  IF TG_TABLE_NAME = 'items' THEN target := NEW.user_id; action_name := CASE WHEN OLD.status IS DISTINCT FROM NEW.status THEN 'item_status_changed' ELSE 'item_updated' END;
  ELSIF TG_TABLE_NAME = 'reports' THEN target := NEW.reported_user_id; action_name := CASE WHEN OLD.status IS DISTINCT FROM NEW.status THEN 'report_status_changed' ELSE 'report_updated' END; END IF;
  INSERT INTO public.admin_audit_logs (actor_id, action, target_id, metadata) VALUES (auth.uid(), action_name, target, jsonb_build_object('record_id', NEW.id));
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS audit_staff_item_mutation ON public.items;
CREATE TRIGGER audit_staff_item_mutation AFTER UPDATE ON public.items FOR EACH ROW EXECUTE FUNCTION public.audit_staff_mutation();
DROP TRIGGER IF EXISTS audit_staff_report_mutation ON public.reports;
CREATE TRIGGER audit_staff_report_mutation AFTER UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.audit_staff_mutation();
