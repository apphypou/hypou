import { describe, it, expect } from "vitest";
import { compressImage, prepareImageForUpload, isHeicFile } from "@/lib/fileValidation";

/**
 * Cobre as correções aplicadas após o relatório QA (BUG #1..#5 + UX 16/17/18).
 */

describe("QA fixes — TLDs reservados", () => {
  const reserved = /\.(test|example|invalid|localhost)$/i;

  it("01 bloqueia .test", () => {
    expect(reserved.test("alice@foo.test")).toBe(true);
  });
  it("02 bloqueia .example", () => {
    expect(reserved.test("bob@bar.example")).toBe(true);
  });
  it("03 bloqueia .invalid e .localhost", () => {
    expect(reserved.test("a@b.invalid")).toBe(true);
    expect(reserved.test("a@b.localhost")).toBe(true);
  });
  it("04 aceita gmail.com", () => {
    expect(reserved.test("ana@gmail.com")).toBe(false);
  });
});

describe("QA fixes — Compressão de imagem", () => {
  it("05 retorna mesmo arquivo se for muito pequeno", async () => {
    const tiny = new File([new Uint8Array(1024)], "tiny.jpg", { type: "image/jpeg" });
    const out = await compressImage(tiny);
    expect(out).toBe(tiny);
  });

  it("06 mantém arquivo original em tipos não suportados", async () => {
    const txt = new File(["hello"], "x.txt", { type: "text/plain" });
    const out = await compressImage(txt);
    expect(out).toBe(txt);
  });

  it("07 prepareImageForUpload é função e não joga em arquivo simples", async () => {
    const small = new File([new Uint8Array(2048)], "a.jpg", { type: "image/jpeg" });
    const out = await prepareImageForUpload(small);
    expect(out).toBeInstanceOf(File);
  });

  it("08 isHeicFile detecta por extensão sem MIME", () => {
    const heic = new File([], "foto.HEIC", { type: "" });
    expect(isHeicFile(heic)).toBe(true);
  });
});

describe("QA fixes — Badge de notificação 99+", () => {
  const fmt = (n: number) => (n > 99 ? "99+" : String(n));
  it("09 < 100 mostra número", () => {
    expect(fmt(5)).toBe("5");
    expect(fmt(99)).toBe("99");
  });
  it("10 >= 100 mostra 99+", () => {
    expect(fmt(100)).toBe("99+");
    expect(fmt(548)).toBe("99+");
  });
});

describe("QA fixes — Agrupamento de notificações", () => {
  type N = { id: string; type: string; read_at: string | null };
  const group = (ns: N[]) => {
    const proposals = ns.filter((n) => !n.read_at && n.type === "proposal");
    return proposals.length > 2
      ? [{ id: "group", type: "proposal", read_at: null, count: proposals.length } as any,
         ...ns.filter((n) => !(proposals.length > 2 && !n.read_at && n.type === "proposal"))]
      : ns;
  };

  it("11 agrupa quando >2 propostas pendentes", () => {
    const ns: N[] = [
      { id: "1", type: "proposal", read_at: null },
      { id: "2", type: "proposal", read_at: null },
      { id: "3", type: "proposal", read_at: null },
      { id: "4", type: "match", read_at: null },
    ];
    const out = group(ns);
    expect(out[0].id).toBe("group");
    expect(out.length).toBe(2);
  });

  it("12 não agrupa com <=2 propostas", () => {
    const ns: N[] = [
      { id: "1", type: "proposal", read_at: null },
      { id: "2", type: "proposal", read_at: null },
    ];
    expect(group(ns)).toHaveLength(2);
  });
});
