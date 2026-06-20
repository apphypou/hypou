# Global Pull-to-Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a native-feeling pull-to-refresh gesture to authenticated content screens while preserving the current Explore card and avoiding conflicts with swipes, overlays, forms, calls, and the iOS keyboard.

**Architecture:** Extract pure gesture and card-reconciliation helpers into a focused module, then replace the Chat-only wrapper with one reusable controller rendered by `ScreenLayout`. `ScreenLayout` defaults to refetching active React Query queries, accepts a custom refresh callback, and supports explicit opt-out on sensitive screens. Explore supplies a callback that refetches its feed and restores the selected listing by ID.

**Tech Stack:** React 18, TypeScript, TanStack React Query, Framer Motion, Testing Library, Vitest, Capacitor iOS.

---

## File Map

- Create `src/lib/pullToRefresh.ts`: pure direction, scroll-container, exclusion, and Explore index reconciliation helpers.
- Create `src/test/pullToRefresh.test.ts`: unit coverage for gesture decisions and card preservation.
- Modify `src/components/PullToRefresh.tsx`: convert the existing Chat wrapper into the reusable gesture controller and visual indicator.
- Modify `src/components/ScreenLayout.tsx`: render the controller globally, default to active-query refetch, and expose `refreshable`/`onRefresh`.
- Modify `src/test/components/ScreenLayout.test.tsx`: component-level refresh lifecycle, exclusion, and error-reset tests.
- Modify `src/pages/Chat.tsx`: remove its nested controller and pass its targeted callback to `ScreenLayout`.
- Modify `src/pages/Explorar.tsx`: refetch Explore and reconcile `currentIndex` by listing ID.
- Modify `src/components/ui/dialog.tsx`, `src/components/ui/drawer.tsx`, and `src/components/ui/sheet.tsx`: mark open overlay surfaces as refresh exclusion zones.
- Modify `src/pages/Perfil.tsx`, `src/pages/NovoItem.tsx`, `src/pages/EditarItem.tsx`, and `src/pages/Chamada.tsx`: opt sensitive screens out.
- Modify `src/test/visualLayout.test.ts`: guard global integration and explicit exclusions.

### Task 1: Pure Gesture And Card Reconciliation Helpers

**Files:**
- Create: `src/lib/pullToRefresh.ts`
- Create: `src/test/pullToRefresh.test.ts`

- [ ] **Step 1: Write failing tests for direction locking, exclusions, scroll position, and card reconciliation**

```ts
import { describe, expect, it } from "vitest";
import {
  findRefreshIndex,
  getPullDirection,
  isPullRefreshExcluded,
  isScrollAtTop,
} from "@/lib/pullToRefresh";

describe("pull-to-refresh helpers", () => {
  it("locks only a dominant downward pull", () => {
    expect(getPullDirection(10, 40)).toBe("vertical");
    expect(getPullDirection(40, 10)).toBe("horizontal");
    expect(getPullDirection(0, -20)).toBe("cancelled");
  });

  it("requires the active scroll container to be at the top", () => {
    const node = document.createElement("div");
    Object.defineProperty(node, "scrollTop", { value: 0, configurable: true });
    expect(isScrollAtTop(node)).toBe(true);
    Object.defineProperty(node, "scrollTop", { value: 12, configurable: true });
    expect(isScrollAtTop(node)).toBe(false);
  });

  it("excludes editing controls and marked overlays", () => {
    const input = document.createElement("input");
    const overlay = document.createElement("div");
    overlay.dataset.pullRefreshDisabled = "true";
    const child = document.createElement("span");
    overlay.appendChild(child);
    expect(isPullRefreshExcluded(input)).toBe(true);
    expect(isPullRefreshExcluded(child)).toBe(true);
  });

  it("keeps the same listing after feed reorder", () => {
    expect(findRefreshIndex([{ id: "c" }, { id: "a" }], "a", 0)).toBe(1);
  });

  it("uses the nearest valid index when the listing disappears", () => {
    expect(findRefreshIndex([{ id: "a" }, { id: "b" }], "missing", 4)).toBe(1);
    expect(findRefreshIndex([], "missing", 4)).toBe(0);
  });
});
```

- [ ] **Step 2: Run the focused test and verify it fails because the module does not exist**

Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npx vitest run src/test/pullToRefresh.test.ts`

Expected: FAIL resolving `@/lib/pullToRefresh`.

- [ ] **Step 3: Implement the pure helpers**

```ts
export const PULL_THRESHOLD = 80;
export const VERTICAL_DIRECTION_RATIO = 1.25;

export type PullDirection = "pending" | "vertical" | "horizontal" | "cancelled";

export const getPullDirection = (deltaX: number, deltaY: number): PullDirection => {
  if (deltaY <= 0) return "cancelled";
  if (Math.abs(deltaY) >= Math.abs(deltaX) * VERTICAL_DIRECTION_RATIO) return "vertical";
  if (Math.abs(deltaX) >= Math.abs(deltaY)) return "horizontal";
  return "pending";
};

export const isScrollAtTop = (element: HTMLElement | null) => !element || element.scrollTop <= 0;

export const findScrollableAncestor = (target: EventTarget | null, root: HTMLElement | null) => {
  let node = target instanceof HTMLElement ? target : null;
  while (node && node !== root) {
    const style = window.getComputedStyle(node);
    if (/auto|scroll/.test(style.overflowY) && node.scrollHeight > node.clientHeight) return node;
    node = node.parentElement;
  }
  return root;
};

export const isPullRefreshExcluded = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest("input, textarea, select, [contenteditable='true'], [data-pull-refresh-disabled='true']"));
};

export const hasOpenRefreshBlocker = () =>
  document.body.classList.contains("keyboard-visible") ||
  Boolean(document.querySelector("[data-pull-refresh-disabled='true'][data-state='open']"));

export const findRefreshIndex = <T extends { id: string }>(items: T[], currentId: string | null, previousIndex: number) => {
  if (items.length === 0) return 0;
  const retainedIndex = currentId ? items.findIndex((item) => item.id === currentId) : -1;
  return retainedIndex >= 0 ? retainedIndex : Math.min(previousIndex, items.length - 1);
};
```

- [ ] **Step 4: Run the focused test and verify all helper cases pass**

Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npx vitest run src/test/pullToRefresh.test.ts`

Expected: PASS, 5 tests.

- [ ] **Step 5: Commit the helper and tests**

```bash
git add src/lib/pullToRefresh.ts src/test/pullToRefresh.test.ts
git commit -m "Add pull-to-refresh gesture helpers"
```

### Task 2: Global Controller In ScreenLayout

**Files:**
- Modify: `src/components/PullToRefresh.tsx`
- Modify: `src/components/ScreenLayout.tsx`
- Modify: `src/test/components/ScreenLayout.test.tsx`

- [ ] **Step 1: Add failing ScreenLayout interaction tests**

Add QueryClient test wrapping and cover a dominant pull above threshold, a horizontal swipe, `refreshable={false}`, an input target, one refresh at a time, and rejected refresh cleanup. The primary interaction is:

```tsx
const onRefresh = vi.fn().mockResolvedValue(undefined);
const { getByTestId } = renderScreen(<ScreenLayout onRefresh={onRefresh}>x</ScreenLayout>);
const root = getByTestId("pull-to-refresh-root");
fireEvent.touchStart(root, { touches: [{ clientX: 20, clientY: 20 }] });
fireEvent.touchMove(root, { touches: [{ clientX: 24, clientY: 220 }] });
fireEvent.touchEnd(root);
await waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(1));
```

- [ ] **Step 2: Run ScreenLayout tests and verify the new behavior fails**

Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npx vitest run src/test/components/ScreenLayout.test.tsx`

Expected: FAIL because `ScreenLayout` has no refresh props/controller.

- [ ] **Step 3: Refactor PullToRefresh into a non-scrolling gesture controller**

Use this contract:

```ts
interface PullToRefreshProps {
  enabled: boolean;
  onRefresh: () => Promise<unknown>;
  children: ReactNode;
  className?: string;
}
```

The root gets `data-testid="pull-to-refresh-root"`; the indicator gets `data-testid="pull-to-refresh-indicator"` and `data-refreshing={refreshing}`. Track start X/Y, direction, and active scroll container. Reject excluded targets, open blockers, or non-top containers. Lock direction with `getPullDirection`, apply resistant motion only to vertical pulls, invoke refresh once above `PULL_THRESHOLD`, swallow the callback rejection locally, and clear all state in `finally`.

Render a full-height motion container without forcing `overflow-y-auto`; existing pages retain scrolling ownership.

- [ ] **Step 4: Integrate the controller into ScreenLayout**

```tsx
interface ScreenLayoutProps {
  children: ReactNode;
  className?: string;
  edgeToEdgeTop?: boolean;
  refreshable?: boolean;
  onRefresh?: () => Promise<unknown>;
}

const queryClient = useQueryClient();
const refreshActiveQueries = useCallback(
  () => queryClient.refetchQueries({ type: "active" }),
  [queryClient],
);
```

Default `refreshable` to `true`, wrap the existing screen root in `PullToRefresh`, and place the indicator at `top: var(--safe-area-top)` with `pointer-events-none`.

- [ ] **Step 5: Run ScreenLayout and helper tests**

Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npx vitest run src/test/components/ScreenLayout.test.tsx src/test/pullToRefresh.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit the global controller**

```bash
git add src/components/PullToRefresh.tsx src/components/ScreenLayout.tsx src/test/components/ScreenLayout.test.tsx
git commit -m "Add global pull-to-refresh controller"
```

### Task 3: Overlay And Sensitive-Screen Exclusions

**Files:**
- Modify: `src/components/ui/dialog.tsx`
- Modify: `src/components/ui/drawer.tsx`
- Modify: `src/components/ui/sheet.tsx`
- Modify: `src/pages/Perfil.tsx`
- Modify: `src/pages/NovoItem.tsx`
- Modify: `src/pages/EditarItem.tsx`
- Modify: `src/pages/Chamada.tsx`
- Modify: `src/test/visualLayout.test.ts`

- [ ] **Step 1: Add a failing source-contract test**

```ts
it("marks overlays and sensitive screens as pull-refresh exclusions", () => {
  for (const overlay of ["dialog", "drawer", "sheet"]) {
    expect(readSource(`src/components/ui/${overlay}.tsx`)).toContain('data-pull-refresh-disabled="true"');
  }
  for (const page of ["Perfil", "NovoItem", "EditarItem", "Chamada"]) {
    expect(readSource(`src/pages/${page}.tsx`)).toContain("refreshable={false}");
  }
});
```

- [ ] **Step 2: Run the visual layout test and verify it fails**

Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npx vitest run src/test/visualLayout.test.ts`

Expected: FAIL because overlay markers and opt-outs are absent.

- [ ] **Step 3: Mark shared overlay surfaces**

Add `data-pull-refresh-disabled="true"` to each Radix/Vaul overlay and content element in `dialog.tsx`, `drawer.tsx`, and `sheet.tsx`. Preserve all existing class names and caller props.

- [ ] **Step 4: Disable refresh on sensitive pages**

Change roots to `<ScreenLayout refreshable={false}>` in onboarding (`Perfil`), item creation/editing, and active calls. Public authentication pages do not use the authenticated shared layout and receive no controller.

- [ ] **Step 5: Run visual and ScreenLayout tests**

Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npx vitest run src/test/visualLayout.test.ts src/test/components/ScreenLayout.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit exclusions**

```bash
git add src/components/ui/dialog.tsx src/components/ui/drawer.tsx src/components/ui/sheet.tsx src/pages/Perfil.tsx src/pages/NovoItem.tsx src/pages/EditarItem.tsx src/pages/Chamada.tsx src/test/visualLayout.test.ts
git commit -m "Disable pull refresh for overlays and forms"
```

### Task 4: Migrate Chat To The Global Controller

**Files:**
- Modify: `src/pages/Chat.tsx`
- Modify: `src/test/visualLayout.test.ts`

- [ ] **Step 1: Add a failing source-contract test**

```ts
it("uses only the global pull-to-refresh controller in Chat", () => {
  const source = readSource("src/pages/Chat.tsx");
  expect(source).not.toContain('import PullToRefresh from "@/components/PullToRefresh"');
  expect(source).toContain("<ScreenLayout onRefresh={handleRefresh}>");
  expect(source).toContain('className="relative flex-1 w-full z-10 pb-28 overflow-y-auto no-scrollbar"');
});
```

- [ ] **Step 2: Run the visual test and verify it fails**

Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npx vitest run src/test/visualLayout.test.ts`

Expected: FAIL because Chat still renders the nested wrapper.

- [ ] **Step 3: Move Chat refresh ownership to ScreenLayout**

Delete the `PullToRefresh` import, pass `onRefresh={handleRefresh}` to `ScreenLayout`, and replace the wrapper with:

```tsx
<div className="relative flex-1 w-full z-10 pb-28 overflow-y-auto no-scrollbar">
  <div className="px-5">...</div>
</div>
```

Change the callback to `queryClient.refetchQueries({ queryKey: ["conversations"], type: "active" })` so completion waits for network work.

- [ ] **Step 4: Run Chat-related and visual tests**

Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npx vitest run src/test/visualLayout.test.ts src/test/chatTrade.test.ts src/test/e2e/05-chat.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit Chat migration**

```bash
git add src/pages/Chat.tsx src/test/visualLayout.test.ts
git commit -m "Use global pull refresh in Chat"
```

### Task 5: Preserve The Current Explore Card

**Files:**
- Modify: `src/pages/Explorar.tsx`
- Modify: `src/test/visualLayout.test.ts`

- [ ] **Step 1: Add a failing source-contract test**

```ts
it("preserves the current Explore card during pull refresh", () => {
  const source = readSource("src/pages/Explorar.tsx");
  expect(source).toContain("const refreshItemIdRef = useRef<string | null>(null)");
  expect(source).toContain("findRefreshIndex");
  expect(source).toContain("<ScreenLayout edgeToEdgeTop onRefresh={handleRefresh}>");
  expect(source).toContain('queryClient.refetchQueries({ queryKey: ["explore-items", user?.id], exact: true })');
});
```

- [ ] **Step 2: Run the visual test and verify the preservation contract fails**

Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npx vitest run src/test/visualLayout.test.ts`

Expected: FAIL because Explore has no custom refresh callback.

- [ ] **Step 3: Add Explore refresh and reconciliation**

```ts
const refreshItemIdRef = useRef<string | null>(null);
const refreshIndexRef = useRef(0);

const handleRefresh = useCallback(async () => {
  refreshItemIdRef.current = currentItem?.id ?? null;
  refreshIndexRef.current = currentIndex;
  await queryClient.refetchQueries({ queryKey: ["explore-items", user?.id], exact: true });
}, [currentIndex, currentItem?.id, queryClient, user?.id]);

useEffect(() => {
  if (refreshItemIdRef.current === null) return;
  setCurrentIndex(findRefreshIndex(filteredItems, refreshItemIdRef.current, refreshIndexRef.current));
  refreshItemIdRef.current = null;
  setEpoch((value) => value + 1);
}, [filteredItems]);
```

Pass `onRefresh={handleRefresh}` to the edge-to-edge `ScreenLayout`. Do not reset filters, swipe history, proposals, or the selected card when its ID remains available.

- [ ] **Step 4: Run helper, Explore, and visual tests**

Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npx vitest run src/test/pullToRefresh.test.ts src/test/visualLayout.test.ts src/test/e2e/03-explore-swipe.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit Explore preservation**

```bash
git add src/pages/Explorar.tsx src/test/visualLayout.test.ts
git commit -m "Preserve Explore card during refresh"
```

### Task 6: Full Verification And iOS Simulator Check

**Files:**
- Modify only if verification reveals a regression in files from Tasks 1-5.

- [ ] **Step 1: Run the complete test suite with Node 22**

Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm test`

Expected: all Vitest files pass.

- [ ] **Step 2: Run lint**

Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run lint`

Expected: exit 0 with no new errors.

- [ ] **Step 3: Run the mobile production build**

Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run build:mobile`

Expected: Vite mobile build succeeds.

- [ ] **Step 4: Run mobile doctor before iOS work**

Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run mobile:doctor`

Expected: Node 22 and required mobile checks pass.

- [ ] **Step 5: Build and launch on the configured simulator**

Call XcodeBuildMCP `session_show_defaults`. If project, scheme, and simulator are configured, call `build_run_sim`. Otherwise discover the project, configure the existing Hypou scheme and latest iPhone simulator, then call `build_run_sim`.

Expected: app builds, installs, and launches.

- [ ] **Step 6: Verify critical gestures manually**

1. On Explore, pull down and verify the spinner appears below the status bar.
2. Confirm the same listing remains selected after refresh.
3. Swipe horizontally and verify no refresh starts.
4. Open Configure Search and verify sheet dragging does not refresh.
5. Open a proposal and keyboard and verify downward movement does not refresh.
6. Open Chat, pull down, and verify one indicator.
7. Open Profile or Settings and verify refresh works only at scroll position zero.

- [ ] **Step 7: Inspect final scope**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors; intended files contain this implementation and unrelated pre-existing dirty files remain untouched.
