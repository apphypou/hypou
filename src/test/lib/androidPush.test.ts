import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getPlatform: vi.fn() }));

vi.mock("@capacitor/core", () => ({
  Capacitor: { getPlatform: mocks.getPlatform },
}));

describe("Android push channel", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("creates the channel used by the existing FCM sender on Android", async () => {
    mocks.getPlatform.mockReturnValue("android");
    const createChannel = vi.fn().mockResolvedValue(undefined);
    const { ensureAndroidNotificationChannel } = await import("@/lib/androidPush");

    await ensureAndroidNotificationChannel({ createChannel });

    expect(createChannel).toHaveBeenCalledWith(expect.objectContaining({ id: "default", name: "Hypou" }));
  });

  it("does nothing outside Android", async () => {
    mocks.getPlatform.mockReturnValue("ios");
    const createChannel = vi.fn();
    const { ensureAndroidNotificationChannel } = await import("@/lib/androidPush");

    await ensureAndroidNotificationChannel({ createChannel });

    expect(createChannel).not.toHaveBeenCalled();
  });
});
