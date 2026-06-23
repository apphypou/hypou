import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isNativePlatform: vi.fn(),
  nativeShare: vi.fn(),
}));

vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: mocks.isNativePlatform },
}));

vi.mock("@capacitor/share", () => ({
  Share: { share: mocks.nativeShare },
}));

import { buildPublicItemUrl, shareContent } from "@/lib/share";

describe("native sharing", () => {
  beforeEach(() => {
    mocks.isNativePlatform.mockReset();
    mocks.nativeShare.mockReset();
  });

  it("builds a public item URL instead of a Capacitor-local URL", () => {
    expect(buildPublicItemUrl("item 123")).toBe(
      "https://hypou.lovable.app/item/item%20123",
    );
  });

  it("opens the native share sheet on Capacitor", async () => {
    mocks.isNativePlatform.mockReturnValue(true);
    mocks.nativeShare.mockResolvedValue({ activityType: "com.apple.UIKit.activity.CopyToPasteboard" });

    await shareContent({
      title: "Notebook — Hypou",
      text: "Veja este item",
      url: "https://hypou.lovable.app/item/123",
    });

    expect(mocks.nativeShare).toHaveBeenCalledWith({
      title: "Notebook — Hypou",
      text: "Veja este item",
      url: "https://hypou.lovable.app/item/123",
      dialogTitle: "Notebook — Hypou",
    });
  });
});
