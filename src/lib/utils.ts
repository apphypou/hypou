import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatValue = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

export const CONDITION_MAP: Record<string, string> = {
  used: "Usado",
  USED: "Usado",
  new: "Novo",
  NEW: "Novo",
  like_new: "Semi-novo",
  LIKE_NEW: "Semi-novo",
  "semi-novo": "Semi-novo",
  "Semi-novo": "Semi-novo",
};

export const translateCondition = (raw: string | null | undefined) => {
  if (!raw) return null;
  return CONDITION_MAP[raw] || raw;
};
