-- Mobile hot-path indexes for feed, media, chat, matches, notifications.
-- Safe to run more than once in Supabase SQL Editor.

create index if not exists items_active_feed_idx
  on public.items (status, created_at desc, user_id)
  where status = 'active';

create index if not exists items_user_status_idx
  on public.items (user_id, status, created_at desc);

create index if not exists item_images_item_position_idx
  on public.item_images (item_id, position);

create index if not exists item_videos_item_id_idx
  on public.item_videos (item_id);

create index if not exists swipes_swiper_item_idx
  on public.swipes (swiper_id, item_id);

create index if not exists swipes_item_swiper_idx
  on public.swipes (item_id, swiper_id);

create index if not exists favorites_user_item_idx
  on public.favorites (user_id, item_id);

create index if not exists matches_user_a_updated_idx
  on public.matches (user_a_id, updated_at desc);

create index if not exists matches_user_b_updated_idx
  on public.matches (user_b_id, updated_at desc);

create index if not exists matches_items_idx
  on public.matches (item_a_id, item_b_id);

create index if not exists conversations_match_id_idx
  on public.conversations (match_id);

create index if not exists messages_conversation_created_idx
  on public.messages (conversation_id, created_at desc);

create index if not exists messages_conversation_read_idx
  on public.messages (conversation_id, read_at);

create index if not exists blocked_users_blocker_blocked_idx
  on public.blocked_users (blocker_id, blocked_id);

create index if not exists blocked_users_blocked_blocker_idx
  on public.blocked_users (blocked_id, blocker_id);

create index if not exists reports_reporter_created_idx
  on public.reports (reporter_id, created_at desc);

create index if not exists notifications_user_read_created_idx
  on public.notifications (user_id, read_at, created_at desc);

create index if not exists user_categories_user_category_idx
  on public.user_categories (user_id, category);

create index if not exists call_sessions_conversation_created_idx
  on public.call_sessions (conversation_id, created_at desc);

notify pgrst, 'reload schema';
