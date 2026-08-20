import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { HYPOU_LOGO as logoHypou } from "@/config/brand";
import authBackground from "@/assets/auth-marketplace-bg.webp";
import NeonButton from "@/components/NeonButton";
import { useAuth } from "@/hooks/useAuth";
import { isAdminPath } from "@/lib/domainRouting";
import { supabase } from "@/integrations/supabase/client";
import { getErrorMessage } from "@/lib/utils";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setError(getErrorMessage(signInError, "Não foi possível entrar no painel."));
      setIsSubmitting(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    const { data: role, error: roleError } = user
      ? await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle()
      : { data: null, error: null };

    if (roleError || !role) {
      await signOut();
      setError("Este login é reservado a administradores do Hypou.");
      setIsSubmitting(false);
      return;
    }

    const redirect = new URLSearchParams(location.search).get("redirect");
    navigate(redirect && isAdminPath(redirect) ? redirect : "/admin", { replace: true });
  };

  return (
    <main className="dark relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#020711] p-6 font-display text-white">
      <img src={authBackground} alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center" />
      <div className="pointer-events-none absolute inset-0 bg-[#020711]/85" />
      <section className="relative w-full max-w-md rounded-[28px] border border-white/15 bg-[rgba(11,17,29,0.88)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-8">
        <img src={logoHypou} alt="Hypou" className="mx-auto w-40 drop-shadow-[0_0_24px_rgba(13,214,224,0.18)]" />
        <div className="mt-8 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-primary/30 bg-primary/10"><ShieldCheck className="h-5 w-5 text-primary" /></div>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-primary">Acesso restrito</p>
          <h1 className="mt-2 text-2xl font-extrabold">Painel administrativo</h1>
          <p className="mt-2 text-sm leading-relaxed text-white/60">Use as credenciais de administrador do Hypou.</p>
        </div>

        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
          <label className="relative block">
            <span className="sr-only">E-mail administrativo</span>
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
            <input required type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="E-mail administrativo" className="h-14 w-full rounded-2xl border border-white/15 bg-black/20 pl-11 pr-4 text-white outline-none transition placeholder:text-white/35 focus:border-primary/70 focus:ring-2 focus:ring-primary/20" />
          </label>
          <label className="relative block">
            <span className="sr-only">Senha</span>
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
            <input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Senha" className="h-14 w-full rounded-2xl border border-white/15 bg-black/20 pl-11 pr-4 text-white outline-none transition placeholder:text-white/35 focus:border-primary/70 focus:ring-2 focus:ring-primary/20" />
          </label>
          {error && <p role="alert" className="text-sm text-[#ff7bbd]">{error}</p>}
          <NeonButton type="submit" disabled={isSubmitting} className="border border-white/25 bg-[linear-gradient(90deg,#ff1493_0%,#7c3aed_52%,#11d7e5_100%)] text-white shadow-[0_0_26px_rgba(21,198,231,0.28)]">
            {isSubmitting ? "Verificando..." : "Entrar no painel"}
          </NeonButton>
        </form>
      </section>
    </main>
  );
};

export default AdminLogin;
