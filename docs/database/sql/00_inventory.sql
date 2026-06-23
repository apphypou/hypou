-- Database inventory for Hypou mobile development.
-- Safe to run in Supabase SQL Editor. Read-only.

select
  current_database() as database_name,
  current_schema() as current_schema,
  now() as inspected_at;

select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname in ('public', 'storage')
order by schemaname, tablename;

select
  table_schema,
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema in ('public', 'storage')
order by table_schema, table_name, ordinal_position;

select
  schemaname,
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
order by tablename, indexname;

select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as returns,
  p.prosecdef as security_definer
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
order by p.proname;

select
  trigger_schema,
  event_object_table,
  trigger_name,
  event_manipulation,
  action_statement
from information_schema.triggers
where trigger_schema = 'public'
order by event_object_table, trigger_name;

select
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
from storage.buckets
order by id;

select
  version,
  statements,
  name
from supabase_migrations.schema_migrations
order by version;
