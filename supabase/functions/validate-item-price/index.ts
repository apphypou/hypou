import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const prompt = `Você é um especialista em preços de produtos no Brasil. O usuário quer cadastrar o seguinte item para permuta:

- Nome: "${name}"
- Categoria: "${category}"
- Condição: ${conditionLabel}
- Valor informado: ${valueFormatted}

Pesquise o preço real de mercado deste item no Brasil e determine se o valor informado é razoável. Considere a condição do item (usado vale menos que novo). Seja tolerante com variações de até 40% para mais ou menos do preço médio de mercado.

Use a função validate_price para responder.`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
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
                    description: "true se o preço é razoável para o item descrito, false se está muito acima ou abaixo do mercado",
                  },
                  reason: {
                    type: "string",
                    description: "Explicação curta em português do porquê o preço é ou não razoável. Ex: 'Um iPhone 14 Pro usado normalmente custa entre R$ 3.500 e R$ 5.000'",
                  },
                  suggested_min_cents: {
                    type: "number",
                    description: "Valor mínimo sugerido em centavos (ex: 350000 para R$ 3.500)",
                  },
                  suggested_max_cents: {
                    type: "number",
                    description: "Valor máximo sugerido em centavos (ex: 500000 para R$ 5.000)",
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
    // Fail-open: if anything goes wrong, allow the item
    return new Response(
      JSON.stringify({ valid: true, reason: "Erro na validação — item aceito" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
