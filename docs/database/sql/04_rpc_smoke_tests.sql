-- RPC/function and critical-column contract smoke checks. Read-only.
-- Returns one result set so the Supabase SQL Editor can verify all rows at once.

with expected_functions(name) as (
  values
    ('recommended_items'),
    ('get_my_matches'),
    ('create_proposal'),
    ('toggle_video_like'),
    ('increment_video_view'),
    ('get_user_ratings_with_items'),
    ('get_waitlist_position')
),
function_checks as (
  select
    'function'::text as kind,
    ef.name as name,
    case when p.oid is null then 'missing' else 'present' end as status,
    coalesce(pg_get_function_identity_arguments(p.oid), '') as details
  from expected_functions ef
  left join pg_proc p on p.proname = ef.name
  left join pg_namespace n on n.oid = p.pronamespace and n.nspname = 'public'
),
expected_columns(table_name, column_name) as (
  values
    ('item_images', 'focal_x'),
    ('item_images', 'focal_y'),
    ('matches', 'cash_amount_cents'),
    ('matches', 'cash_payer_user_id')
),
column_checks as (
  select
    'column'::text as kind,
    ec.table_name || '.' || ec.column_name as name,
    case when c.column_name is null then 'missing' else 'present' end as status,
    coalesce(c.data_type || ' nullable=' || c.is_nullable, '') as details
  from expected_columns ec
  left join information_schema.columns c
    on c.table_schema = 'public'
    and c.table_name = ec.table_name
    and c.column_name = ec.column_name
)
select *
from function_checks
union all
select *
from column_checks
order by kind, name;
