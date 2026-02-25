-- Ratings table for post-trade reviews
CREATE TABLE public.ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL,
  rated_id UUID NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(match_id, rater_id)
);

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ratings about themselves or public" ON public.ratings
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own ratings" ON public.ratings
  FOR INSERT WITH CHECK (auth.uid() = rater_id);

-- Notifications table for in-app notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'match', 'message', 'rating', 'trade_confirmed'
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}',
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to create notification on new match
CREATE OR REPLACE FUNCTION public.notify_on_match()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Notify user A
  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (
    NEW.user_a_id,
    'match',
    'Novo Match! 🎉',
    'Alguém se interessou pelo seu item. Confira!',
    jsonb_build_object('match_id', NEW.id)
  );
  -- Notify user B
  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (
    NEW.user_b_id,
    'match',
    'Novo Match! 🎉',
    'Alguém se interessou pelo seu item. Confira!',
    jsonb_build_object('match_id', NEW.id)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_match
  AFTER INSERT ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_match();

-- Function to create notification on trade confirmed
CREATE OR REPLACE FUNCTION public.notify_on_trade_confirmed()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.status != 'accepted' AND NEW.status = 'accepted' THEN
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      NEW.user_a_id,
      'trade_confirmed',
      'Troca confirmada! ✅',
      'Uma troca foi aceita. Combine a entrega pelo chat.',
      jsonb_build_object('match_id', NEW.id)
    );
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      NEW.user_b_id,
      'trade_confirmed',
      'Troca confirmada! ✅',
      'Uma troca foi aceita. Combine a entrega pelo chat.',
      jsonb_build_object('match_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_trade_confirmed
  AFTER UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_trade_confirmed();
