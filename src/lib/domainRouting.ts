const marketingHosts = new Set(["hypou.app", "www.hypou.app"]);

export const isMarketingRoute = (hostname: string, pathname: string) => (
  marketingHosts.has(hostname) && !/^\/admin(?:\/|$)/.test(pathname)
);
