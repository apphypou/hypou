import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import NeonButton from "@/components/NeonButton";
import AuthShell from "@/components/auth/AuthShell";
import AuthSocialButtons from "@/components/auth/AuthSocialButtons";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { startOAuthSignIn } from "@/lib/oauth";

const Cadastro = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "apple" | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      toast({ title: "Aceite os termos de uso para continuar", variant: "destructive" });
      return;
    }
    const reservedTlds = /\.(test|example|invalid|localhost)$/i;
    if (reservedTlds.test(email.trim())) {
      toast({
        title: "E-mail inválido",
        description: "Use um e-mail real (gmail, outlook, etc.). Domínios .test/.example não são aceitos.",
        variant: "destructive",
      });
      return;
    }
    if (password.length < 8) {
      toast({ title: "Senha deve ter no mínimo 8 caracteres", variant: "destructive" });
      return;
    }
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      toast({ title: "Senha deve conter letras e números", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error, user: newUser, emailAlreadyRegistered } = await signUp(email, password, "");

    if (error || emailAlreadyRegistered) {
      const msg = (error?.message || "").toLowerCase();
      const friendly = emailAlreadyRegistered
        ? "Este e-mail já tem conta. Faça login."
        : msg.includes("rate") || msg.includes("limit")
        ? "Muitos cadastros nesta rede agora. Tente novamente em alguns minutos ou troque de conexão."
        : msg.includes("already") || msg.includes("registered")
          ? "Este e-mail já tem conta. Faça login."
          : error?.message || "Não foi possível criar a conta.";
      setLoading(false);
      toast({
        title: "Erro ao criar conta",
        description: friendly,
        variant: "destructive",
      });
    } else {
      if (newUser) {
        await supabase.from("profiles").update({ terms_accepted_at: new Date().toISOString() }).eq("user_id", newUser.id);
      }
      // Verifica se a sessão já foi criada (e-mail confirmation desativado).
      // Caso contrário, exige confirmação por código enviado ao e-mail.
      const { data: sess } = await supabase.auth.getSession();
      setLoading(false);
      if (sess.session) {
        toast({ title: "Conta criada!" });
        navigate("/onboarding", { replace: true });
      } else {
        toast({ title: "Conta criada!", description: "Confirme o código enviado por e-mail." });
        navigate(`/confirmar-codigo?email=${encodeURIComponent(email)}`);
      }
    }
  };

  const handleSocialSignup = async (provider: "google" | "apple") => {
    localStorage.setItem("postLoginRedirect", "/onboarding");
    setSocialLoading(provider);

    const { error } = await startOAuthSignIn(provider, "/onboarding").catch((error) => ({
      error: error instanceof Error ? error : new Error("Falha ao iniciar login social."),
    }));

    setSocialLoading(null);
    if (error) {
      toast({
        title: "Erro ao criar conta",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <AuthShell compact description="Crie sua conta e transforme objetos parados em novas oportunidades.">
      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3.5">
        <div className="relative">
          <label htmlFor="signup-email" className="sr-only">Seu e-mail</label>
          <Mail className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-[#ff2d95]" />
          <input
            id="signup-email"
            type="email"
            placeholder="Seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="h-14 w-full rounded-2xl border border-white/15 bg-[rgba(11,17,29,0.78)] pl-12 pr-5 text-white shadow-[0_12px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl transition-all placeholder:text-white/45 focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/25"
          />
        </div>

        <div className="relative">
          <label htmlFor="signup-password" className="sr-only">Senha</label>
          <Lock className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-[#ff2d95]" />
          <input
            id="signup-password"
            type={showPassword ? "text" : "password"}
            placeholder="Senha (mín. 8 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="h-14 w-full rounded-2xl border border-white/15 bg-[rgba(11,17,29,0.78)] pl-12 pr-12 text-white shadow-[0_12px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl transition-all placeholder:text-white/45 focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/25"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#ff2d95] transition-colors hover:text-white"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        <div className="flex items-start gap-3 px-1">
          <Checkbox
            id="terms"
            checked={termsAccepted}
            onCheckedChange={(checked) => setTermsAccepted(checked === true)}
            className="mt-0.5 border-white/30 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
          />
          <label htmlFor="terms" className="cursor-pointer text-xs leading-relaxed text-white/58">
            Li e aceito os{" "}
            <Link to="/termos" className="text-primary font-semibold hover:underline" onClick={(e) => e.stopPropagation()}>
              Termos de Uso
            </Link>{" "}
            e a{" "}
            <Link to="/privacidade" className="text-primary font-semibold hover:underline" onClick={(e) => e.stopPropagation()}>
              Política de Privacidade
            </Link>
          </label>
        </div>

        <NeonButton
          variant="primary"
          icon={ArrowRight}
          type="submit"
          disabled={loading || !termsAccepted}
          className="border border-white/25 bg-[linear-gradient(90deg,#ff1493_0%,#7c3aed_52%,#11d7e5_100%)] text-white shadow-[0_0_26px_rgba(21,198,231,0.28)]"
        >
          {loading ? "Criando conta..." : "Criar conta"}
        </NeonButton>
      </form>

      <AuthSocialButtons loadingProvider={socialLoading} mode="signup" onProvider={(provider) => void handleSocialSignup(provider)} />

      <div className="text-center">
        <p className="text-sm text-white/58">
          Já tem conta?{" "}
          <Link to="/login" className="font-semibold text-[#ff3a9d] hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </AuthShell>
  );
};

export default Cadastro;
