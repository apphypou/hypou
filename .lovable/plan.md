
# Fix: Swipe Card Transition Bug

## Root Cause

The `x` motion value (used for drag position) is **never reset to 0** after a swipe completes. Here's the sequence that causes the bug:

1. User swipes left -- `animate(x, -600)` fires
2. After 200ms, `handleSwipe` runs which calls `advanceCard` -- `currentIndex` increments
3. New card mounts via `AnimatePresence` with `key={newItem.id}`
4. BUT `x` is still at `-600` -- the new card inherits this position
5. The glow borders (`likeGlowOpacity`/`dislikeGlowOpacity`) are derived from `x`, so they show the green/red glow on the stuck card

The screenshot shows exactly this: the next card is visible with the green "like" glow border because `x` never returned to 0.

## Fix

### 1. Reset `x` to 0 inside `advanceCard`

Add `x.set(0)` at the beginning of `advanceCard` so the motion value is clean before the next card renders.

### 2. Increase exit delay slightly

Change the `setTimeout` in `performSwipe` from 200ms to 250ms so the exit animation has time to complete before the state change triggers the new card mount.

### 3. Remove `dragConstraints` conflict

`dragConstraints={{ left: 0, right: 0 }}` fights with the drag behavior. Remove it entirely since `dragElastic` already handles the rubber-band feel.

## Technical Changes

**File: `src/pages/Explorar.tsx`**

- In `advanceCard` callback (~line 88): add `x.set(0)` as the first line, and add `x` to the dependency array
- In `performSwipe` (~line 183): change `setTimeout` delay from `200` to `250`
- On the main `motion.div` (~line 380): remove `dragConstraints={{ left: 0, right: 0 }}`
