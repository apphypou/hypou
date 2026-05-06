CREATE OR REPLACE FUNCTION public.handle_trade_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _conv_id uuid;
  _other RECORD;
BEGIN
  IF OLD.status IS DISTINCT FROM 'completed' AND NEW.status = 'completed' THEN
    -- 1) System message in this match's conversation
    SELECT id INTO _conv_id FROM conversations WHERE match_id = NEW.id LIMIT 1;
    IF _conv_id IS NOT NULL THEN
      INSERT INTO messages (conversation_id, sender_id, content, message_type)
      VALUES (_conv_id, NEW.user_a_id, 'Troca concluída com sucesso! Avalie seu trocador para fortalecer a comunidade.', 'system');
    END IF;

    -- 2) Cancel other open matches involving either item
    FOR _other IN
      UPDATE matches
      SET status = 'cancelled', updated_at = now()
      WHERE id <> NEW.id
        AND status IN ('proposal','accepted')
        AND (
          item_a_id IN (NEW.item_a_id, NEW.item_b_id)
          OR item_b_id IN (NEW.item_a_id, NEW.item_b_id)
        )
      RETURNING id, user_a_id
    LOOP
      SELECT id INTO _conv_id FROM conversations WHERE match_id = _other.id LIMIT 1;
      IF _conv_id IS NOT NULL THEN
        INSERT INTO messages (conversation_id, sender_id, content, message_type)
        VALUES (_conv_id, _other.user_a_id, 'Item indisponível: este item já foi trocado em outra negociação. Esta conversa foi encerrada.', 'system');
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_handle_trade_completion ON public.matches;
CREATE TRIGGER trg_handle_trade_completion
AFTER UPDATE ON public.matches
FOR EACH ROW
EXECUTE FUNCTION public.handle_trade_completion();