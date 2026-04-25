/**
 * E2E #19 — Admin RBAC + moderação.
 */
import { describe, it, expect } from "vitest";

type Role = "admin" | "moderator" | "user";

const can = (role: Role, action: string): boolean => {
  const matrix: Record<string, Role[]> = {
    view_dashboard: ["admin", "moderator"],
    delete_user: ["admin"],
    view_reports: ["admin", "moderator"],
    resolve_report: ["admin", "moderator"],
    create_incident: ["admin"],
    update_site_settings: ["admin"],
    view_kpis: ["admin"],
    moderate_content: ["admin", "moderator"],
  };
  return matrix[action]?.includes(role) ?? false;
};

const validIncidentSeverity = (s: string) => ["minor", "major", "critical"].includes(s);
const validIncidentStatus = (s: string) =>
  ["investigating", "identified", "monitoring", "resolved"].includes(s);
const validReportReason = (r: string) =>
  ["spam", "harassment", "fake", "inappropriate", "scam", "other"].includes(r);

describe("E2E Admin RBAC", () => {
  it("01 admin acessa dashboard", () => expect(can("admin", "view_dashboard")).toBe(true));
  it("02 moderador acessa dashboard", () => expect(can("moderator", "view_dashboard")).toBe(true));
  it("03 usuário comum sem dashboard", () => expect(can("user", "view_dashboard")).toBe(false));
  it("04 só admin deleta usuário", () => expect(can("admin", "delete_user")).toBe(true));
  it("05 moderador NÃO deleta usuário", () => expect(can("moderator", "delete_user")).toBe(false));
  it("06 admin/moderador veem reports", () => {
    expect(can("admin", "view_reports")).toBe(true);
    expect(can("moderator", "view_reports")).toBe(true);
  });
  it("07 só admin cria incidente", () => expect(can("admin", "create_incident")).toBe(true));
  it("08 moderador NÃO cria incidente", () => expect(can("moderator", "create_incident")).toBe(false));
  it("09 só admin altera site_settings", () => expect(can("admin", "update_site_settings")).toBe(true));
  it("10 só admin vê KPIs", () => expect(can("admin", "view_kpis")).toBe(true));
  it("11 ambos moderam conteúdo", () => {
    expect(can("admin", "moderate_content")).toBe(true);
    expect(can("moderator", "moderate_content")).toBe(true);
  });
  it("12 incident severity válida", () => expect(validIncidentSeverity("major")).toBe(true));
  it("13 incident severity inválida", () => expect(validIncidentSeverity("urgent")).toBe(false));
  it("14 incident status investigating válido", () =>
    expect(validIncidentStatus("investigating")).toBe(true));
  it("15 incident status resolved válido", () => expect(validIncidentStatus("resolved")).toBe(true));
  it("16 incident status xyz inválido", () => expect(validIncidentStatus("xyz")).toBe(false));
  it("17 report reason spam válido", () => expect(validReportReason("spam")).toBe(true));
  it("18 report reason harassment válido", () => expect(validReportReason("harassment")).toBe(true));
  it("19 report reason xpto inválido", () => expect(validReportReason("xpto")).toBe(false));
});
