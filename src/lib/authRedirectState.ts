export type AuthRedirectDecision =
  | { type: "navigate"; to: string; clearPostLoginRedirect: boolean }
  | { type: "clear" }
  | { type: "none" };

const ENTRY_PATHS = new Set(["/", "/login", "/cadastro"]);

export const getPostLoginRedirectDecision = ({
  event,
  pathname,
  postLoginRedirect,
}: {
  event: string;
  pathname: string;
  postLoginRedirect: string | null;
}): AuthRedirectDecision => {
  if (event !== "SIGNED_IN") return { type: "none" };

  const landedOnEntry = ENTRY_PATHS.has(pathname);

  const safeRedirect = postLoginRedirect?.startsWith("/")
    && !postLoginRedirect.startsWith("//")
    && !postLoginRedirect.includes("\\")
    ? postLoginRedirect
    : null;

  if (safeRedirect) {
    if (landedOnEntry) {
      return {
        type: "navigate",
        to: safeRedirect,
        clearPostLoginRedirect: true,
      };
    }

    return { type: "clear" };
  }

  if (landedOnEntry) {
    return { type: "navigate", to: "/explorar", clearPostLoginRedirect: false };
  }

  return { type: "none" };
};
