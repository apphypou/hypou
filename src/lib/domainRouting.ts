const adminPath = /^\/admin(?:\/|$)/;

export const isAdminPath = (pathname: string) => adminPath.test(pathname);

export const isMarketingRoute = (_hostname: string, pathname: string) => !isAdminPath(pathname);
