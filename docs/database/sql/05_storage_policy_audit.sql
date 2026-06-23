-- Storage bucket and policy audit for Hypou mobile. Read-only.

select
  'bucket' as object_type,
  id as object_name,
  public::text as detail
from storage.buckets
where id in ('avatars', 'item-images', 'item-videos', 'chat-media')

union all

select
  'storage_policy' as object_type,
  policyname as object_name,
  tablename || ':' || permissive || ':' || array_to_string(roles, ',') as detail
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
order by object_type, object_name;
