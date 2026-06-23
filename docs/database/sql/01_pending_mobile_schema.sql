-- Pending mobile schema fixes.
-- Safe to run more than once in Supabase SQL Editor.

alter table public.item_images
  add column if not exists focal_x numeric not null default 50,
  add column if not exists focal_y numeric not null default 50;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'item_images_focal_x_range'
      and conrelid = 'public.item_images'::regclass
  ) then
    alter table public.item_images
      add constraint item_images_focal_x_range
      check (focal_x >= 0 and focal_x <= 100);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'item_images_focal_y_range'
      and conrelid = 'public.item_images'::regclass
  ) then
    alter table public.item_images
      add constraint item_images_focal_y_range
      check (focal_y >= 0 and focal_y <= 100);
  end if;
end $$;

notify pgrst, 'reload schema';
