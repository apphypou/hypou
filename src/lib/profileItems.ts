export type ProfileItemTradeState = {
  id: string;
  status?: string | null;
};

export function isTradedProfileItem(item: ProfileItemTradeState, completedMatchItemIds: Set<string>) {
  return completedMatchItemIds.has(item.id) || item.status === "traded";
}
