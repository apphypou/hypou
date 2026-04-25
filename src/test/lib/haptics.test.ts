import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { haptic } from "@/lib/haptics";

describe("haptics", () => {
  let originalVibrate: any;

  beforeEach(() => {
    originalVibrate = (navigator as any).vibrate;
    (navigator as any).vibrate = vi.fn();
  });

  afterEach(() => {
    (navigator as any).vibrate = originalVibrate;
  });

  it("01 chama navigator.vibrate em web (light)", async () => {
    await haptic("light");
    expect((navigator as any).vibrate).toHaveBeenCalledWith(10);
  });

  it("02 vibração média", async () => {
    await haptic("medium");
    expect((navigator as any).vibrate).toHaveBeenCalledWith(20);
  });

  it("03 padrão de sucesso é array", async () => {
    await haptic("success");
    expect((navigator as any).vibrate).toHaveBeenCalledWith([15, 40, 15]);
  });

  it("04 não lança quando vibrate ausente", async () => {
    delete (navigator as any).vibrate;
    await expect(haptic("light")).resolves.toBeUndefined();
  });
});
