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
  return Boolean(
    target.closest(
      "input, textarea, select, [contenteditable='true'], [data-pull-refresh-disabled='true']",
    ),
  );
};

export const hasOpenRefreshBlocker = () =>
  document.body.classList.contains("keyboard-visible") ||
  Boolean(document.querySelector("[data-pull-refresh-disabled='true'][data-state='open']"));

export const findRefreshIndex = <T extends { id: string }>(
  items: T[],
  currentId: string | null,
  previousIndex: number,
) => {
  if (items.length === 0) return 0;
  const retainedIndex = currentId ? items.findIndex((item) => item.id === currentId) : -1;
  return retainedIndex >= 0 ? retainedIndex : Math.min(previousIndex, items.length - 1);
};
