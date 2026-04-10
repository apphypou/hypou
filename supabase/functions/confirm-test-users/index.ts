import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const body = await req.json();
  const { action } = body;

  if (action === "confirm") {
    const { email } = body;
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const user = users.find((u: any) => u.email === email);
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });
    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, { email_confirm: true });
    if (error) return Response.json({ error: error.message }, { status: 400 });
    return Response.json({ user_id: user.id, confirmed: true });
  }

  if (action === "create_confirmed") {
    const { email, password, display_name } = body;
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { display_name },
    });
    if (error) return Response.json({ error: error.message }, { status: 400 });
    return Response.json({ user_id: data.user.id });
  }

  if (action === "complete_onboarding") {
    const { user_id, location } = body;
    const { error } = await supabaseAdmin.from("profiles")
      .update({ onboarding_completed: true, location: location || "São Paulo, SP" })
      .eq("user_id", user_id);
    if (error) return Response.json({ error: error.message }, { status: 400 });
    // Add some categories
    await supabaseAdmin.from("user_categories").insert([
      { user_id, category: "Eletrônicos" },
      { user_id, category: "Videogames" },
    ]);
    return Response.json({ ok: true });
  }

  if (action === "create_item") {
    const { user_id, name, category, market_value, condition, location, description } = body;
    const { data, error } = await supabaseAdmin.from("items").insert({
      user_id, name, category,
      market_value: market_value || 50000,
      condition: condition || "used",
      location: location || "São Paulo, SP",
      description: description || "Item de teste",
      margin_up: 15, margin_down: 10,
    }).select("id").single();
    if (error) return Response.json({ error: error.message }, { status: 400 });
    
    // Add a placeholder image
    await supabaseAdmin.from("item_images").insert({
      item_id: data.id,
      image_url: `https://placehold.co/600x400/1a1a1a/00E5CC?text=${encodeURIComponent(name)}`,
      position: 0,
    });
    return Response.json({ item_id: data.id });
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
});
