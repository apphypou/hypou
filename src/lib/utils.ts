import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatValue = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

const ERROR_MESSAGES: Array<[RegExp, string]> = [
  [/invalid login credentials|invalid credentials/i, "E-mail ou senha incorretos."],
  [/email not confirmed/i, "Confirme seu e-mail para continuar."],
  [/already registered|user already exists|already been registered/i, "Este e-mail já possui uma conta. Faça login."],
  [/rate limit|too many requests|too many attempts/i, "Muitas tentativas. Aguarde alguns instantes e tente novamente."],
  [/not authenticated|unauthorized|missing authorization|jwt expired|invalid jwt/i, "Sua sessão expirou. Entre novamente para continuar."],
  [/forbidden|permission denied|row-level security|notallowederror|user denied/i, "Você não tem permissão para concluir esta ação."],
  [/network request failed|failed to fetch|load failed|networkerror|offline/i, "Não foi possível conectar. Verifique sua internet e tente novamente."],
  [/timeout|timed out/i, "A ação demorou mais que o esperado. Tente novamente."],
  [/not found|does not exist/i, "Não encontramos as informações solicitadas."],
  [/not ready/i, "Aguarde alguns instantes e tente novamente."],
  [/not configured|configuration error|edge function returned a non-2xx/i, "Este recurso está temporariamente indisponível."],
];

const PORTUGUESE_MESSAGE = /[ãõáéíóúç]|\b(não|nao|erro|falha|falhou|tente|selecione|senha|e-mail|email|item|foto|vídeo|video|conversa|chamada|usuário|usuario|permissão|permissao|troca|proposta|conta|câmera|camera|galeria|arquivo|áudio|audio|sessão|sessao|disponível|indisponível)\b/i;

export const getErrorMessage = (error: unknown, fallback = "Não foi possível concluir esta ação. Tente novamente.") => {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const translated = ERROR_MESSAGES.find(([pattern]) => pattern.test(message));

  if (translated) return translated[1];
  if (message && PORTUGUESE_MESSAGE.test(message)) return message;
  return fallback;
};

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
