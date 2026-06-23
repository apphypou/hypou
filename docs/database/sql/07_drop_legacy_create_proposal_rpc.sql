-- Remove legacy create_proposal overload after all mobile clients call the cash-aware RPC.
-- Safe to run more than once in Supabase SQL Editor.
--
-- Current app code calls:
--   public.create_proposal(p_my_item_ids uuid[], p_their_item_id uuid, p_cash_amount_cents integer)
--
-- This old overload does not store cash fields and should not be used by new iOS/Android builds.

drop function if exists public.create_proposal(uuid[], uuid);

notify pgrst, 'reload schema';
