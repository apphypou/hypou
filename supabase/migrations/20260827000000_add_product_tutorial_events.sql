ALTER TABLE public.product_events
  DROP CONSTRAINT IF EXISTS product_events_event_name_check;

ALTER TABLE public.product_events
  ADD CONSTRAINT product_events_event_name_check CHECK (event_name IN (
    'landing_viewed', 'signup_completed', 'onboarding_completed', 'app_opened',
    'session_started', 'search_performed', 'item_created', 'item_viewed',
    'swipe_created', 'favorite_created', 'trade_started', 'trade_accepted',
    'trade_completed', 'message_sent', 'subscription_started', 'nps_answered',
    'feedback_submitted', 'tutorial_started', 'tutorial_step_viewed',
    'tutorial_completed', 'tutorial_skipped'
  ));
