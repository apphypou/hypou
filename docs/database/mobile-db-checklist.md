# Mobile Database Checklist

Run before TestFlight or Android internal testing.

## Migration Rules

- [ ] Every schema change has a migration file under `supabase/migrations`.
- [ ] If SQL Editor is used, paste the exact migration file contents and record the execution here.
- [ ] Never change old migration files after they have reached remote Supabase.
- [x] After any schema change, regenerate `src/integrations/supabase/types.ts`.
- [ ] Before TestFlight, run `docs/database/sql/00_inventory.sql` and confirm pending mobile columns exist.
- [ ] Before TestFlight/internal Android, run `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run mobile:preflight`.

## Last Remote Inventory

- Date: 2026-06-23
- Tables checked: migration history via `npm run db:migrations`; schema contracts via generated remote types; remote schema dump via `npm run db:dump`.
- Buckets checked: SQL Editor `docs/database/sql/05_storage_policy_audit.sql` confirmed 4/4 expected buckets and 16 storage object policies.
- Functions checked: SQL Editor `docs/database/sql/06_mobile_contract_smoke.sql` confirmed 15/15 mobile contracts ok and 0 missing.
- RLS checked: remote dump confirmed 25/25 public tables with RLS enabled and participant-only policies on `matches`, `conversations`, and `messages`.
- Lint checked: `supabase db lint --linked --schema public,storage --fail-on none --output json` returned only Supabase-managed `storage.search_by_timestamp` warnings.
- Preflight checked: `npm run mobile:preflight` passed with mobile doctor, TypeScript, 103 focused tests, and remote DB contracts.
- Unexpected missing objects: none found in generated contracts for current mobile code.
- Unexpected extra objects: historical migration timestamp drift remains; do not run `supabase db push --include-all`. Legacy `create_proposal(uuid[], uuid)` exists until `docs/database/sql/07_drop_legacy_create_proposal_rpc.sql` is applied.

## Required Remote Schema

- [x] `item_images.focal_x` exists. Last checked from generated remote types after SQL Editor apply: present.
- [x] `item_images.focal_y` exists. Last checked from generated remote types after SQL Editor apply: present.
- [x] `matches.cash_amount_cents` exists. Last checked from generated remote types: present.
- [x] `matches.cash_payer_user_id` exists. Last checked from generated remote types: present.

## Required Buckets

- [x] `avatars`
- [x] `item-images`
- [x] `item-videos`
- [x] `chat-media`

Last checked in Supabase SQL Editor on 2026-06-23 with `docs/database/sql/05_storage_policy_audit.sql`.

## Hot-Path Indexes

- [x] Feed indexes exist for `items`.
- [x] Media index exists for `item_images(item_id, position)`.
- [x] Message index exists for `messages(conversation_id, created_at desc)`.
- [x] Match indexes exist for `matches(user_a_id, updated_at desc)` and `matches(user_b_id, updated_at desc)`.
- [x] Notification index exists for `notifications(user_id, read_at, created_at desc)`.

## RLS

- [x] RLS audit shows private user-owned tables are protected.
- [x] RLS audit shows `matches`, `conversations`, `messages` are participant-only.
- [ ] Policies that use `auth.uid()` directly were reviewed for performance and converted to `(select auth.uid())` where safe.

## RPC Smoke

- [x] `recommended_items` exists.
- [x] `get_my_matches` exists.
- [x] `create_proposal` exists.
- [x] `toggle_video_like` exists.
- [x] `increment_video_view` exists.
- [x] `get_user_ratings_with_items` exists.
- [x] `get_waitlist_position` exists.

Last checked in Supabase SQL Editor on 2026-06-23 with `docs/database/sql/06_mobile_contract_smoke.sql`: 15 expected, 15 ok, 0 missing.

## Mobile Validation

- [x] `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run mobile:preflight` passes.
- [x] `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run mobile:doctor` passes.
- [ ] iOS Simulator can create item with photo.
- [ ] iOS Simulator can save image focal point.
- [ ] iOS Simulator can create proposal.
- [ ] iOS Simulator can complete proposal with cash.
- [ ] iOS Simulator can send chat text/image/video.
- [ ] Newest chat moves to top.
