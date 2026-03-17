

## Problem

The swipe card uses `object-cover object-center` on images, which crops photos aggressively — especially vertical or oddly-framed photos like the guinea fowl where the subject's head gets cut off.

## Strategy

Use a **blurred background fill + contained image** approach. This is the standard pattern used by Instagram stories, TikTok, and similar apps for handling arbitrary aspect ratios:

1. **Background layer**: Show the same image scaled up and heavily blurred to fill the entire card (already partially done for the border effect)
2. **Foreground layer**: Display the actual image with `object-contain` so it's never cropped, centered within the card

This ensures:
- Portrait photos look great (fill most of the card naturally)
- Landscape photos are fully visible with a matching blurred background filling empty space
- Square photos work perfectly
- No subject gets cut off regardless of format

## Changes in `src/components/SwipeCard.tsx`

**Image display area (~line 299-308)**: Replace the current single `<img>` with a two-layer approach:

```tsx
{/* Blurred fill background */}
<img src={currentImage} className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-80" />
{/* Sharp contained image on top */}
<img src={currentImage} className="relative w-full h-full object-contain z-[1]" />
```

- Keep `object-cover` for the **blurred background** layer
- Use `object-contain` for the **sharp foreground** layer
- Apply same approach to the empty/placeholder state
- Video slides keep `object-cover` (videos are typically recorded in appropriate aspect ratios)

This is a small, targeted change — only the image rendering inside the card gallery area needs modification.

