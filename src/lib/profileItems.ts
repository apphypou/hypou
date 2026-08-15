export type ProfileItemTradeState = {
  id: string;
  status?: string | null;
};

export function isTradedProfileItem(item: ProfileItemTradeState, completedMatchItemIds: Set<string>) {
  return completedMatchItemIds.has(item.id) || item.status === "traded";
}

export function sortProfileItemsByTradeStatus<T extends { is_traded?: boolean }>(items: T[]) {
  return [...items].sort((a, b) => Number(!!a.is_traded) - Number(!!b.is_traded));
}
