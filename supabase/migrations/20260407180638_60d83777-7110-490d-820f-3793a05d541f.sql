
-- Table for system incidents
CREATE TABLE public.system_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  status text NOT NULL DEFAULT 'investigating',
  severity text NOT NULL DEFAULT 'minor',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  created_by uuid NOT NULL
);

-- Table for incident timeline updates
CREATE TABLE public.incident_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES public.system_incidents(id) ON DELETE CASCADE,
  status text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL
);

-- Table for uptime check history
CREATE TABLE public.uptime_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  component text NOT NULL,
  status text NOT NULL DEFAULT 'operational',
  latency_ms integer,
  checked_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uptime_checks ENABLE ROW LEVEL SECURITY;

-- Admins can do everything on incidents
CREATE POLICY "Admins can view incidents" ON public.system_incidents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert incidents" ON public.system_incidents FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update incidents" ON public.system_incidents FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete incidents" ON public.system_incidents FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Incident updates
CREATE POLICY "Anyone can view incident updates" ON public.incident_updates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert incident updates" ON public.incident_updates FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete incident updates" ON public.incident_updates FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Uptime checks (system writes, admins read)
CREATE POLICY "Admins can view uptime checks" ON public.uptime_checks FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert uptime checks" ON public.uptime_checks FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));

-- Trigger to update updated_at
CREATE TRIGGER update_system_incidents_updated_at
  BEFORE UPDATE ON public.system_incidents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
