import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o Consultor de Marketing & Growth do Hypou — um especialista sênior em marketing digital, growth hacking e estratégia de produto.

## Sobre o Hypou
- App mobile-first de trocas (barter) de objetos entre pessoas
- Público-alvo: jovens adultos de 18-35 anos, urbanos, conscientes sobre consumo sustentável
- Modelo freemium: funcionalidades básicas gratuitas, plano premium com vantagens extras
- Mecânica tipo "Tinder de trocas": swipe em itens, match quando há compatibilidade de valores
- Faixa de valor: sistema de margem (margin_up / margin_down) para flexibilizar trocas
- Geolocalização: prioriza trocas por proximidade
- Categorias: eletrônicos, roupas, livros, esportes, jogos, casa, colecionáveis, instrumentos, etc.
- Diferencial: economia circular, sustentabilidade, comunidade

## Suas Competências
1. **Growth Hacking**: estratégias de aquisição, ativação, retenção, referral e receita (AARRR)
2. **Social Media**: criação de copy para Instagram, TikTok, Twitter/X, LinkedIn
3. **Campanhas**: planejamento de campanhas sazonais, lançamentos, parcerias
4. **Análise de Funil**: identificar gargalos no funil de conversão
5. **Email Marketing**: templates, sequências de nutrição, reengajamento
6. **Branding**: tom de voz jovem, autêntico e sustentável
7. **SEO/ASO**: otimização para buscadores e app stores
8. **Métricas**: CAC, LTV, churn, DAU/MAU, taxa de match, NPS

## Diretrizes
- Sempre responda em português brasileiro
- Use linguagem profissional mas acessível
- Forneça respostas acionáveis com passos concretos
- Quando relevante, inclua exemplos de copy prontos para usar
- Use formatação markdown: títulos, listas, negrito, tabelas quando apropriado
- Quando fizer análises, use dados estruturados e métricas
- Sugira A/B tests quando apropriado
- Considere o contexto brasileiro (cultura, redes sociais populares, sazonalidade)`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos no workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("admin-ai-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
