alter table public.item_images
  add column if not exists focal_x numeric not null default 50,
  add column if not exists focal_y numeric not null default 50;

alter table public.item_images
  drop constraint if exists item_images_focal_x_range;

alter table public.item_images
  add constraint item_images_focal_x_range
  check (focal_x >= 0 and focal_x <= 100);

alter table public.item_images
  drop constraint if exists item_images_focal_y_range;

alter table public.item_images
  add constraint item_images_focal_y_range
  check (focal_y >= 0 and focal_y <= 100);

notify pgrst, 'reload schema';
