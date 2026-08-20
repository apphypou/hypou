import { beforeEach, describe, expect, it, vi } from "vitest";

const single = vi.fn();
const select = vi.fn(() => ({ single }));
const upsert = vi.fn(() => ({ select }));
const from = vi.fn(() => ({ upsert }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from },
}));

describe("profile service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("recreates a missing profile while persisting onboarding data", async () => {
    const persistedProfile = {
      user_id: "user-1",
      display_name: "Evelyn Stasio",
      onboarding_completed: true,
    };
    single.mockResolvedValue({ data: persistedProfile, error: null });

    const { updateProfile } = await import("@/services/profileService");
    await expect(updateProfile("user-1", {
      display_name: "Evelyn Stasio",
      onboarding_completed: true,
    })).resolves.toEqual(persistedProfile);

    expect(from).toHaveBeenCalledWith("profiles");
    expect(upsert).toHaveBeenCalledWith({
      user_id: "user-1",
      display_name: "Evelyn Stasio",
      onboarding_completed: true,
    }, { onConflict: "user_id" });
    expect(select).toHaveBeenCalledWith("*");
    expect(single).toHaveBeenCalledOnce();
  });

  it("does not report success when the profile cannot be persisted", async () => {
    const persistenceError = new Error("profile persistence failed");
    single.mockResolvedValue({ data: null, error: persistenceError });

    const { updateProfile } = await import("@/services/profileService");
    await expect(updateProfile("user-1", { onboarding_completed: true }))
      .rejects.toThrow("profile persistence failed");
  });
});
