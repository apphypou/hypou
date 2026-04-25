/**
 * E2E real-world flow: 2 contas + fluxo completo de troca via Supabase REST.
 * Roda contra o projeto real (gfvqympaaglkplzbocbl).
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://gfvqympaaglkplzbocbl.supabase.co";
const ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdnF5bXBhYWdsa3BsemJvY2JsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MTM2NTYsImV4cCI6MjA4NzI4OTY1Nn0.URR_2cpEO5xMsFwDGfELuYIn4g6Q8bIYKd4V-flBXhU";

const ts = Date.now();
const A_EMAIL = `qa-alice-${ts}@outlook.com`;
const B_EMAIL = `qa-bob-${ts}@outlook.com`;
const PWD = "Test123!@#";

const log: string[] = [];
const ok = (m: string) => log.push(`✅ ${m}`);
const fail = (m: string, e?: any) => log.push(`❌ ${m}${e ? ` — ${e.message || e}` : ""}`);

const sbA = createClient(SUPABASE_URL, ANON_KEY);
const sbB = createClient(SUPABASE_URL, ANON_KEY);

async function run() {
  // 1. SIGNUP
  try {
    const r1 = await sbA.auth.signUp({ email: A_EMAIL, password: PWD });
    if (r1.error) throw r1.error;
    ok(`Signup Alice (${A_EMAIL})`);
  } catch (e) {
    fail("Signup Alice", e);
  }
  try {
    const r2 = await sbB.auth.signUp({ email: B_EMAIL, password: PWD });
    if (r2.error) throw r2.error;
    ok(`Signup Bob (${B_EMAIL})`);
  } catch (e) {
    fail("Signup Bob", e);
  }

  // 2. LOGIN
  let aId = "", bId = "";
  try {
    const { data, error } = await sbA.auth.signInWithPassword({ email: A_EMAIL, password: PWD });
    if (error) throw error;
    aId = data.user!.id;
    ok(`Login Alice (id=${aId.slice(0, 8)})`);
  } catch (e) {
    fail("Login Alice", e);
  }
  try {
    const { data, error } = await sbB.auth.signInWithPassword({ email: B_EMAIL, password: PWD });
    if (error) throw error;
    bId = data.user!.id;
    ok(`Login Bob (id=${bId.slice(0, 8)})`);
  } catch (e) {
    fail("Login Bob", e);
  }

  if (!aId || !bId) {
    log.push("⛔ Abortando — login falhou");
    return log;
  }

  // 3. ATUALIZA PERFIL + GEOLOCALIZAÇÃO
  for (const [sb, name, id] of [[sbA, "Alice QA", aId], [sbB, "Bob QA", bId]] as const) {
    const { error } = await sb
      .from("profiles")
      .update({
        display_name: name,
        location: "São Paulo - SP",
        latitude: -23.5505,
        longitude: -46.6333,
        onboarding_completed: true,
        terms_accepted_at: new Date().toISOString(),
        chat_terms_accepted_at: new Date().toISOString(),
      })
      .eq("user_id", id);
    if (error) fail(`Update profile ${name}`, error);
    else ok(`Profile + onboarding ${name}`);
  }

  // 4. CRIA ITENS
  let itemA = "", itemB = "";
  {
    const { data, error } = await sbA
      .from("items")
      .insert({
        user_id: aId,
        name: "iPhone 12 64GB QA",
        description: "Aparelho em ótimo estado",
        category: "Eletrônicos",
        condition: "used",
        location: "São Paulo - SP",
        market_value: 200000,
        margin_up: 15,
        margin_down: 10,
        status: "active",
      })
      .select("id")
      .single();
    if (error) fail("Cria item Alice", error);
    else { itemA = data.id; ok(`Item Alice criado (${itemA.slice(0, 8)})`); }
  }
  {
    const { data, error } = await sbB
      .from("items")
      .insert({
        user_id: bId,
        name: "Bicicleta Aro 29 QA",
        description: "Pouco uso",
        category: "Esportes",
        condition: "used",
        location: "São Paulo - SP",
        market_value: 195000,
        margin_up: 15,
        margin_down: 10,
        status: "active",
      })
      .select("id")
      .single();
    if (error) fail("Cria item Bob", error);
    else { itemB = data.id; ok(`Item Bob criado (${itemB.slice(0, 8)})`); }
  }

  // 5. UPLOAD IMAGE PLACEHOLDER (insert direto no item_images com URL pública)
  if (itemA) {
    const { error } = await sbA
      .from("item_images")
      .insert({ item_id: itemA, image_url: "https://placehold.co/600x600/png?text=A", position: 0 });
    if (error) fail("Imagem item Alice", error);
    else ok("Imagem item Alice");
  }
  if (itemB) {
    const { error } = await sbB
      .from("item_images")
      .insert({ item_id: itemB, image_url: "https://placehold.co/600x600/png?text=B", position: 0 });
    if (error) fail("Imagem item Bob", error);
    else ok("Imagem item Bob");
  }

  // 6. ALICE SWIPE LIKE NO ITEM B
  if (itemB) {
    const { error } = await sbA.from("swipes").insert({ swiper_id: aId, item_id: itemB, direction: "like" });
    if (error) fail("Swipe Alice -> Bob", error);
    else ok("Swipe like Alice -> Bob");
  }

  // 7. ALICE CRIA PROPOSTA
  let matchId = "";
  if (itemA && itemB) {
    const { data, error } = await sbA
      .from("matches")
      .insert({
        user_a_id: aId,
        user_b_id: bId,
        item_a_id: itemA,
        item_b_id: itemB,
        status: "proposal",
      })
      .select("id")
      .single();
    if (error) fail("Cria proposta", error);
    else { matchId = data.id; ok(`Proposta criada (${matchId.slice(0, 8)})`); }
  }

  // 8. BOB ACEITA
  if (matchId) {
    const { error } = await sbB
      .from("matches")
      .update({ status: "accepted" })
      .eq("id", matchId)
      .eq("status", "proposal");
    if (error) fail("Bob aceita proposta", error);
    else ok("Bob aceitou proposta");
  }

  // 9. CONVERSA CRIADA
  let convId = "";
  if (matchId) {
    const { data, error } = await sbB
      .from("conversations")
      .insert({ match_id: matchId })
      .select("id")
      .single();
    if (error && !/duplicate/i.test(error.message)) fail("Cria conversa", error);
    else if (data) { convId = data.id; ok(`Conversa criada (${convId.slice(0, 8)})`); }
    else {
      const { data: existing } = await sbB.from("conversations").select("id").eq("match_id", matchId).single();
      convId = existing?.id || "";
      ok("Conversa já existente recuperada");
    }
  }

  // 10. TROCA MENSAGENS
  if (convId) {
    const { error: e1 } = await sbA
      .from("messages")
      .insert({ conversation_id: convId, sender_id: aId, content: "Oi Bob! Bora trocar?", message_type: "text" });
    if (e1) fail("Mensagem Alice -> Bob", e1);
    else ok("Mensagem Alice enviada");

    const { error: e2 } = await sbB
      .from("messages")
      .insert({ conversation_id: convId, sender_id: bId, content: "Bora! Onde você tá?", message_type: "text" });
    if (e2) fail("Mensagem Bob -> Alice", e2);
    else ok("Mensagem Bob enviada");
  }

  // 11. BOB MARCA COMO LIDA
  if (convId) {
    const { error } = await sbB
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", convId)
      .eq("sender_id", aId);
    if (error) fail("Marcar como lida", error);
    else ok("Mensagens marcadas como lidas");
  }

  // 12. AMBOS CONFIRMAM TROCA
  if (matchId) {
    const { error: e1 } = await sbA.from("matches").update({ confirmed_by_a: true }).eq("id", matchId);
    if (e1) fail("Alice confirma troca", e1);
    else ok("Alice confirmou troca");
    const { error: e2 } = await sbB.from("matches").update({ confirmed_by_b: true }).eq("id", matchId);
    if (e2) fail("Bob confirma troca", e2);
    else ok("Bob confirmou troca");
  }

  // 13. VERIFICA STATUS COMPLETED (trigger automático)
  if (matchId) {
    const { data } = await sbA.from("matches").select("status, confirmed_by_a, confirmed_by_b").eq("id", matchId).single();
    if (data?.status === "completed") ok(`Troca CONCLUÍDA via trigger (status=${data.status})`);
    else fail(`Trigger de completion falhou (status=${data?.status}, a=${data?.confirmed_by_a}, b=${data?.confirmed_by_b})`);
  }

  // 14. AVALIAÇÃO MÚTUA
  if (matchId) {
    const { error: e1 } = await sbA
      .from("ratings")
      .insert({ match_id: matchId, rater_id: aId, rated_id: bId, score: 5, comment: "Excelente!" });
    if (e1) fail("Rating Alice -> Bob", e1);
    else ok("Rating Alice -> Bob");
    const { error: e2 } = await sbB
      .from("ratings")
      .insert({ match_id: matchId, rater_id: bId, rated_id: aId, score: 5, comment: "Top!" });
    if (e2) fail("Rating Bob -> Alice", e2);
    else ok("Rating Bob -> Alice");
  }

  // 15. VERIFICA ITEM DESATIVAÇÃO PÓS-TROCA
  if (itemA) {
    const { data } = await sbA.from("items").select("status").eq("id", itemA).single();
    if (data?.status === "inactive") ok("Item Alice desativado automaticamente");
    else fail(`Item Alice deveria estar inactive (atual=${data?.status})`);
  }

  // 16. NOTIFICAÇÕES GERADAS
  for (const [sb, name, id] of [[sbA, "Alice", aId], [sbB, "Bob", bId]] as const) {
    const { data, count } = await sb
      .from("notifications")
      .select("type", { count: "exact" })
      .eq("user_id", id);
    ok(`Notificações ${name}: ${count ?? 0} (${(data || []).map((d: any) => d.type).join(",")})`);
  }

  // 17. BLOQUEIO + DESBLOQUEIO
  {
    const { error } = await sbA.from("blocked_users").insert({ blocker_id: aId, blocked_id: bId });
    if (error) fail("Bloqueio Alice -> Bob", error);
    else ok("Bloqueio Alice -> Bob");
    const { error: eu } = await sbA.from("blocked_users").delete().eq("blocker_id", aId).eq("blocked_id", bId);
    if (eu) fail("Desbloqueio", eu);
    else ok("Desbloqueio");
  }

  // 18. DENÚNCIA
  {
    const { error } = await sbA
      .from("reports")
      .insert({ reporter_id: aId, reported_user_id: bId, reason: "spam", description: "Teste QA" });
    if (error) fail("Denúncia", error);
    else ok("Denúncia registrada");
  }

  // 19. CLEANUP
  if (matchId) await sbA.from("ratings").delete().eq("match_id", matchId);
  if (convId) await sbA.from("messages").delete().eq("conversation_id", convId);
  if (convId) await sbA.from("conversations").delete().eq("id", convId);
  if (matchId) await sbA.from("matches").delete().eq("id", matchId);
  if (itemA) await sbA.from("items").delete().eq("id", itemA);
  if (itemB) await sbB.from("items").delete().eq("id", itemB);
  await sbA.from("reports").delete().eq("reporter_id", aId);
  ok("Cleanup concluído");

  return log;
}

run()
  .then((l) => {
    console.log("\n=== RELATÓRIO DO FLUXO E2E ===\n");
    l.forEach((line) => console.log(line));
    const ok = l.filter((x) => x.startsWith("✅")).length;
    const fail = l.filter((x) => x.startsWith("❌")).length;
    console.log(`\n📊 Total: ${ok} OK | ${fail} falhas`);
  })
  .catch((e) => {
    console.error("Fatal:", e);
    process.exit(1);
  });
