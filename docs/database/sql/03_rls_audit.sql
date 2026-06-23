-- RLS and policy audit for Hypou. Read-only.

select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;

select
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

select
  p.schemaname,
  p.tablename,
  p.policyname,
  p.qual,
  p.with_check
from pg_policies p
where p.schemaname = 'public'
  and (
    p.qual ilike '%auth.uid()%'
    or p.with_check ilike '%auth.uid()%'
  )
order by p.tablename, p.policyname;

select
  p.schemaname,
  p.tablename,
  p.policyname,
  case
    when p.qual ilike '%(select auth.uid())%' or p.with_check ilike '%(select auth.uid())%' then 'optimized_auth_uid'
    when p.qual ilike '%auth.uid()%' or p.with_check ilike '%auth.uid()%' then 'review_auth_uid_per_row'
    else 'no_auth_uid'
  end as performance_review,
  p.qual,
  p.with_check
from pg_policies p
where p.schemaname = 'public'
order by p.tablename, p.policyname;

select
  n.nspname as schema_name,
  p.proname as function_name,
  p.prosecdef as security_definer,
  p.provolatile as volatility,
  pg_get_function_identity_arguments(p.oid) as arguments
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
order by p.proname;
