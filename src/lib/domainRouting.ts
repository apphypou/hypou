const marketingHosts = new Set(["hypou.app", "www.hypou.app"]);
const appPaths = /^\/(?:admin|login|cadastro|confirmar-codigo|recuperar-senha|reset-password)(?:\/|$)/;

export const isMarketingRoute = (hostname: string, pathname: string) => (
  marketingHosts.has(hostname) && !appPaths.test(pathname)
);
