# Explore Full-Screen And Proposal Keyboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Explore media full-screen without cropping images, reduce its glass overlays, place price beside title, and keep the cash proposal flow fully visible above the iOS keyboard and bottom navigation.

**Architecture:** Keep the current `SwipeCard`, `SelectItemDialog`, and native keyboard-height pipeline. Change only their composition and stacking: layered contained media inside the full-height card, safe-area-aware compact metadata, a keyboard-aware scrollable proposal drawer, and modal-first navigation z-order.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Vaul Drawer, Framer Motion, Capacitor Keyboard, Vitest, Vite, iOS Simulator, Node 22.

---

## File Map

- Modify `src/components/SwipeCard.tsx`: render contained foreground images over a blurred fill layer; remove the visible card cutoff; align title and price.
- Modify `src/components/SwipeCard/SwipeOverlays.tsx`: remove lower corner clipping from swipe feedback overlays.
- Modify `src/pages/Explorar.tsx`: let the swipe stack fill the viewport and hide navigation during proposal/filter overlays.
- Modify `src/index.css`: reduce compact glass strength and make the proposal drawer keyboard-aware.
- Modify `src/components/SelectItemDialog.tsx`: identify the drawer, make it scrollable, and reveal the cash field on focus.
- Modify `src/components/BottomNav.tsx`: place navigation below modal portal layers.
- Modify `src/pages/MeuPerfil.tsx`: hide navigation while its shared proposal drawer is open.
- Modify `src/test/visualLayout.test.ts`: add source-level layout regressions following the existing visual test pattern.

### Task 1: Lock The Full-Screen Explore Contract With Failing Tests

**Files:**
- Modify: `src/test/visualLayout.test.ts`

- [ ] **Step 1: Replace the obsolete compact-card assertions and add the new visual contract**

```ts
it("fills Explore behind the navbar and hides navigation during overlays", () => {
  const source = readSource("src/pages/Explorar.tsx");

  expect(source).toContain("justify-start w-full pt-0 z-10 min-h-0");
  expect(source).not.toContain("justify-start w-full pb-28 pt-0 z-10");
  expect(source).toContain("{!filtersOpen && !showSelectItem && <BottomNav");
});

it("shows complete Explore images over a blurred viewport fill", () => {
  const source = readSource("src/components/SwipeCard.tsx");

  expect(source).toContain('className="absolute inset-0 h-full w-full object-cover scale-110 blur-2xl opacity-55"');
  expect(source).toContain('className="relative z-10 h-full w-full object-contain"');
  expect(source).not.toContain('className="w-full h-full object-cover object-center"');
});

it("places Explore price beside its truncating item title", () => {
  const source = readSource("src/components/SwipeCard.tsx");

  expect(source).toContain("flex min-w-0 items-end gap-3 border-b");
  expect(source).toContain("min-w-0 flex-1 truncate");
  expect(source).toContain("shrink-0 text-white");
});

it("uses lighter compact glass at both Explore edges", () => {
  const card = readSource("src/components/SwipeCard.tsx");
  const source = readSource("src/index.css");

  expect(card).toContain("swipe-edge-glass-bottom-compact");
  expect(source).toContain("height: min(16%, 130px);");
  expect(source).toContain("backdrop-filter: blur(8px) saturate(110%);");
  expect(source).toContain("rgba(9, 14, 22, 0.38)");
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm test -- src/test/visualLayout.test.ts
```

Expected: FAIL because the current page reserves `pb-28`, images use only `object-cover`, price is on a separate row, and glass remains at `22%`/`14px` blur.

- [ ] **Step 3: Commit the failing contract**

```bash
git add src/test/visualLayout.test.ts
git commit -m "test: define full-screen Explore layout"
```

### Task 2: Implement Full-Screen Media, Reduced Glass, And Inline Price

**Files:**
- Modify: `src/pages/Explorar.tsx:305-444`
- Modify: `src/components/SwipeCard.tsx:292-670`
- Modify: `src/components/SwipeCard/SwipeOverlays.tsx:1-70`
- Modify: `src/index.css:199-275`
- Test: `src/test/visualLayout.test.ts`

- [ ] **Step 1: Remove the navbar reservation from the active Explore feed**

Change the main feed class to:

```tsx
<main
  className="relative flex-1 flex flex-col items-center justify-start w-full pt-0 z-10 min-h-0"
  style={{ perspective: "1200px" }}
>
```

Keep empty/loading states padded locally if they need navbar clearance; do not restore global `pb-28` to the active card stack.

- [ ] **Step 2: Remove the card-shaped lower cutoff while preserving swipe transforms**

In `SwipeCard.tsx`, set the motion container radius to zero and replace the inner rounded card with a viewport-clipping layer:

```tsx
style={{
  // existing motion values remain unchanged
  borderRadius: 0,
}}

<div className="absolute inset-0 overflow-hidden z-[1]">
```

Delete the outer blurred reflection-border blocks at the start of the card. They create a visible card boundary and are redundant with the new media background layer.

In `SwipeOverlays.tsx`, replace each `rounded-t-none rounded-b-[1.5rem]` occurrence with no radius utility so swipe feedback reaches the same viewport edges.

- [ ] **Step 3: Render non-cropped images over a blurred fill layer**

Replace the image-slide branch with:

```tsx
<div className="absolute inset-0 overflow-hidden bg-black">
  <img
    src={cdnBlur(currentImage)}
    alt=""
    aria-hidden
    className="absolute inset-0 h-full w-full object-cover scale-110 blur-2xl opacity-55"
    draggable={false}
  />
  <div className="absolute inset-0 bg-black/20" aria-hidden />
  <img
    key={activeImageIndex}
    alt={item.name}
    className="relative z-10 h-full w-full object-contain"
    src={cdnFull(currentImage)}
    draggable={false}
  />
</div>
```

Do not change the video branch, poster readiness callbacks, preload behavior, or green-frame prevention in this task.

- [ ] **Step 4: Put title and price on one responsive row**

Replace the compact title and standalone price blocks with:

```tsx
<div className="flex min-w-0 items-end gap-3 border-b border-white/75 pb-2">
  <h2 className="min-w-0 flex-1 truncate text-white text-[24px] font-bold tracking-tight leading-[1.12] [text-shadow:0_1px_2px_rgba(0,0,0,0.46)]">
    {item.name}
  </h2>
  <span className="shrink-0 text-white text-[19px] font-semibold leading-none tracking-tight [text-shadow:0_1px_2px_rgba(0,0,0,0.46)]">
    {formatValue(item.market_value)}
  </span>
</div>
```

Keep the whole row inside the existing details button so tapping title or price still expands the card. Render tags immediately below it and remove the old separate price/chevron block.

- [ ] **Step 5: Keep compact controls above the overlaid navbar**

Keep the compact info wrapper at the bottom of the viewport, but raise its actual content:

```tsx
<div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-[calc(var(--safe-area-bottom)+5.75rem)] pointer-events-none">
```

This leaves media and gradient behind the navbar while ensuring metadata and swipe actions are not covered.

- [ ] **Step 6: Reduce glass size and intensity without hard edges**

Update only the compact edge rules in `src/index.css`:

```css
.swipe-edge-glass-top {
  top: 0;
  height: min(16%, 130px);
}

.swipe-edge-glass-top::before,
.swipe-edge-glass-bottom::before {
  backdrop-filter: blur(8px) saturate(110%);
  -webkit-backdrop-filter: blur(8px) saturate(110%);
}
```

Add `swipe-edge-glass-bottom-compact` only to the compact information gradient:

```tsx
className="swipe-edge-glass swipe-edge-glass-bottom swipe-edge-glass-bottom-compact swipe-edge-glass-fill z-0"
```

Use these compact overrides while preserving the existing transparent masks:

```css
.swipe-edge-glass-top::before {
  background:
    radial-gradient(120% 92% at 50% -22%, rgba(0, 0, 0, 0.56) 0%, rgba(0, 0, 0, 0.26) 50%, transparent 100%),
    linear-gradient(to bottom, rgba(9, 14, 22, 0.38), rgba(9, 14, 22, 0.16) 52%, transparent);
  backdrop-filter: blur(8px) saturate(110%);
  -webkit-backdrop-filter: blur(8px) saturate(110%);
}

.swipe-edge-glass-top::after {
  opacity: 0.24;
}

.swipe-edge-glass-bottom-compact::before {
  background:
    radial-gradient(120% 92% at 50% 122%, rgba(0, 0, 0, 0.56) 0%, rgba(0, 0, 0, 0.26) 50%, transparent 100%),
    linear-gradient(to top, rgba(9, 14, 22, 0.38), rgba(9, 14, 22, 0.16) 52%, transparent);
  backdrop-filter: blur(8px) saturate(110%);
  -webkit-backdrop-filter: blur(8px) saturate(110%);
}

.swipe-edge-glass-bottom-compact::after {
  opacity: 0.24;
}
```

Do not weaken the base `.swipe-edge-glass-bottom` rules used by `.swipe-edge-glass-bottom-expanded`; expanded details keep the current stronger glass.

- [ ] **Step 7: Run focused tests and verify GREEN**

Run:

```bash
PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm test -- src/test/visualLayout.test.ts
```

Expected: all visual-layout tests PASS.

- [ ] **Step 8: Commit the Explore implementation**

```bash
git add src/pages/Explorar.tsx src/components/SwipeCard.tsx src/components/SwipeCard/SwipeOverlays.tsx src/index.css src/test/visualLayout.test.ts
git commit -m "feat: make Explore media full screen"
```

### Task 3: Lock Proposal Keyboard And Navbar Behavior With Failing Tests

**Files:**
- Modify: `src/test/visualLayout.test.ts`

- [ ] **Step 1: Add proposal layout regression tests**

```ts
it("keeps the proposal drawer above the native keyboard", () => {
  const dialog = readSource("src/components/SelectItemDialog.tsx");
  const css = readSource("src/index.css");

  expect(dialog).toContain("proposal-drawer");
  expect(dialog).toContain("overflow-y-auto");
  expect(dialog).toContain("cashInputRef");
  expect(dialog).toContain('scrollIntoView({ block: "center", behavior: "smooth" })');
  expect(dialog).toContain("window.setTimeout");
  expect(css).toContain("body.keyboard-visible .proposal-drawer");
  expect(css).toContain("bottom: var(--keyboard-height, 0px);");
  expect(css).toContain("100dvh - var(--keyboard-height, 0px) - var(--safe-area-top)");
});

it("keeps bottom navigation below modals and absent during proposals", () => {
  const nav = readSource("src/components/BottomNav.tsx");
  const explore = readSource("src/pages/Explorar.tsx");
  const profile = readSource("src/pages/MeuPerfil.tsx");

  expect(nav).toContain("zIndex: 40");
  expect(explore).toContain("{!filtersOpen && !showSelectItem && <BottomNav");
  expect(profile).toContain("{!proposalTarget && <BottomNav activeTab=\"perfil\" />}");
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm test -- src/test/visualLayout.test.ts
```

Expected: FAIL because the drawer ignores `--keyboard-height`, has no focus reveal behavior, navbar uses z-index 1000, and proposal parents always render it.

- [ ] **Step 3: Commit the failing contract**

```bash
git add src/test/visualLayout.test.ts
git commit -m "test: define keyboard-safe proposal layout"
```

### Task 4: Make The Proposal Drawer Keyboard-Safe And Modal-First

**Files:**
- Modify: `src/components/SelectItemDialog.tsx:1-318`
- Modify: `src/index.css`
- Modify: `src/components/BottomNav.tsx:27-47`
- Modify: `src/pages/Explorar.tsx:444`
- Modify: `src/pages/MeuPerfil.tsx:381-392`
- Test: `src/test/visualLayout.test.ts`

- [ ] **Step 1: Add a cash-input ref and deterministic focus reveal**

Change the React import and add the ref:

```tsx
import { useEffect, useRef, useState } from "react";

const cashInputRef = useRef<HTMLInputElement>(null);

const revealCashInput = () => {
  window.setTimeout(() => {
    cashInputRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, 250);
};
```

Attach it to the monetary input:

```tsx
<input
  ref={cashInputRef}
  inputMode="numeric"
  onFocus={revealCashInput}
  value={cashInput}
  onChange={(event) => handleCashChange(event.target.value)}
  placeholder="R$ 0,00"
  className="h-11 w-full rounded-xl border border-foreground/10 bg-background px-4 text-sm font-bold text-foreground outline-none focus:border-primary"
/>
```

- [ ] **Step 2: Make the shared drawer a keyboard-aware scroll surface**

Change the drawer content class to:

```tsx
<DrawerContent className="proposal-drawer max-h-[88dvh] overflow-y-auto overscroll-contain">
```

Add the native keyboard rule to `src/index.css`:

```css
.proposal-drawer {
  transition: bottom 180ms ease, max-height 180ms ease;
}

body.keyboard-visible .proposal-drawer {
  bottom: var(--keyboard-height, 0px);
  max-height: calc(100dvh - var(--keyboard-height, 0px) - var(--safe-area-top));
}
```

The existing item list can keep its own scroll boundary when the keyboard is closed; the outer drawer scroll guarantees the cash field and actions are reachable when available height shrinks.

- [ ] **Step 3: Put navigation below all modal portals**

In `BottomNav.tsx`, change only the global stacking value:

```tsx
zIndex: 40,
```

Vaul drawers and project sheets use `z-50`, so they now receive visual and pointer priority even if a parent forgets to hide navigation.

- [ ] **Step 4: Hide navigation while proposal composition is active**

In Explore:

```tsx
{!filtersOpen && !showSelectItem && <BottomNav activeTab="explorar" />}
```

In `MeuPerfil.tsx`, replace the normal-state navbar with:

```tsx
{!proposalTarget && <BottomNav activeTab="perfil" />}
```

Do not alter the loading-state navbar because no proposal drawer can be open while profile data is loading. `Shorts.tsx` has no bottom navbar and needs no conditional rendering.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run:

```bash
PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm test -- src/test/visualLayout.test.ts
```

Expected: all visual-layout tests PASS.

- [ ] **Step 6: Commit the proposal fix**

```bash
git add src/components/SelectItemDialog.tsx src/components/BottomNav.tsx src/pages/Explorar.tsx src/pages/MeuPerfil.tsx src/index.css src/test/visualLayout.test.ts
git commit -m "fix: keep proposal controls above iOS keyboard"
```

### Task 5: Regression And iOS Verification

**Files:**
- Verify only; modify implementation files only if a test exposes a scoped regression.

- [ ] **Step 1: Run the complete unit suite**

```bash
PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm test
```

Expected: all test files PASS with no failures.

- [ ] **Step 2: Run lint**

```bash
PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run lint
```

Expected: zero errors. Existing unrelated warnings may remain documented.

- [ ] **Step 3: Build the mobile web bundle**

```bash
PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run build:mobile
```

Expected: Vite production build succeeds.

- [ ] **Step 4: Check the mobile environment before iOS work**

```bash
PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run mobile:doctor
```

Expected: `OK: mobile environment is usable`.

- [ ] **Step 5: Install the release-like build in the simulator**

```bash
PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run ios:sim:static
```

Expected: `BUILD SUCCEEDED` and `app.hypou.mobile` launches.

- [ ] **Step 6: Verify the visual acceptance cases**

In the simulator:

1. Open Explore with portrait, square, and landscape image items.
2. Confirm every sharp image is fully visible, with blurred fill only in unused aspect-ratio space.
3. Confirm media continues behind the navbar and navbar taps still work.
4. Confirm the glass fades have no hard edge and do not over-darken the photo.
5. Confirm long item names truncate while the complete price remains visible on the same row.
6. Like an item, select an offered item, enable cash completion, and focus the numeric input.
7. Type a value and confirm the field and live offer total can be inspected while the keyboard is open.
8. Scroll to `Enviar proposta` without dismissing the keyboard and confirm no navbar covers or intercepts it.

- [ ] **Step 7: Commit any narrowly required verification adjustment**

If verification required a scoped fix, run the affected focused test first, then:

```bash
git add src/components/SwipeCard.tsx src/components/SwipeCard/SwipeOverlays.tsx src/components/SelectItemDialog.tsx src/components/BottomNav.tsx src/pages/Explorar.tsx src/pages/MeuPerfil.tsx src/index.css src/test/visualLayout.test.ts
git commit -m "fix: finalize Explore and proposal mobile layout"
```

If no adjustment was required, do not create an empty commit.
