type RecordingGesturePoint = {
  startX: number;
  startY: number;
  x: number;
  y: number;
};

export type RecordingGestureIntent = "recording" | "lock" | "cancel";

const LOCK_DISTANCE_PX = 72;
const CANCEL_DISTANCE_PX = 84;

export function getRecordingGestureIntent(point: RecordingGesturePoint): RecordingGestureIntent {
  const deltaX = point.x - point.startX;
  const deltaY = point.y - point.startY;

  if (deltaX <= -CANCEL_DISTANCE_PX && Math.abs(deltaX) > Math.abs(deltaY)) {
    return "cancel";
  }

  if (deltaY <= -LOCK_DISTANCE_PX && Math.abs(deltaY) > Math.abs(deltaX)) {
    return "lock";
  }

  return "recording";
}
