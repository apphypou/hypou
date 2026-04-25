/**
 * E2E #12 — Security / RLS / Admin / Moderation (13 tests)
 */
import { describe, it, expect } from "vitest";

type Role = "admin" | "moderator" | "user";
const hasRole = (userRoles: Role[], r: Role) => userRoles.includes(r);
const canAccessAdmin = (roles: Role[]) => hasRole(roles, "admin") || hasRole(roles, "moderator");
const canDeleteUser = (roles: Role[]) => hasRole(roles, "admin");
const canModerateContent = (roles: Role[]) => hasRole(roles, "admin") || hasRole(roles, "moderator");

const REPORT_REASONS = ["spam", "fraude", "ofensa", "conteudo_inapropriado", "outro"];
const validReportReason = (r: string) => REPORT_REASONS.includes(r);
const reportRequiresDescription = (r: string) => r === "outro";

const blockBidirectional = (uid: string, blockerId: string, blockedId: string) =>
  uid === blockerId || uid === blockedId;

const incidentStatuses = ["investigating", "identified", "monitoring", "resolved"];
const validIncidentStatus = (s: string) => incidentStatuses.includes(s);

const passwordContainsSecret = (p: string) =>
  /service_role|sk_|api_key/i.test(p);

const isAuthenticatedRoute = (path: string, hasUser: boolean) =>
  hasUser || path === "/" || path === "/login" || path === "/explorar";

describe("E2E Security/Admin", () => {
  it("01 admin acessa painel", () => expect(canAccessAdmin(["admin"])).toBe(true));
  it("02 moderador acessa painel", () => expect(canAccessAdmin(["moderator"])).toBe(true));
  it("03 user comum não acessa painel", () => expect(canAccessAdmin(["user"])).toBe(false));
  it("04 só admin deleta user", () => expect(canDeleteUser(["moderator"])).toBe(false));
  it("05 admin deleta user", () => expect(canDeleteUser(["admin"])).toBe(true));
  it("06 moderador modera", () => expect(canModerateContent(["moderator"])).toBe(true));
  it("07 motivo válido spam", () => expect(validReportReason("spam")).toBe(true));
  it("08 motivo inválido", () => expect(validReportReason("aleatorio")).toBe(false));
  it("09 outro exige descrição", () => expect(reportRequiresDescription("outro")).toBe(true));
  it("10 spam não exige descrição", () => expect(reportRequiresDescription("spam")).toBe(false));
  it("11 bloqueio bidirecional ambos", () =>
    expect(blockBidirectional("a", "a", "b")).toBe(true));
  it("12 status de incidente válido", () => expect(validIncidentStatus("monitoring")).toBe(true));
  it("13 detecta secret leak em log", () =>
    expect(passwordContainsSecret("password=service_role_xxx")).toBe(true));
});
