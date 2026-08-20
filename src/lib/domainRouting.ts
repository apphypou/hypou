const marketingHosts = new Set(["hypou.app", "www.hypou.app"]);
const adminPath = /^\/admin(?:\/|$)/;

export const isAdminPath = (pathname: string) => adminPath.test(pathname);

export const isMarketingRoute = (hostname: string, pathname: string) => (
  marketingHosts.has(hostname) && !isAdminPath(pathname)
);
