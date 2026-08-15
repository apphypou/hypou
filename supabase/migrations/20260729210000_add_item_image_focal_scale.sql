alter table public.item_images
  add column if not exists focal_scale numeric not null default 1;

alter table public.item_images
  drop constraint if exists item_images_focal_scale_range;

alter table public.item_images
  add constraint item_images_focal_scale_range
  check (focal_scale >= 1 and focal_scale <= 4);
