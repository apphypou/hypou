import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { action, email, password, display_name } = await req.json();

  if (action === "create_confirmed") {
    // Create a user with email confirmed
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name },
    });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    return new Response(JSON.stringify({ user_id: data.user.id }));
  }

  if (action === "confirm") {
    // Find user by email and confirm
    const { data: { users }, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
    if (listErr) return new Response(JSON.stringify({ error: listErr.message }), { status: 400 });
    const user = users.find((u: any) => u.email === email);
    if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    
    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, { email_confirm: true });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    return new Response(JSON.stringify({ user_id: user.id, confirmed: true }));
  }

  return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400 });
});
