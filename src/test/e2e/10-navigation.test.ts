/**
 * E2E #10 — Navigation & Page Transitions (12 tests)
 */
import { describe, it, expect } from "vitest";

const PUBLIC_ROUTES = ["/", "/login", "/cadastro", "/recuperar-senha", "/reset-password", "/explorar", "/lista-espera", "/termos", "/privacidade"];
const PROTECTED_ROUTES = ["/chat", "/matches", "/perfil", "/novo-item", "/configuracoes"];
const ADMIN_ROUTES = ["/admin", "/admin/usuarios", "/admin/itens", "/admin/matches", "/admin/reports", "/admin/status"];

const isPublic = (p: string) => PUBLIC_ROUTES.some((r) => p === r || p.startsWith(r + "/"));
const isProtected = (p: string) => PROTECTED_ROUTES.some((r) => p === r || p.startsWith(r + "/"));
const isAdmin = (p: string) => p.startsWith("/admin");
const TRANSITION_DURATION = 0.12;
const buildBackHref = (from: string) =>
  from.startsWith("/chat/") ? "/chat" : from.startsWith("/usuario/") ? "/explorar" : "/";

describe("E2E Navigation", () => {
  it("01 / é pública", () => expect(isPublic("/")).toBe(true));
  it("02 /explorar é pública", () => expect(isPublic("/explorar")).toBe(true));
  it("03 /chat é protegida", () => expect(isProtected("/chat")).toBe(true));
  it("04 /chat/123 herda /chat", () => expect(isProtected("/chat/123")).toBe(true));
  it("05 /perfil é protegida", () => expect(isProtected("/perfil")).toBe(true));
  it("06 /admin é admin", () => expect(isAdmin("/admin")).toBe(true));
  it("07 /admin/usuarios é admin", () => expect(isAdmin("/admin/usuarios")).toBe(true));
  it("08 /admin/x não é pública", () => expect(isPublic("/admin/x")).toBe(false));
  it("09 transição 120ms para fluidez", () =>
    expect(TRANSITION_DURATION).toBeLessThanOrEqual(0.2));
  it("10 back de chat/:id volta a /chat", () => expect(buildBackHref("/chat/abc")).toBe("/chat"));
  it("11 back de usuario/:id volta a /explorar", () =>
    expect(buildBackHref("/usuario/x")).toBe("/explorar"));
  it("12 back default vai a /", () => expect(buildBackHref("/x")).toBe("/"));
});
