import { describe, expect, it } from "vitest";
import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];
type Functions = Database["public"]["Functions"];

describe("mobile database contracts", () => {
  it("exposes image focal point columns used by mobile crop", () => {
    type ItemImage = Tables["item_images"]["Row"];
    const image: Pick<ItemImage, "focal_x" | "focal_y"> = {
      focal_x: 50,
      focal_y: 50,
    };

    expect(image).toEqual({ focal_x: 50, focal_y: 50 });
  });

  it("exposes cash proposal columns used by mobile offers", () => {
    type Match = Tables["matches"]["Row"];
    const match: Pick<Match, "cash_amount_cents" | "cash_payer_user_id"> = {
      cash_amount_cents: 9000,
      cash_payer_user_id: "00000000-0000-0000-0000-000000000001",
    };

    expect(match.cash_amount_cents).toBe(9000);
    expect(match.cash_payer_user_id).toContain("00000000");
  });

  it("exposes RPCs used by the mobile app", () => {
    type RequiredRpc =
      | keyof Pick<Functions, "recommended_items">
      | keyof Pick<Functions, "get_my_matches">
      | keyof Pick<Functions, "create_proposal">
      | keyof Pick<Functions, "toggle_video_like">
      | keyof Pick<Functions, "increment_video_view">
      | keyof Pick<Functions, "get_user_ratings_with_items">
      | keyof Pick<Functions, "get_waitlist_position">;

    const rpcNames: RequiredRpc[] = [
      "recommended_items",
      "get_my_matches",
      "create_proposal",
      "toggle_video_like",
      "increment_video_view",
      "get_user_ratings_with_items",
      "get_waitlist_position",
    ];

    expect(rpcNames).toHaveLength(7);
  });
});
