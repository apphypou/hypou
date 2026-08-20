-- Reviewed production SQL for migration 20260820131500_admin_staff_access_and_signup_events.

CREATE POLICY "Staff can update items" ON public.items FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can view conversations" ON public.conversations FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can view messages" ON public.messages FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can view match items" ON public.match_items FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE OR REPLACE FUNCTION public.record_profile_signup_event() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.product_events (user_id, event_name, properties) VALUES (NEW.user_id, 'signup_completed', '{}'::jsonb);
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS record_profile_signup_event ON public.profiles;
CREATE TRIGGER record_profile_signup_event AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.record_profile_signup_event();
