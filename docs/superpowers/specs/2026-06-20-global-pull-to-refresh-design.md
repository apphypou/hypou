# Global Pull-to-Refresh Design

## Goal

Add a native-feeling pull-to-refresh gesture to the Hypou content screens. Pulling down from the top of a screen reveals a loading indicator and refreshes the screen data without reloading the Capacitor WebView.

The Explore screen must keep the currently visible card selected while its data is refreshed.

## Scope

The gesture applies to authenticated content screens that use `ScreenLayout`, including Explore, Trades, Chat, Profile, Search, user profiles, settings, and static information screens where refresh is harmless.

The gesture is disabled while the user is in:

- login, signup, onboarding, and authentication callback screens;
- item creation and editing forms;
- calls;
- an open modal, drawer, or dialog;
- a focused input, textarea, select, or content-editable field;
- any state where the software keyboard is visible.

These exclusions avoid accidental refreshes during data entry and prevent conflicts with vertical sheets and call controls.

## Chosen Approach

Implement one gesture controller in `ScreenLayout`, with an opt-out property for excluded screens and an optional screen-specific refresh callback.

This approach is preferred over adding independent wrappers to every page because it gives all content screens the same threshold, animation, exclusions, and query behavior. It is preferred over `window.location.reload()` because a WebView reload would reset navigation, transient UI state, media playback, and the current Explore card.

The existing Chat-only `PullToRefresh` wrapper will be removed or reduced to shared gesture logic so that Chat does not register two competing pull gestures.

## Gesture Behavior

The controller starts tracking only when the active scroll container is already at its top. It records both horizontal and vertical movement and commits to refresh only after downward movement is dominant.

Rules:

- downward distance must be positive;
- vertical distance must be at least 1.25 times the horizontal distance;
- horizontal card swipes remain owned by `SwipeCard`;
- pull movement has resistance and is capped visually;
- refresh starts after an 80 px effective threshold;
- releasing below the threshold returns the indicator to rest without refreshing;
- only one refresh can run at a time.

The gesture listener must not interfere with normal scrolling or call `preventDefault` before it has established a valid vertical pull.

## Visual Behavior

A single `Loader2` indicator appears below the iOS safe-area/status bar. It follows the pull with opacity and scale interpolation, then spins while refresh is running.

The indicator is an overlay and does not permanently move or resize the page. During the active pull, the screen content can move down slightly with resistance to make the gesture visible. The animation returns smoothly after completion or cancellation.

The visual style uses the existing primary color and remains readable over the full-screen Explore media.

## Refresh Data Flow

`ScreenLayout` exposes:

- `refreshable`, enabled by default for authenticated content screens;
- `onRefresh`, optional for screens that need custom preservation or targeted queries.

When no callback is supplied, the global handler invalidates active React Query queries and waits for their active refetches. This refreshes server-backed data without discarding local navigation state.

Screens with special state provide `onRefresh`:

- Chat refreshes the conversations query through the global controller, replacing its current local wrapper.
- Explore records the current listing ID before refreshing. After the refreshed result is available, it resolves the new index by that ID. If the listing still exists, it remains selected. If it was removed, Explore selects the nearest valid card instead of resetting to the first card.

Refresh failures keep the current screen and data intact. The indicator stops in a `finally` path. Existing query error handling remains responsible for user-facing errors; pull-to-refresh does not show a duplicate toast.

## Scroll Container Detection

The controller finds the nearest vertically scrollable ancestor of the touch target inside the screen. A pull may start only when that container has `scrollTop <= 0`. If no nested scroll container exists, the screen root is used.

This supports pages whose scrolling element is below `ScreenLayout` while avoiding page-specific gesture code.

## Modal And Input Exclusions

The controller rejects a gesture when the touch starts inside an interactive editing element or inside an element marked as a modal, dialog, drawer, or pull-to-refresh exclusion zone.

Open overlays also expose a document-level state or selector that disables the root gesture even when the touch begins on their backdrop. The implementation will reuse existing dialog semantics where possible and add a small `data-pull-refresh-disabled` marker only where needed.

## Components And Boundaries

- `ScreenLayout`: owns feature enablement and renders the global indicator.
- shared pull gesture hook/controller: owns touch tracking, direction locking, threshold, exclusions, and refresh lifecycle.
- page callbacks: own page-specific data preservation, such as the Explore card ID.
- React Query: owns cache invalidation and network refetching.

The gesture logic is kept outside page components so it can be tested independently and changed without modifying every screen.

## Testing

Automated tests cover:

- no refresh below the threshold;
- one refresh above the threshold;
- horizontal movement does not refresh;
- a nested scroll container must be at the top;
- inputs, keyboard-visible state, dialogs, drawers, calls, auth, onboarding, and forms are excluded;
- concurrent pulls do not start concurrent refreshes;
- refresh errors always reset the indicator;
- Chat has only one pull-to-refresh controller;
- Explore retains the current card by listing ID after refreshed data is reordered;
- Explore falls back to the nearest valid card when the current listing disappears.

Manual iOS Simulator verification covers Explore horizontal swipes, full-screen media, pull animation below the Dynamic Island, Chat scrolling, profile/settings scrolling, an open Explore filter drawer, and a proposal form with the keyboard visible.

## Acceptance Criteria

- Pulling down from the top of any eligible content screen reveals the loading indicator and refreshes current data.
- Horizontal swipes in Explore remain responsive and never trigger refresh.
- Explore keeps the current card after refresh whenever that listing still exists.
- Forms, calls, authentication, onboarding, open overlays, and keyboard interactions never trigger refresh.
- The indicator never remains stuck after success or failure.
- Existing navigation and media state are not reset by a WebView reload.
