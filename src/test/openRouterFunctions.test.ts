import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const functionSource = (name: string) => readFileSync(
  resolve(process.cwd(), `supabase/functions/${name}/index.ts`),
  "utf8",
);

describe("OpenRouter AI functions", () => {
  const priceValidator = functionSource("validate-item-price");
  const adminChat = functionSource("admin-ai-chat");

  it("uses OpenRouter and the configured Nemotron model", () => {
    for (const source of [priceValidator, adminChat]) {
      expect(source).toContain("https://openrouter.ai/api/v1/chat/completions");
      expect(source).toContain("OPENROUTER_API_KEY");
      expect(source).toContain("nvidia/nemotron-3-ultra-550b-a55b:free");
    }
  });

  it("keeps Tavily as the price research source", () => {
    expect(priceValidator).toContain("TAVILY_API_KEY");
  });

  it("records provider failures without returning provider details to the app", () => {
    expect(priceValidator).toContain("OpenRouter price validation failed");
    expect(priceValidator).toContain("Serviço de sugestão indisponível. Tente novamente em alguns minutos.");
  });

  it("uses the tested parser for the model JSON response", () => {
    expect(priceValidator).toContain("parsePriceValidationArguments(rawArguments)");
    expect(priceValidator).toContain("Responda exclusivamente com um objeto JSON válido");
    expect(priceValidator).toContain("reasoning: { enabled: false }");
  });

  it("uses an authentication method available in the function's Supabase client version", () => {
    expect(priceValidator).toContain("supabase.auth.getUser(token)");
    expect(priceValidator).not.toContain("supabase.auth.getClaims(token)");
  });
});
