import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getPlatform: vi.fn(),
}));

vi.mock("@capacitor/core", () => ({
  Capacitor: { getPlatform: mocks.getPlatform },
}));

describe("native keyboard resize", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("configures the resize mode on iOS", async () => {
    mocks.getPlatform.mockReturnValue("ios");
    const setResizeMode = vi.fn().mockResolvedValue(undefined);
    const { configureNativeKeyboardResize } = await import("@/lib/nativeKeyboard");

    await configureNativeKeyboardResize({ setResizeMode }, "none");

    expect(setResizeMode).toHaveBeenCalledWith({ mode: "none" });
  });

  it("does not call the iOS-only API on Android", async () => {
    mocks.getPlatform.mockReturnValue("android");
    const setResizeMode = vi.fn();
    const { configureNativeKeyboardResize } = await import("@/lib/nativeKeyboard");

    await configureNativeKeyboardResize({ setResizeMode }, "none");

    expect(setResizeMode).not.toHaveBeenCalled();
  });
});
