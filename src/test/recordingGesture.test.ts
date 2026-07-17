import { describe, expect, it } from "vitest";
import { getRecordingGestureIntent } from "@/lib/recordingGesture";

describe("getRecordingGestureIntent", () => {
  it("locks when dragged upward enough", () => {
    expect(getRecordingGestureIntent({ startX: 100, startY: 500, x: 104, y: 410 })).toBe("lock");
  });

  it("cancels when dragged left enough", () => {
    expect(getRecordingGestureIntent({ startX: 220, startY: 500, x: 120, y: 505 })).toBe("cancel");
  });

  it("continues recording for small movement", () => {
    expect(getRecordingGestureIntent({ startX: 220, startY: 500, x: 212, y: 492 })).toBe("recording");
  });
});
