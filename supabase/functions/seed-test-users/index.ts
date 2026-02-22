import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BOTS = [
  {
    email: "bot1@hypou.test", name: "Ana Silva", location: "São Paulo, SP",
    categories: ["Celulares", "Moda"],
    items: [
      { name: "iPhone 14 Pro Max", category: "Celulares", description: "128GB, cor Roxo Profundo, estado impecável", market_value: 5500, margin_up: 15, margin_down: 10 },
      { name: "Bolsa Louis Vuitton", category: "Moda", description: "Modelo Neverfull MM, couro legítimo", market_value: 8000, margin_up: 20, margin_down: 5 },
    ],
  },
  {
    email: "bot2@hypou.test", name: "Carlos Santos", location: "Rio de Janeiro, RJ",
    categories: ["Carros & Motos"],
    items: [
      { name: "Honda CB 500F 2022", category: "Carros & Motos", description: "12.000 km, revisões em dia, único dono", market_value: 28000, margin_up: 10, margin_down: 8 },
    ],
  },
  {
    email: "bot3@hypou.test", name: "Juliana Costa", location: "Belo Horizonte, MG",
    categories: ["Casa", "Moda"],
    items: [
      { name: "Sofá Retrátil 3 Lugares", category: "Casa", description: "Tecido suede, cor cinza, 2m de largura", market_value: 3200, margin_up: 15, margin_down: 10 },
      { name: "Vestido Gucci", category: "Moda", description: "Tamanho M, usado apenas uma vez", market_value: 4500, margin_up: 18, margin_down: 8 },
    ],
  },
  {
    email: "bot4@hypou.test", name: "Pedro Oliveira", location: "Curitiba, PR",
    categories: ["Videogames"],
    items: [
      { name: "PlayStation 5 + 3 Jogos", category: "Videogames", description: "Versão com disco, inclui God of War, Spider-Man 2 e FIFA 24", market_value: 3800, margin_up: 12, margin_down: 10 },
      { name: "Nintendo Switch OLED", category: "Videogames", description: "Modelo branco, com Joy-Cons extras", market_value: 2200, margin_up: 15, margin_down: 12 },
    ],
  },
  {
    email: "bot5@hypou.test", name: "Mariana Lima", location: "Brasília, DF",
    categories: ["Celulares"],
    items: [
      { name: "Samsung Galaxy S24 Ultra", category: "Celulares", description: "256GB, cor Titanium Black, na caixa", market_value: 6000, margin_up: 10, margin_down: 8 },
    ],
  },
  {
    email: "bot6@hypou.test", name: "Rafael Mendes", location: "Porto Alegre, RS",
    categories: ["Carros & Motos", "Videogames"],
    items: [
      { name: "Xbox Series X", category: "Videogames", description: "1TB, com 2 controles e Game Pass Ultimate", market_value: 3500, margin_up: 14, margin_down: 10 },
      { name: "Capacete AGV K3", category: "Carros & Motos", description: "Tamanho 58, grafismo Rossi, usado 6 meses", market_value: 1800, margin_up: 20, margin_down: 15 },
    ],
  },
  {
    email: "bot7@hypou.test", name: "Fernanda Souza", location: "Salvador, BA",
    categories: ["Moda"],
    items: [
      { name: "Tênis Nike Air Jordan 1", category: "Moda", description: "Tamanho 39, colorway Chicago, original", market_value: 1500, margin_up: 18, margin_down: 10 },
      { name: "Relógio Casio G-Shock", category: "Moda", description: "Modelo GA-2100, cor preta, na caixa", market_value: 900, margin_up: 15, margin_down: 12 },
    ],
  },
  {
    email: "bot8@hypou.test", name: "Lucas Rocha", location: "Florianópolis, SC",
    categories: ["Casa"],
    items: [
      { name: "Smart TV LG 55\" 4K", category: "Casa", description: "Modelo 2023, webOS, controle Magic Remote", market_value: 2800, margin_up: 12, margin_down: 8 },
      { name: "Aspirador Robô Xiaomi", category: "Casa", description: "Modelo S10+, mapeamento laser, seminovo", market_value: 1600, margin_up: 15, margin_down: 10 },
    ],
  },
  {
    email: "bot9@hypou.test", name: "Camila Alves", location: "Recife, PE",
    categories: ["Celulares", "Casa"],
    items: [
      { name: "MacBook Air M2", category: "Celulares", description: "8GB RAM, 256GB SSD, cor Meia-Noite", market_value: 7500, margin_up: 10, margin_down: 5 },
      { name: "Echo Dot 5ª Geração", category: "Casa", description: "Com relógio, cor branca, lacrado", market_value: 350, margin_up: 20, margin_down: 15 },
    ],
  },
  {
    email: "bot10@hypou.test", name: "Bruno Ferreira", location: "Goiânia, GO",
    categories: ["Videogames", "Moda"],
    items: [
      { name: "PC Gamer RTX 4060", category: "Videogames", description: "i5-13400F, 16GB RAM, SSD 1TB, montado", market_value: 5000, margin_up: 12, margin_down: 10 },
      { name: "Jaqueta North Face", category: "Moda", description: "Modelo Thermoball, tamanho G, preta", market_value: 1200, margin_up: 18, margin_down: 12 },
    ],
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "seed";

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (action === "cleanup") {
      // Find and delete all bot users
      const botEmails = BOTS.map((b) => b.email);
      const { data: users } = await supabaseAdmin.auth.admin.listUsers();
      const botUsers = (users?.users || []).filter((u) => botEmails.includes(u.email || ""));

      for (const user of botUsers) {
        // Delete items, categories, then profile (cascade handled by auth delete)
        await supabaseAdmin.from("items").delete().eq("user_id", user.id);
        await supabaseAdmin.from("user_categories").delete().eq("user_id", user.id);
        await supabaseAdmin.auth.admin.deleteUser(user.id);
      }

      return new Response(JSON.stringify({ success: true, deleted: botUsers.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Seed action
    const results: string[] = [];

    for (const bot of BOTS) {
      // Create auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: bot.email,
        password: "teste123",
        email_confirm: true,
        user_metadata: { display_name: bot.name },
      });

      if (authError) {
        if (authError.message?.includes("already been registered")) {
          results.push(`⏭️ ${bot.name} já existe, pulando`);
          continue;
        }
        results.push(`❌ ${bot.name}: ${authError.message}`);
        continue;
      }

      const userId = authData.user.id;
      const initials = bot.name.split(" ").map((n) => n[0]).join("+");
      const avatarUrl = `https://ui-avatars.com/api/?name=${initials}&background=0891b2&color=fff&size=200&bold=true`;

      // Update profile
      await supabaseAdmin
        .from("profiles")
        .update({
          display_name: bot.name,
          location: bot.location,
          avatar_url: avatarUrl,
          onboarding_completed: true,
        })
        .eq("user_id", userId);

      // Insert categories
      const catRows = bot.categories.map((category) => ({ user_id: userId, category }));
      await supabaseAdmin.from("user_categories").insert(catRows);

      // Insert items
      for (const item of bot.items) {
        await supabaseAdmin.from("items").insert({
          user_id: userId,
          name: item.name,
          description: item.description,
          category: item.category,
          market_value: item.market_value,
          margin_up: item.margin_up,
          margin_down: item.margin_down,
          location: bot.location,
          status: "active",
        });
      }

      results.push(`✅ ${bot.name} criado com ${bot.items.length} item(s)`);
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
