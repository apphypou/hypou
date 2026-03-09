import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function searchTavily(query: string): Promise<string> {
  const TAVILY_API_KEY = Deno.env.get("TAVILY_API_KEY");
  if (!TAVILY_API_KEY) {
    console.error("TAVILY_API_KEY not configured");
    return "";
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

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
        include_domains: [
          "mercadolivre.com.br",
          "olx.com.br",
          "amazon.com.br",
          "magazineluiza.com.br",
          "americanas.com.br",
          "zoom.com.br",
          "buscape.com.br",
        ],
      }),
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      console.error("Tavily error:", response.status, errText);
      return "";
    }

    const data = await response.json();

    // Build a summary of search results
    let summary = "";
    if (data.answer) {
      summary += `Resumo da pesquisa: ${data.answer}\n\n`;
    }
    if (data.results && data.results.length > 0) {
      summary += "Resultados encontrados:\n";
      for (const r of data.results) {
        summary += `- ${r.title} (${r.url}): ${r.content?.substring(0, 300) || ""}\n`;
      }
    }
    return summary;
  } catch (err) {
    console.error("Tavily search failed:", err);
    return "";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, category, condition, value_cents } = await req.json();

    if (!name || !category || value_cents == null) {
      return new Response(
        JSON.stringify({ valid: true, reason: "Dados insuficientes para validação" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ valid: true, reason: "Validação indisponível" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const valueFormatted = (value_cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    const conditionLabel = {
      new: "novo",
      like_new: "seminovo",
      used: "usado",
      worn: "bem usado",
    }[condition || "used"] || "usado";

    // Step 1: Search real prices via Tavily
    const searchQuery = `preço ${name} ${conditionLabel} Brasil reais comprar`;
    console.log("Searching Tavily for:", searchQuery);
    const searchResults = await searchTavily(searchQuery);

    // Step 2: Build prompt with real search data
    const systemPrompt = `Você é um especialista em avaliação de preços de produtos usados no Brasil.
Sua função é analisar se o preço informado por um usuário é razoável comparado ao mercado real.

Regras de depreciação por condição:
- Novo: 100% do preço de mercado
- Seminovo: 70-90% do preço de novo
- Usado: 40-70% do preço de novo
- Bem usado: 20-50% do preço de novo

Seja tolerante: só marque como inválido se o preço estiver mais de 60% acima ou abaixo da faixa razoável.
Use os dados reais da pesquisa web fornecidos para embasar sua análise.
Use a função validate_price para responder.`;

    let userPrompt = `O usuário quer cadastrar este item para permuta:

- Nome: "${name}"
- Categoria: "${category}"
- Condição: ${conditionLabel}
- Valor informado: ${valueFormatted}

`;

    if (searchResults) {
      userPrompt += `DADOS REAIS DE PESQUISA WEB (preços encontrados em sites brasileiros):\n${searchResults}\n\n`;
    } else {
      userPrompt += `(Pesquisa web indisponível — use seu conhecimento interno como referência)\n\n`;
    }

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
        tools: [
          {
            type: "function",
            function: {
              name: "validate_price",
              description: "Retorna a validação do preço do item baseado em pesquisa de mercado.",
              parameters: {
                type: "object",
                properties: {
                  valid: {
                    type: "boolean",
                    description: "true se o preço é razoável, false se está muito fora do mercado",
                  },
                  reason: {
                    type: "string",
                    description: "Explicação curta em português. Ex: 'Um iPhone 14 usado custa entre R$ 2.500 e R$ 4.000 no mercado'",
                  },
                  suggested_min_cents: {
                    type: "number",
                    description: "Valor mínimo sugerido em centavos",
                  },
                  suggested_max_cents: {
                    type: "number",
                    description: "Valor máximo sugerido em centavos",
                  },
                },
                required: ["valid", "reason", "suggested_min_cents", "suggested_max_cents"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "validate_price" } },
      }),
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ valid: true, reason: "Serviço temporariamente indisponível" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ valid: true, reason: "Serviço indisponível" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ valid: true, reason: "Não foi possível validar o preço" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ valid: true, reason: "Validação inconclusiva" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = JSON.parse(toolCall.function.arguments);

    console.log("Validation result:", JSON.stringify(result));

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
