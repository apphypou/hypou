import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BOTS = [
  {
    email: "bot1@hypou.test", name: "Ana Silva", location: "São Paulo, SP",
    lat: -23.5505, lng: -46.6333,
    categories: ["Celulares", "Moda"],
    items: [
      { name: "iPhone 14 Pro Max", category: "Celulares", description: "128GB, cor Roxo Profundo, estado impecável, bateria 96%", market_value: 550000, margin_up: 15, margin_down: 10, images: ["https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&h=800&fit=crop", "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=800&fit=crop"] },
      { name: "Bolsa Louis Vuitton Neverfull", category: "Moda", description: "Modelo Neverfull MM, couro legítimo, acompanha dustbag", market_value: 800000, margin_up: 20, margin_down: 5, images: ["https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&h=800&fit=crop"] },
      { name: "Apple Watch Series 9", category: "Celulares", description: "45mm, GPS + Cellular, pulseira esportiva preta", market_value: 350000, margin_up: 12, margin_down: 8, images: ["https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=800&h=800&fit=crop"] },
      { name: "Óculos Ray-Ban Aviador", category: "Moda", description: "Lentes polarizadas, armação dourada, original com estojo", market_value: 85000, margin_up: 20, margin_down: 15, images: ["https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&h=800&fit=crop"] },
      { name: "Tênis Adidas Ultraboost 23", category: "Moda", description: "Tamanho 42, preto, usado 3x, estado de novo", market_value: 65000, margin_up: 18, margin_down: 12, images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop"] },
    ],
  },
  {
    email: "bot2@hypou.test", name: "Carlos Santos", location: "Rio de Janeiro, RJ",
    lat: -22.9068, lng: -43.1729,
    categories: ["Carros & Motos", "Esportes"],
    items: [
      { name: "Honda CB 500F 2022", category: "Carros & Motos", description: "12.000 km, revisões em dia, único dono, pneus novos", market_value: 2800000, margin_up: 10, margin_down: 8, images: ["https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&h=800&fit=crop", "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=800&h=800&fit=crop"] },
      { name: "Bicicleta Caloi Elite Carbon", category: "Esportes", description: "Quadro carbono, Shimano Deore XT, rodas 29\"", market_value: 450000, margin_up: 15, margin_down: 10, images: ["https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&h=800&fit=crop"] },
      { name: "Capacete AGV K3 Rossi", category: "Carros & Motos", description: "Tamanho 58, grafismo Valentino Rossi, usado 6 meses", market_value: 180000, margin_up: 20, margin_down: 15, images: ["https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?w=800&h=800&fit=crop"] },
      { name: "Prancha de Surf Al Merrick", category: "Esportes", description: "6'2\", epóxi, ideal para ondas médias, com quilhas FCS", market_value: 220000, margin_up: 18, margin_down: 12, images: ["https://images.unsplash.com/photo-1502680390548-bdbac40a5726?w=800&h=800&fit=crop"] },
      { name: "Jaqueta de Couro Legítimo", category: "Carros & Motos", description: "Tamanho G, couro bovino, estilo motociclista, com proteção", market_value: 95000, margin_up: 20, margin_down: 15, images: ["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=800&fit=crop"] },
    ],
  },
  {
    email: "bot3@hypou.test", name: "Juliana Costa", location: "Belo Horizonte, MG",
    lat: -19.9167, lng: -43.9345,
    categories: ["Casa", "Moda"],
    items: [
      { name: "Sofá Retrátil 3 Lugares", category: "Casa", description: "Tecido suede cinza, 2m de largura, reclinável, seminovo", market_value: 320000, margin_up: 15, margin_down: 10, images: ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=800&fit=crop"] },
      { name: "Vestido de Festa Longo", category: "Moda", description: "Tamanho M, seda, cor marsala, usado uma vez", market_value: 45000, margin_up: 25, margin_down: 15, images: ["https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&h=800&fit=crop"] },
      { name: "Mesa de Jantar 6 Lugares", category: "Casa", description: "Madeira maciça, tampo de vidro, estilo industrial", market_value: 280000, margin_up: 12, margin_down: 8, images: ["https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&h=800&fit=crop"] },
      { name: "Luminária Pendente Industrial", category: "Casa", description: "Kit com 3 pendentes, metal preto fosco, E27", market_value: 35000, margin_up: 20, margin_down: 15, images: ["https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=800&h=800&fit=crop"] },
      { name: "Tapete Persa 2x3m", category: "Casa", description: "Artesanal, tons de terracota e azul, estado impecável", market_value: 150000, margin_up: 18, margin_down: 10, images: ["https://images.unsplash.com/photo-1600166898405-da9535204843?w=800&h=800&fit=crop"] },
    ],
  },
  {
    email: "bot4@hypou.test", name: "Pedro Oliveira", location: "Curitiba, PR",
    lat: -25.4284, lng: -49.2733,
    categories: ["Videogames", "Eletrônicos"],
    items: [
      { name: "PlayStation 5 + 3 Jogos", category: "Videogames", description: "Versão com disco, inclui God of War Ragnarök, Spider-Man 2 e FC 25", market_value: 380000, margin_up: 12, margin_down: 10, images: ["https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&h=800&fit=crop", "https://images.unsplash.com/photo-1622297845775-5ff3fef71d13?w=800&h=800&fit=crop"] },
      { name: "Nintendo Switch OLED", category: "Videogames", description: "Modelo branco, Joy-Cons extras, cartão 128GB, 5 jogos digitais", market_value: 220000, margin_up: 15, margin_down: 12, images: ["https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=800&h=800&fit=crop"] },
      { name: "Monitor LG UltraGear 27\" 144Hz", category: "Eletrônicos", description: "IPS, 1ms, HDR10, FreeSync Premium, suporte VESA", market_value: 180000, margin_up: 15, margin_down: 10, images: ["https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&h=800&fit=crop"] },
      { name: "Headset HyperX Cloud II", category: "Videogames", description: "7.1 surround, microfone removível, preto/vermelho, seminovo", market_value: 45000, margin_up: 20, margin_down: 15, images: ["https://images.unsplash.com/photo-1599669454699-248893623440?w=800&h=800&fit=crop"] },
      { name: "Controle Xbox Elite Series 2", category: "Videogames", description: "Com paddles, case, cabo USB-C, garantia ativa", market_value: 95000, margin_up: 15, margin_down: 10, images: ["https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=800&h=800&fit=crop"] },
      { name: "Webcam Logitech C920", category: "Eletrônicos", description: "Full HD 1080p, microfone stereo, ideal para streaming", market_value: 35000, margin_up: 20, margin_down: 15, images: ["https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&h=800&fit=crop"] },
    ],
  },
  {
    email: "bot5@hypou.test", name: "Mariana Lima", location: "Brasília, DF",
    lat: -15.7975, lng: -47.8919,
    categories: ["Celulares", "Livros"],
    items: [
      { name: "Samsung Galaxy S24 Ultra", category: "Celulares", description: "256GB, Titanium Black, S Pen, na caixa com NF", market_value: 600000, margin_up: 10, margin_down: 8, images: ["https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&h=800&fit=crop", "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=800&fit=crop"] },
      { name: "iPad Pro M2 12.9\"", category: "Celulares", description: "128GB, WiFi, Space Gray, com Apple Pencil 2", market_value: 700000, margin_up: 12, margin_down: 8, images: ["https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&h=800&fit=crop"] },
      { name: "Coleção Harry Potter Capa Dura", category: "Livros", description: "7 livros, edição especial, português, novos", market_value: 35000, margin_up: 25, margin_down: 15, images: ["https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&h=800&fit=crop"] },
      { name: "Kindle Paperwhite 11ª Geração", category: "Livros", description: "6.8\", 8GB, à prova d'água, com capa, 200+ livros", market_value: 55000, margin_up: 18, margin_down: 12, images: ["https://images.unsplash.com/photo-1594377157609-5c996118ac7f?w=800&h=800&fit=crop"] },
      { name: "AirPods Pro 2ª Geração", category: "Celulares", description: "Com case MagSafe, cancelamento de ruído ativo, lacrado", market_value: 180000, margin_up: 10, margin_down: 8, images: ["https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800&h=800&fit=crop"] },
    ],
  },
  {
    email: "bot6@hypou.test", name: "Rafael Mendes", location: "Porto Alegre, RS",
    lat: -30.0346, lng: -51.2177,
    categories: ["Instrumentos", "Videogames"],
    items: [
      { name: "Guitarra Fender Stratocaster", category: "Instrumentos", description: "Player Series, Sunburst, corpo alder, braço maple", market_value: 650000, margin_up: 12, margin_down: 8, images: ["https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?w=800&h=800&fit=crop"] },
      { name: "Xbox Series X", category: "Videogames", description: "1TB, 2 controles, Game Pass Ultimate 6 meses", market_value: 350000, margin_up: 14, margin_down: 10, images: ["https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=800&h=800&fit=crop"] },
      { name: "Pedaleira Boss GT-1000", category: "Instrumentos", description: "Multi-efeitos profissional, COSM, Bluetooth, com case", market_value: 450000, margin_up: 15, margin_down: 10, images: ["https://images.unsplash.com/photo-1558098329-a11cff621064?w=800&h=800&fit=crop"] },
      { name: "Amplificador Marshall DSL40CR", category: "Instrumentos", description: "Valvulado, 40W, 2 canais, reverb, footswitch incluso", market_value: 550000, margin_up: 12, margin_down: 8, images: ["https://images.unsplash.com/photo-1535587566541-97121a128dc5?w=800&h=800&fit=crop"] },
      { name: "Teclado Yamaha PSR-E473", category: "Instrumentos", description: "61 teclas, 820 timbres, USB, seminovo", market_value: 180000, margin_up: 18, margin_down: 12, images: ["https://images.unsplash.com/photo-1520523839897-bd33cd60db79?w=800&h=800&fit=crop"] },
    ],
  },
  {
    email: "bot7@hypou.test", name: "Fernanda Souza", location: "Salvador, BA",
    lat: -12.9714, lng: -38.5124,
    categories: ["Moda", "Esportes"],
    items: [
      { name: "Tênis Nike Air Jordan 1 Chicago", category: "Moda", description: "Tamanho 39, original, DS (deadstock), com receipt", market_value: 150000, margin_up: 18, margin_down: 10, images: ["https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&h=800&fit=crop"] },
      { name: "Relógio Casio G-Shock GA-2100", category: "Moda", description: "CasiOak, cor preta, na caixa, manual", market_value: 90000, margin_up: 15, margin_down: 12, images: ["https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800&h=800&fit=crop"] },
      { name: "Esteira Elétrica Athletic Runner", category: "Esportes", description: "12 km/h, inclinação, dobrável, 110V, pouco uso", market_value: 200000, margin_up: 15, margin_down: 10, images: ["https://images.unsplash.com/photo-1576678927484-cc907957088c?w=800&h=800&fit=crop"] },
      { name: "Kit Halteres Emborrachados 40kg", category: "Esportes", description: "Pares de 2-10kg, suporte incluso, estado excelente", market_value: 65000, margin_up: 20, margin_down: 15, images: ["https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=800&fit=crop"] },
      { name: "Bolsa Michael Kors Jet Set", category: "Moda", description: "Couro saffiano, cor nude, seminova, com dustbag", market_value: 120000, margin_up: 18, margin_down: 12, images: ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&h=800&fit=crop"] },
    ],
  },
  {
    email: "bot8@hypou.test", name: "Lucas Rocha", location: "Florianópolis, SC",
    lat: -27.5954, lng: -48.5480,
    categories: ["Casa", "Eletrônicos"],
    items: [
      { name: "Smart TV LG 55\" 4K OLED", category: "Casa", description: "Modelo 2024, webOS, Dolby Vision, Magic Remote", market_value: 380000, margin_up: 12, margin_down: 8, images: ["https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&h=800&fit=crop"] },
      { name: "Aspirador Robô Xiaomi S10+", category: "Casa", description: "Mapeamento laser, 4000Pa, lava e aspira, seminovo", market_value: 160000, margin_up: 15, margin_down: 10, images: ["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=800&fit=crop"] },
      { name: "Drone DJI Mini 3 Pro", category: "Eletrônicos", description: "4K/60fps, sensor de obstáculos, 3 baterias, com Fly More", market_value: 500000, margin_up: 10, margin_down: 8, images: ["https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&h=800&fit=crop"] },
      { name: "Câmera Sony Alpha a6400", category: "Eletrônicos", description: "Mirrorless, lente 16-50mm, 4K, AF Eye, 8k cliques", market_value: 450000, margin_up: 12, margin_down: 8, images: ["https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&h=800&fit=crop"] },
      { name: "Purificador de Água Electrolux", category: "Casa", description: "PE12B, 3 temperaturas, filtro novo, branco", market_value: 75000, margin_up: 20, margin_down: 15, images: ["https://images.unsplash.com/photo-1564419320461-6870880221ad?w=800&h=800&fit=crop"] },
    ],
  },
  {
    email: "bot9@hypou.test", name: "Camila Alves", location: "Recife, PE",
    lat: -8.0476, lng: -34.8770,
    categories: ["Celulares", "Casa"],
    items: [
      { name: "MacBook Air M2 2023", category: "Celulares", description: "8GB RAM, 256GB SSD, cor Meia-Noite, 42 ciclos de bateria", market_value: 750000, margin_up: 10, margin_down: 5, images: ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=800&fit=crop", "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&h=800&fit=crop"] },
      { name: "Echo Show 15", category: "Casa", description: "Tela 15.6\", Alexa, central de casa inteligente, lacrado", market_value: 180000, margin_up: 15, margin_down: 10, images: ["https://images.unsplash.com/photo-1543512214-318c7553f230?w=800&h=800&fit=crop"] },
      { name: "Pixel 8 Pro", category: "Celulares", description: "128GB, Obsidian, câmera 50MP, AI features, na caixa", market_value: 450000, margin_up: 12, margin_down: 8, images: ["https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&h=800&fit=crop"] },
      { name: "Cafeteira Nespresso Vertuo Next", category: "Casa", description: "Preta, com Aeroccino, 50 cápsulas de brinde", market_value: 85000, margin_up: 20, margin_down: 15, images: ["https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=800&fit=crop"] },
      { name: "Air Fryer Mondial 5L", category: "Casa", description: "Digital, 1500W, preta, pouco uso, na caixa", market_value: 45000, margin_up: 25, margin_down: 15, images: ["https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&h=800&fit=crop"] },
    ],
  },
  {
    email: "bot10@hypou.test", name: "Bruno Ferreira", location: "Goiânia, GO",
    lat: -16.6869, lng: -49.2648,
    categories: ["Videogames", "Ferramentas"],
    items: [
      { name: "PC Gamer RTX 4060 Ti", category: "Videogames", description: "i5-13600KF, 32GB RAM, SSD 1TB NVMe, Water Cooler 240mm", market_value: 600000, margin_up: 12, margin_down: 10, images: ["https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&h=800&fit=crop", "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=800&h=800&fit=crop"] },
      { name: "Furadeira Bosch Profissional", category: "Ferramentas", description: "GSB 180-LI, 2 baterias 18V, maleta com acessórios", market_value: 85000, margin_up: 20, margin_down: 15, images: ["https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&h=800&fit=crop"] },
      { name: "Steam Deck OLED 512GB", category: "Videogames", description: "Tela OLED 7.4\", 512GB NVMe, dock inclusa", market_value: 380000, margin_up: 12, margin_down: 8, images: ["https://images.unsplash.com/photo-1640955014216-75201056c829?w=800&h=800&fit=crop"] },
      { name: "Kit Ferramentas Stanley 150 Peças", category: "Ferramentas", description: "Chaves, soquetes, alicates, maleta profissional", market_value: 55000, margin_up: 20, margin_down: 15, images: ["https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=800&h=800&fit=crop"] },
      { name: "Serra Circular Makita 7 1/4\"", category: "Ferramentas", description: "1800W, disco de corte incluso, guia paralela", market_value: 95000, margin_up: 18, margin_down: 12, images: ["https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800&h=800&fit=crop"] },
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
      const botEmails = BOTS.map((b) => b.email);
      const { data: users } = await supabaseAdmin.auth.admin.listUsers();
      const botUsers = (users?.users || []).filter((u) => botEmails.includes(u.email || ""));

      for (const user of botUsers) {
        const { data: userItems } = await supabaseAdmin.from("items").select("id").eq("user_id", user.id);
        if (userItems) {
          for (const item of userItems) {
            await supabaseAdmin.from("item_images").delete().eq("item_id", item.id);
          }
        }
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

      await supabaseAdmin.from("profiles").update({
        display_name: bot.name,
        location: bot.location,
        avatar_url: avatarUrl,
        onboarding_completed: true,
        latitude: bot.lat,
        longitude: bot.lng,
      }).eq("user_id", userId);

      const catRows = bot.categories.map((category) => ({ user_id: userId, category }));
      await supabaseAdmin.from("user_categories").insert(catRows);

      let itemCount = 0;
      for (const item of bot.items) {
        const { data: newItem } = await supabaseAdmin.from("items").insert({
          user_id: userId, name: item.name, description: item.description, category: item.category,
          market_value: item.market_value, margin_up: item.margin_up, margin_down: item.margin_down,
          location: bot.location, status: "active",
        }).select("id").single();

        if (newItem && item.images) {
          const imageRows = item.images.map((url: string, i: number) => ({
            item_id: newItem.id, image_url: url, position: i,
          }));
          await supabaseAdmin.from("item_images").insert(imageRows);
        }
        itemCount++;
      }

      results.push(`✅ ${bot.name} criado com ${itemCount} item(s)`);
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
