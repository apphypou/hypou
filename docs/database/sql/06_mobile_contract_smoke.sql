-- Mobile contract smoke test for Hypou. Read-only.

with expected_contracts(contract_type, contract_name) as (
  values
    ('column', 'item_images.focal_x'),
    ('column', 'item_images.focal_y'),
    ('column', 'matches.cash_amount_cents'),
    ('column', 'matches.cash_payer_user_id'),
    ('bucket', 'avatars'),
    ('bucket', 'item-images'),
    ('bucket', 'item-videos'),
    ('bucket', 'chat-media'),
    ('function', 'recommended_items'),
    ('function', 'get_my_matches'),
    ('function', 'create_proposal'),
    ('function', 'toggle_video_like'),
    ('function', 'increment_video_view'),
    ('function', 'get_user_ratings_with_items'),
    ('function', 'get_waitlist_position')
),
actual_contracts as (
  select 'column' as contract_type, table_name || '.' || column_name as contract_name
  from information_schema.columns
  where table_schema = 'public'
    and (
      (table_name = 'item_images' and column_name in ('focal_x', 'focal_y'))
      or (table_name = 'matches' and column_name in ('cash_amount_cents', 'cash_payer_user_id'))
    )

  union all

  select 'bucket' as contract_type, id as contract_name
  from storage.buckets
  where id in ('avatars', 'item-images', 'item-videos', 'chat-media')

  union all

  select 'function' as contract_type, routine_name as contract_name
  from information_schema.routines
  where routine_schema = 'public'
    and routine_name in (
      'recommended_items',
      'get_my_matches',
      'create_proposal',
      'toggle_video_like',
      'increment_video_view',
      'get_user_ratings_with_items',
      'get_waitlist_position'
    )
)
select
  e.contract_type,
  e.contract_name,
  case when a.contract_name is null then 'missing' else 'ok' end as status
from expected_contracts e
left join actual_contracts a
  on a.contract_type = e.contract_type
 and a.contract_name = e.contract_name
order by e.contract_type, e.contract_name;
