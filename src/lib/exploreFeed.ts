export function shouldRecycleExploreFeed(
  itemCount: number,
  visibleItemCount: number,
  isLoading: boolean,
) {
  return !isLoading && itemCount > 0 && visibleItemCount === 0;
}
