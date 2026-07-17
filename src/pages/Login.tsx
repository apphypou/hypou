import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, LogIn, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import NeonButton from "@/components/NeonButton";
import AuthShell from "@/components/auth/AuthShell";
import AuthSocialButtons from "@/components/auth/AuthSocialButtons";
import { useToast } from "@/hooks/use-toast";
import { startOAuthSignIn } from "@/lib/oauth";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "apple" | null>(null);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      let description = error.message;
      if (error.message?.includes("Email not confirmed")) {
        description = "E-mail ainda não confirmado. Verifique sua caixa de entrada.";
        toast({
          title: "Confirme seu e-mail",
          description: "Digite o código enviado para o seu e-mail.",
        });
        navigate(`/confirmar-codigo?email=${encodeURIComponent(email.trim())}`);
        return;
      } else if (error.message?.includes("Invalid login credentials")) {
        description = "E-mail ou senha incorretos.";
      }
      toast({
        title: "Erro ao entrar",
        description,
        variant: "destructive",
      });
    } else {
      const params = new URLSearchParams(window.location.search);
      navigate(params.get("redirect") || "/explorar", { replace: true });
    }
  };

  const handleSocialLogin = async (provider: "google" | "apple") => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect") || "/explorar";
    localStorage.setItem("postLoginRedirect", redirect);
    setSocialLoading(provider);

    const { error } = await startOAuthSignIn(provider, "/explorar").catch((error) => ({
      error: error instanceof Error ? error : new Error("Falha ao iniciar login social."),
    }));

    setSocialLoading(null);
    if (error) {
      toast({
        title: "Erro ao entrar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <AuthShell description="Transforme objetos parados em novas oportunidades.">
      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3.5">
        <div className="relative">
          <label htmlFor="login-email" className="sr-only">Seu e-mail</label>
          <Mail className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-[#ff2d95]" />
          <input
            id="login-email"
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
          <label htmlFor="login-password" className="sr-only">Sua senha</label>
          <Lock className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-[#ff2d95]" />
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            placeholder="Sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="current-password"
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

        <div className="flex justify-end">
          <Link to="/recuperar-senha" className="text-xs font-medium text-primary hover:underline">
            Esqueci minha senha
          </Link>
        </div>

        <NeonButton
          variant="primary"
          icon={LogIn}
          type="submit"
          disabled={loading}
          className="border border-white/25 bg-[linear-gradient(90deg,#ff1493_0%,#7c3aed_52%,#11d7e5_100%)] text-white shadow-[0_0_26px_rgba(21,198,231,0.28)]"
        >
          {loading ? "Entrando..." : "Entrar"}
        </NeonButton>
      </form>

      <AuthSocialButtons loadingProvider={socialLoading} mode="login" onProvider={(provider) => void handleSocialLogin(provider)} />

      <div className="text-center">
        <p className="text-sm text-white/58">
          Ainda não tem conta?{" "}
          <Link to="/cadastro" className="font-semibold text-[#ff3a9d] hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </AuthShell>
  );
};

export default Login;
