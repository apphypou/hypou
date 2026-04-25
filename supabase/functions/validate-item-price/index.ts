import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BodySchema = z.object({
  name: z.string().min(1).max(255),
  category: z.string().min(1).max(100),
  condition: z.string().max(50).optional(),
  value_cents: z.number().int().min(0).max(100_000_000),
  description: z.string().max(2000).optional(),
});

// In-memory rate limiter: 5 requests per minute per user (or IP).
// Reset on cold start; good enough for cost protection on a single edge runtime.
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60_000;
const rateBuckets = new Map<string, number[]>();

function checkRateLimit(key: string): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const bucket = (rateBuckets.get(key) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (bucket.length >= RATE_LIMIT) {
    const retryAfter = Math.ceil((RATE_WINDOW_MS - (now - bucket[0])) / 1000);
    return { ok: false, retryAfter };
  }
  bucket.push(now);
  rateBuckets.set(key, bucket);
  return { ok: true, retryAfter: 0 };
}

async function searchTavily(query: string, extraDomains: string[] = []): Promise<string> {
  const TAVILY_API_KEY = Deno.env.get("TAVILY_API_KEY");
  if (!TAVILY_API_KEY) return "";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const baseDomains = [
      "mercadolivre.com.br", "olx.com.br", "amazon.com.br",
      "magazineluiza.com.br", "americanas.com.br", "zoom.com.br", "buscape.com.br",
    ];

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query,
        search_depth: "basic",
        max_results: 5,
        include_answer: true,
        include_domains: [...baseDomains, ...extraDomains],
      }),
    });

    clearTimeout(timeout);
    if (!response.ok) return "";

    const data = await response.json();
    let summary = "";
    if (data.answer) summary += `Resumo da pesquisa: ${data.answer}\n\n`;
    if (data.results?.length > 0) {
      summary += "Resultados encontrados:\n";
      for (const r of data.results) {
        summary += `- ${r.title} (${r.url}): ${r.content?.substring(0, 300) || ""}\n`;
      }
    }
    return summary;
  } catch {
    return "";
  }
}

async function searchFipe(vehicleName: string): Promise<string> {
  const TAVILY_API_KEY = Deno.env.get("TAVILY_API_KEY");
  if (!TAVILY_API_KEY) return "";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: `tabela FIPE ${vehicleName} preço médio 2024 2025`,
        search_depth: "basic",
        max_results: 5,
        include_answer: true,
        include_domains: ["tabelafipe.org", "fipe.org.br", "veiculos.fipe.org.br", "kbb.com.br", "webmotors.com.br"],
      }),
    });

    clearTimeout(timeout);
    if (!response.ok) return "";

    const data = await response.json();
    let summary = "";
    if (data.answer) summary += `Dados da Tabela FIPE: ${data.answer}\n\n`;
    if (data.results?.length > 0) {
      summary += "Resultados FIPE:\n";
      for (const r of data.results) {
        summary += `- ${r.title} (${r.url}): ${r.content?.substring(0, 300) || ""}\n`;
      }
    }
    return summary;
  } catch {
    return "";
  }
}

const VEHICLE_CATEGORIES = ["Carros & Motos"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limit per Authorization token / IP — protects AI cost.
    const rateKey =
      req.headers.get("authorization")?.slice(-32) ||
      req.headers.get("x-forwarded-for") ||
      "anon";
    const limit = checkRateLimit(rateKey);
    if (!limit.ok) {
      return new Response(
        JSON.stringify({
          valid: true,
          reason: "Muitas validações em pouco tempo. Tente novamente em alguns segundos.",
          rate_limited: true,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(limit.retryAfter),
          },
        }
      );
    }

    const rawBody = await req.json();
    const parsed = BodySchema.safeParse(rawBody);
    
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ valid: true, reason: "Dados inválidos para validação", errors: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { name, category, condition, value_cents, description } = parsed.data;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ valid: true, reason: "Validação indisponível" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const valueFormatted = (value_cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const conditionLabel = { new: "novo", like_new: "seminovo", used: "usado", worn: "bem usado" }[condition || "used"] || "usado";
    const isVehicle = VEHICLE_CATEGORIES.includes(category);

    const searchQuery = `preço ${name} ${conditionLabel} Brasil reais comprar`;
    const searchPromises: Promise<string>[] = [searchTavily(searchQuery)];
    if (isVehicle) searchPromises.push(searchFipe(name));

    const [searchResults, fipeResults] = await Promise.all(searchPromises);

    const systemPrompt = `Você é um especialista em avaliação de preços de produtos usados no Brasil.
Sua função é analisar se o preço informado por um usuário é razoável comparado ao mercado real.

Regras de depreciação por condição:
- Novo: 100% do preço de mercado
- Seminovo: 70-90% do preço de novo
- Usado: 40-70% do preço de novo
- Bem usado: 20-50% do preço de novo

${isVehicle ? `Para veículos, use a Tabela FIPE como referência principal.` : ""}

Seja tolerante: só marque como inválido se o preço estiver mais de 60% acima ou abaixo da faixa razoável.
Use os dados reais da pesquisa web fornecidos para embasar sua análise.
Use a função validate_price para responder.`;

    let userPrompt = `O usuário quer cadastrar este item para permuta:

- Nome: "${name}"
- Categoria: "${category}"
- Condição: ${conditionLabel}
- Valor informado: ${valueFormatted}
`;
    if (description) userPrompt += `- Descrição do item: "${description}"\n`;
    userPrompt += "\n";
    if (searchResults) userPrompt += `DADOS REAIS DE PESQUISA WEB:\n${searchResults}\n\n`;
    if (fipeResults) userPrompt += `DADOS DA TABELA FIPE:\n${fipeResults}\n\n`;
    if (!searchResults && !fipeResults) userPrompt += `(Pesquisa web indisponível — use seu conhecimento interno)\n\n`;
    userPrompt += `Com base nos dados acima, o valor de ${valueFormatted} é razoável para um "${name}" na condição "${conditionLabel}"? Use a função validate_price para responder.`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "validate_price",
            description: "Retorna a validação do preço do item baseado em pesquisa de mercado.",
            parameters: {
              type: "object",
              properties: {
                valid: { type: "boolean" },
                reason: { type: "string" },
                suggested_min_cents: { type: "number" },
                suggested_max_cents: { type: "number" },
              },
              required: ["valid", "reason", "suggested_min_cents", "suggested_max_cents"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "validate_price" } },
      }),
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return new Response(
        JSON.stringify({ valid: true, reason: "Não foi possível validar o preço" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      return new Response(
        JSON.stringify({ valid: true, reason: "Validação inconclusiva" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({
        valid: result.valid,
        reason: result.reason,
        suggested_min_cents: result.suggested_min_cents,
        suggested_max_cents: result.suggested_max_cents,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("validate-item-price error:", err);
    return new Response(
      JSON.stringify({ valid: true, reason: "Erro na validação — item aceito" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
