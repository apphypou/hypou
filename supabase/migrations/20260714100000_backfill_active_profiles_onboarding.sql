-- Legacy profiles existed before the onboarding flag was introduced. Users
-- who already exchanged data in the app must not be sent back to onboarding.
UPDATE public.profiles AS profile
SET onboarding_completed = true
WHERE profile.onboarding_completed = false
  AND NULLIF(BTRIM(profile.display_name), '') IS NOT NULL
  AND (
    EXISTS (SELECT 1 FROM public.items WHERE user_id = profile.user_id)
    OR EXISTS (
      SELECT 1
      FROM public.matches
      WHERE user_a_id = profile.user_id OR user_b_id = profile.user_id
    )
    OR EXISTS (SELECT 1 FROM public.messages WHERE sender_id = profile.user_id)
  );
