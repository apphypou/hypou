import { supabase } from "@/integrations/supabase/client";
import { trackProductEventSafely } from "@/services/productAnalyticsService";

export const createSwipe = async (swiperId: string, itemId: string, direction: "like" | "dislike" | "superlike") => {
  const { error } = await supabase
    .from("swipes")
    .insert({ swiper_id: swiperId, item_id: itemId, direction });
  if (error) throw error;
  trackProductEventSafely("swipe_created", swiperId, { direction });
};
