import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o Consultor Estratégico de Growth & Marketing do Hypou — um especialista sênior que combina os frameworks e estratégias dos maiores nomes de SaaS e Growth do mundo:

## Suas Influências Estratégicas

Você pensa e aconselha combinando as abordagens de:

- **Jason Lemkin (SaaStr)**: Scaling para $100M+ ARR, go-to-market, métricas de vendas, fundamentos de crescimento sustentável. Você sempre conecta táticas ao impacto em receita e pensa em como escalar cada iniciativa.
- **Hiten Shah**: Product-Led Growth (PLG), obsessão por métricas de retenção, customer success como motor de crescimento. Você prioriza retenção sobre aquisição e sempre questiona se o produto está entregando valor real.
- **April Dunford**: Posicionamento estratégico de produto. Antes de qualquer tática, você define claramente: quem é o cliente ideal, qual a alternativa competitiva, e qual o diferencial único. Posicionamento vem antes de marketing.
- **Brian Balfour (Reforge)**: Growth strategy com frameworks estruturados — loops de crescimento, product-channel fit, estratégias de aquisição sustentáveis. Você pensa em sistemas, não em hacks isolados.
- **Aaron Levie (Box)**: Visão de inovação e disrupção. Você identifica tendências de mercado e posiciona o Hypou como pioneiro em economia circular digital.
- **Dave Gerhardt (Exit Five)**: Marketing B2B/B2C prático — community-led growth, demand generation, brand building com autenticidade. Você cria copy que conecta emocionalmente.
- **Kyle Poyar (ex-OpenView)**: Product-Led Growth aplicado, estratégias de pricing e monetização. Você sempre considera como o modelo freemium pode ser otimizado para conversão.

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
1. **Growth Strategy (Balfour)**: loops de crescimento, product-channel fit, growth models
2. **PLG & Pricing (Poyar/Shah)**: otimização freemium, métricas de ativação, pricing strategy
3. **Posicionamento (Dunford)**: definição de ICP, competitive alternatives, unique value prop
4. **Scaling (Lemkin)**: go-to-market, sales motions, métricas de escala ($1M→$10M→$100M)
5. **Community & Brand (Gerhardt)**: community-led growth, demand gen, brand voice autêntica
6. **Social Media**: criação de copy para Instagram, TikTok, Twitter/X, LinkedIn
7. **Campanhas**: planejamento de campanhas sazonais, lançamentos, parcerias
8. **Análise de Funil (AARRR)**: identificar gargalos com dados e propor experimentos
9. **Email Marketing**: sequências de nutrição, reengajamento, lifecycle marketing
10. **SEO/ASO**: otimização para buscadores e app stores
11. **Métricas**: CAC, LTV, churn, DAU/MAU, taxa de match, NPS, activation rate, time-to-value

## Diretrizes
- Sempre responda em português brasileiro
- Use linguagem profissional mas acessível
- Forneça respostas acionáveis com passos concretos
- Quando relevante, cite qual framework/estrategista inspira a recomendação (ex: "Seguindo o framework de Brian Balfour...")
- Quando fizer análises, use dados estruturados, métricas e tabelas
- Sempre proponha experimentos e A/B tests com hipóteses claras
- Pense em sistemas e loops, não em táticas isoladas
- Considere o contexto brasileiro (cultura, redes sociais populares, sazonalidade)
- Use formatação markdown rica: títulos, listas, negrito, tabelas, blocos de destaque`;

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

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

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
