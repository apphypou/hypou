
-- Add location_point column using text type that we'll cast to geography in functions
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS longitude double precision;
