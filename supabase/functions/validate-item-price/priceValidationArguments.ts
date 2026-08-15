export type PriceValidation = {
  valid: boolean;
  reason: string;
  suggested_min_cents: number;
  suggested_max_cents: number;
};

const isNonNegativeFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

export const parsePriceValidationArguments = (rawArguments: unknown): PriceValidation | null => {
  let value = rawArguments;
  if (typeof rawArguments === "string") {
    try {
      value = JSON.parse(rawArguments.trim());
    } catch {
      const start = rawArguments.indexOf("{");
      const end = rawArguments.lastIndexOf("}");
      if (start === -1 || end <= start) return null;
      try {
        value = JSON.parse(rawArguments.slice(start, end + 1));
      } catch {
        return null;
      }
    }
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.valid !== "boolean" ||
    typeof candidate.reason !== "string" ||
    !isNonNegativeFiniteNumber(candidate.suggested_min_cents) ||
    !isNonNegativeFiniteNumber(candidate.suggested_max_cents)
  ) {
    return null;
  }

  return {
    valid: candidate.valid,
    reason: candidate.reason,
    suggested_min_cents: candidate.suggested_min_cents,
    suggested_max_cents: candidate.suggested_max_cents,
  };
};
