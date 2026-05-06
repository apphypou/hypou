-- Garante no máximo 1 vídeo por item
DELETE FROM item_videos a
USING item_videos b
WHERE a.item_id = b.item_id
  AND a.created_at < b.created_at;

ALTER TABLE item_videos
  ADD CONSTRAINT item_videos_item_id_unique UNIQUE (item_id);