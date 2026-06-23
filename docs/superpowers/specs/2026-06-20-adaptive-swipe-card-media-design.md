# Adaptive Swipe Card Media Design

## Goal

Improve the Explore swipe card media presentation so photos feel full-screen and premium without returning to aggressive zoom/cropping.

The media indicator dots must move out of the unsafe top edge and sit below the Dynamic Island/status area.

## Problem

The current `object-contain` foreground preserves the full item photo, which is important for trust in a marketplace. However, wide or mismatched image ratios create a hard visual break: a large dark/blurred region above the photo makes the card feel unfinished.

Using `object-cover` for every photo would make some cards feel more immersive, but it can crop products, prices, property details, and other inspectable content. That is not acceptable for a trade marketplace.

## Chosen Design

Use an adaptive media fill:

- keep a full-card blurred ambient background using the same image;
- keep the main image visible with `object-contain`;
- apply a very small foreground scale only to reduce visual gaps, not to crop aggressively;
- let the top and bottom glass overlays blend the background into the UI chrome;
- position the foreground media intentionally, not randomly centered into empty space;
- keep videos on the existing cover behavior because videos are already authored as moving full-frame media.

This preserves item accuracy while making the card feel full-screen.

## Media Layout

For image slides:

1. The ambient background fills the entire card with `object-cover`, blur, low opacity, and a subtle dark overlay.
2. The main foreground image sits above it with `object-contain`.
3. The foreground image uses `object-position: center center`.
4. The foreground image gets a subtle scale around `1.025`, enough to soften empty margins while keeping the whole item visible in normal cases.
5. The media area has no visible black bands. Any remaining empty area is the ambient blurred photo plus glass, not a solid block.

For very horizontal images, the card should read as:

- ambient photo fills behind the header;
- actual photo starts visually below the chrome but still belongs to the same continuous card;
- title and actions remain readable over bottom glass.

For product photos, the object remains inspectable and centered.

## Media Dots

The slide dots move from the absolute top edge to below the Dynamic Island/status area:

- use `top: calc(var(--safe-area-top) + 2.85rem)`;
- keep centered horizontally;
- use a compact glass capsule;
- do not overlap the notch, time, Wi-Fi, battery, owner pill, share button, or filter button.

## Glass Treatment

The top glass overlay remains subtle and should blend the ambient background into the header. It must not look like a black rectangle.

The bottom compact glass remains focused on legibility behind title, price, tags, and actions. It should not recreate the old heavy shadow block.

## Interaction

The change must not affect:

- horizontal swipe gestures;
- tap zones for previous/next media;
- expanded detail view;
- share and filter buttons;
- pull-to-refresh;
- video readiness behavior.

## Testing

Add source-level tests that verify:

- image slides use an ambient blurred full-card background;
- foreground images use the adaptive contain class, not `object-cover`;
- media dots are offset below the safe area;
- video slides continue using `object-cover`;
- the existing visual layout expectations for title/price and glass still pass.

Manual iOS verification should cover:

- a wide real-estate image;
- a product image;
- a multi-image card with dots;
- horizontal swipe and tap-to-change-image behavior;
- top controls near the Dynamic Island.

## Acceptance Criteria

- No slide dots appear at the unsafe top edge.
- Wide photos no longer create a hard dark band above the image.
- Product photos remain fully inspectable.
- The card still feels full-screen through ambient blur and glass.
- No aggressive zoom/crop returns.
