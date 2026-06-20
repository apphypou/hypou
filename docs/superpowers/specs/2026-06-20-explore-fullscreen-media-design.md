# Explore Full-Screen Media Design

## Goal

Make the Explore swipe experience visually match the supplied reference: media fills the entire viewport behind the bottom navigation, glass overlays are lighter and more compact, and item value appears beside the item name. Images must remain fully visible without crop-like zoom.

## Scope

- Explore feed layout only.
- Compact swipe-card presentation and its media rendering.
- Existing expanded details, swipe gestures, share, filters, video readiness, proposals, and navigation behavior remain intact.
- Empty, loading, and filter-sheet states retain their current behavior.

## Viewport Composition

The active and standby swipe cards occupy the full available `100dvh` Explore viewport. The main Explore area no longer reserves bottom padding for the fixed navigation. The navigation remains fixed above the card with its existing safe-area offset and interaction priority, so the media is visible behind it without the card intercepting navbar taps.

The compact information and action controls sit above the navigation using a safe-area-aware bottom offset. The card has no visible lower gap or rounded cutoff that would expose the page background.

## Image Rendering

The primary image uses `object-contain` so the complete source image remains visible and is never cropped by `object-cover`. To keep the viewport visually filled when source and screen aspect ratios differ, a second copy of the same image fills the background with `object-cover`, blur, mild scale, and a dark translucent treatment. The sharp contained image is layered above it.

Video behavior remains `object-cover` unless a separate video-fit requirement is requested. Existing poster and first-frame readiness logic remains unchanged to prevent the initial green frame.

## Glass Overlays

Top and bottom edge overlays remain gradient-based and clipped inside the card, but become shorter and lighter:

- Reduce overlay height so the fade ends closer to the controls.
- Reduce backdrop blur and black opacity.
- Keep a gradual transparent mask with no hard edge.
- Keep enough contrast for status-area controls, title, tags, actions, and navigation.

The expanded-details overlay keeps its stronger treatment because it supports scrollable text rather than the compact media-first view.

## Compact Item Information

The item name and formatted market value share one row:

- Name occupies remaining width, truncates to one line, and never pushes the value off-screen.
- Value remains fully visible at the right and does not shrink.
- A subtle divider remains below the row, followed by category, condition, and compact location tags.
- Swipe action buttons remain centered below the metadata and above the navbar.

## Interaction And Layering

- Navbar remains above card content in stacking order and receives taps normally.
- Swipe drag and image-gallery tap zones remain below explicit buttons and navigation.
- Share, filters, owner profile, expand, like, and dislike controls retain their handlers.
- Filter sheets continue to hide the navbar.

## Responsive Behavior

Safe-area variables control top and bottom placement on Dynamic Island, notched, and home-indicator devices. The title/value row must fit narrow iPhone widths. On wider screens the content remains constrained by existing horizontal padding rather than stretching typography.

## Verification

- Add layout regression assertions for full-height Explore composition, media layering, compact glass dimensions, and title/value row behavior.
- Run the focused visual-layout tests, complete unit suite, lint, and mobile production build with Node 22.
- Build and launch the static iOS Simulator package.
- Visually verify portrait, square, and landscape item images: full source visible, no crop zoom, no hard overlay edges, navbar tappable, and price never clipped.
