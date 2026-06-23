export const shouldHideBottomNav = (pathname: string, hasBlockingOverlay: boolean) => {
  if (hasBlockingOverlay) return true;
  return pathname.startsWith("/conversa/") || pathname.startsWith("/item/");
};
