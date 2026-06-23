# Adaptive Swipe Card Media Implementation Plan

## Goal

Implement the approved adaptive media fill for the Explore swipe card.

## Steps

1. Update visual layout tests so the expected image contract is:
   - ambient full-card background class;
   - foreground contain class;
   - media dots positioned below the safe area;
   - video slides still use object-cover.
2. Add reusable CSS classes for:
   - the media stage;
   - ambient blurred background;
   - foreground inspectable image;
   - media dot placement.
3. Replace the inline Tailwind-only image branch in `SwipeCard.tsx` with the new classes.
4. Move the media dots below the Dynamic Island with `top: calc(var(--safe-area-top) + 2.85rem)`.
5. Run focused visual tests and a mobile build sanity check.

## Verification

- `src/test/visualLayout.test.ts`
- `npm run build`

