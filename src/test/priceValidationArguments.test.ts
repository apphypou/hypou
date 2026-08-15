import { describe, expect, it } from "vitest";
import { parsePriceValidationArguments } from "../../supabase/functions/validate-item-price/priceValidationArguments";

const validPriceValidation = {
  valid: true,
  reason: "Preço compatível com o mercado.",
  suggested_min_cents: 1_000,
  suggested_max_cents: 2_000,
};

describe("parsePriceValidationArguments", () => {
  it("accepts the OpenAI-compatible JSON string response", () => {
    expect(parsePriceValidationArguments(JSON.stringify(validPriceValidation))).toEqual(validPriceValidation);
  });

  it("accepts providers that return tool arguments as an object", () => {
    expect(parsePriceValidationArguments(validPriceValidation)).toEqual(validPriceValidation);
  });

  it("extracts a JSON response surrounded by Markdown", () => {
    const content = `Aqui está a avaliação:\n\n\`\`\`json\n${JSON.stringify(validPriceValidation)}\n\`\`\``;
    expect(parsePriceValidationArguments(content)).toEqual(validPriceValidation);
  });

  it("rejects malformed and unsafe tool responses", () => {
    expect(parsePriceValidationArguments("not-json")).toBeNull();
    expect(parsePriceValidationArguments({ ...validPriceValidation, suggested_min_cents: -1 })).toBeNull();
    expect(parsePriceValidationArguments({ ...validPriceValidation, valid: "true" })).toBeNull();
  });
});
