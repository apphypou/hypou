# Hypou Database

Remote Supabase project: `gfvqympaaglkplzbocbl`

This folder is the operational database map for iOS/Android development. Keep it aligned with `supabase/migrations` and `src/integrations/supabase/types.ts`.

## Migration History

Known state:

- Local migrations directory: `/Volumes/ADATA SC735/DEV/HYPOU/supabase/migrations`
- SQL Editor-applied migration: `20260616183000_add_cash_completion_to_proposals`
- SQL Editor-applied migration: `20260621190000_add_item_image_focal_point`
- Migration history repaired for the two SQL Editor-applied local versions: `20260616183000`, `20260621190000`.
- CLI verified project access with `supabase projects list`: linked project is `gfvqympaaglkplzbocbl` (`hypou app`, South America/Sao Paulo).
- `supabase migration list` shows historical drift: remote migration versions are mostly 2-4 seconds earlier than local filenames. Example: remote `20260222031506`, local `20260222031508`.
- `supabase gen types` from the remote already includes `matches.cash_amount_cents` and `matches.cash_payer_user_id`.
- `supabase gen types` from the remote now includes `item_images.focal_x` and `item_images.focal_y`.
- `docs/database/sql/02_mobile_indexes.sql` was applied through SQL Editor after correcting `swipes.user_id` to the real column `swipes.swiper_id`.
- `supabase db dump` requires Docker in this environment. If Docker is closed, open it before `npm run db:contracts` or `npm run mobile:preflight`.
- `npm run db:contracts` is the read-only remote contract gate for production. It checks recent migration alignment, Supabase lint, schema dump, required mobile columns/RPCs, storage policies, and public-table RLS coverage.
- `npm run mobile:preflight` is the release gate before TestFlight/internal Android. It runs mobile doctor, TypeScript, focused mobile tests, and `npm run db:contracts`.

When `supabase db push` fails with `Remote migration versions not found in local migrations directory`, do not force changes blindly. Capture the missing versions, compare schema, then either restore the missing local files or use `supabase migration repair` only after manual confirmation.

## Recommended Remote Apply Flow

Until migration history is repaired intentionally, prefer this flow for production Supabase:

1. Create a migration file under `supabase/migrations`.
2. Copy the exact SQL into a reviewed file under `docs/database/sql/`.
3. Apply the reviewed SQL in Supabase SQL Editor.
4. Run `notify pgrst, 'reload schema';`.
5. Regenerate types with `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run db:types`.
6. Run mobile smoke tests before TestFlight or Android internal builds.

Do not run `supabase db push --include-all` on this project unless the migration history has been audited. It may try to apply many local migrations that are equivalent to already-applied remote migrations with different timestamps.

## Production vs Staging

Production should only receive reviewed SQL through SQL Editor while historical migration drift exists.

For staging:

1. Create a second Supabase project.
2. Apply the same reviewed SQL files from `docs/database/sql/` in order.
3. Configure app env vars with the staging URL and publishable key.
4. Run destructive/real smoke flows only against staging.

The real E2E script is blocked from production by default. It only runs against the production project when `HYPOU_ALLOW_PROD_E2E=1` is set deliberately.

## Core Tables By Flow

- Auth/profile onboarding: `profiles`, `user_categories`, `public_profiles`, `user_roles`
- Item registration: `items`, `item_images`, `item_videos`, storage buckets `item-images` and `item-videos`
- Explore/swipe: `items`, `item_images`, `item_videos`, `swipes`, `favorites`, `blocked_users`
- Trades/proposals: `matches`, `notifications`
- Chat: `conversations`, `messages`, `call_sessions`, storage bucket `chat-media`
- Safety/admin: `reports`, `blocked_users`, `user_roles`

## RLS Classification

Private user-owned:

- `profiles`
- `items`
- `item_images`
- `item_videos`
- `favorites`
- `swipes`
- `user_categories`

Participant-only:

- `matches`
- `conversations`
- `messages`
- `call_sessions`

Moderation/admin:

- `reports`
- `blocked_users`
- `user_roles`

Public/read-optimized:

- `public_profiles`
- active public item feed through controlled selects/RPCs

## RPC Contracts Used By Mobile

- `recommended_items`: Explorar feed; should return active items excluding current user/seen/blocked where applicable.
- `get_my_matches`: Trocas and chat context; must include cash fields after cash-completion migration.
- `create_proposal`: Offer creation; supports selected item ids and optional `p_cash_amount_cents`.
- `toggle_video_like`: Video like state.
- `increment_video_view`: Video view count.
- `get_user_ratings_with_items`: Profile rating history with item context.
- `get_waitlist_position`: Waitlist position.

## Storage Buckets

- `avatars`: profile images.
- `item-images`: item photos used by swipe card and item details.
- `item-videos`: item videos used by item registration and swipe media.
- `chat-media`: images/videos sent inside conversations.

Database references:

- `profiles.avatar_url`
- `item_images.image_url`
- `item_videos.video_url`
- `item_videos.thumbnail_url`
- `messages.media_url`

## SQL Files

- `docs/database/sql/00_inventory.sql`: read-only inventory of tables, columns, policies, indexes, functions, triggers, buckets and migration history.
- `docs/database/sql/01_pending_mobile_schema.sql`: idempotent mobile schema required by current app code.
- `docs/database/sql/02_mobile_indexes.sql`: idempotent indexes for feed, item media, chat, matches, notifications and safety checks.
- `docs/database/sql/03_rls_audit.sql`: read-only RLS and policy inspection.
- `docs/database/sql/04_rpc_smoke_tests.sql`: read-only RPC and critical column contract checks.
- `docs/database/sql/05_storage_policy_audit.sql`: read-only storage bucket and storage object policy inspection.
- `docs/database/sql/06_mobile_contract_smoke.sql`: read-only combined mobile contract check for schema, buckets and RPCs.
- `docs/database/sql/07_drop_legacy_create_proposal_rpc.sql`: removes the old `create_proposal(uuid[], uuid)` overload after old mobile builds no longer need it.

## Hard Rule For Future Mobile Work

Every mobile feature that needs a database change must land in this order:

1. Add a local migration under `supabase/migrations`.
2. Add or update a reviewed SQL file under `docs/database/sql`.
3. Apply the exact SQL in Supabase SQL Editor.
4. Run `notify pgrst, 'reload schema';`.
5. Run `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run db:types`.
6. Add or update a contract test in `src/test/databaseContracts.test.ts`.
7. Run `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run mobile:doctor`.
8. Run `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run mobile:preflight` before TestFlight/internal Android.

Do not use `supabase db push --include-all` until historical migration drift is fully audited.
