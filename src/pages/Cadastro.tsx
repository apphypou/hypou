import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import logoHypou from "@/assets/logo-hypou.png";
import { useAuth } from "@/hooks/useAuth";
import NeonButton from "@/components/NeonButton";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "@/components/ui/separator";

const Cadastro = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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
    // Block reserved TLDs early — Supabase rejects them with a generic error
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
    const { error, user: newUser } = await signUp(email, password, "");
    setLoading(false);

    if (error) {
      const msg = (error.message || "").toLowerCase();
      const friendly = msg.includes("rate") || msg.includes("limit")
        ? "Muitos cadastros nesta rede agora. Tente novamente em alguns minutos ou troque de conexão."
        : msg.includes("already") || msg.includes("registered")
          ? "Este e-mail já tem conta. Faça login."
          : error.message;
      toast({
        title: "Erro ao criar conta",
        description: friendly,
        variant: "destructive",
      });
    } else {
      // Record terms acceptance using the user returned from signUp
      if (newUser) {
        await supabase.from("profiles").update({ terms_accepted_at: new Date().toISOString() }).eq("user_id", newUser.id);
      }
      toast({ title: "Conta criada com sucesso!" });
      navigate("/onboarding");
    }
  };

  return (
    <div className="dark relative flex flex-col items-center justify-center min-h-screen bg-background text-foreground font-display antialiased px-6">
      {/* Header */}
      <div className="flex flex-col items-center pb-8 w-full max-w-sm">
        <h1 className="text-3xl font-bold tracking-tight">
          Crie sua conta no <span className="gradient-text">Hypou</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-2">
          Comece a trocar seus itens agora
        </p>
      </div>

      {/* Social Sign Up */}
      <div className="flex flex-col gap-3 w-full max-w-sm mt-4">
        <button
          type="button"
          onClick={async () => {
            await supabase.auth.signInWithOAuth({
              provider: "google",
              options: { redirectTo: `${window.location.origin}/onboarding` },
            });
          }}
          className="flex items-center justify-center gap-3 w-full h-14 rounded-xl bg-secondary border border-border text-foreground font-medium hover:bg-accent transition-all"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Criar conta com Google
        </button>

        <button
          type="button"
          onClick={async () => {
            await supabase.auth.signInWithOAuth({
              provider: "apple",
              options: { redirectTo: `${window.location.origin}/onboarding` },
            });
          }}
          className="flex items-center justify-center gap-3 w-full h-14 rounded-xl bg-secondary border border-border text-foreground font-medium hover:bg-accent transition-all"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
          </svg>
          Criar conta com Apple
        </button>

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">ou com e-mail</span>
          <Separator className="flex-1" />
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm mt-3">
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="email"
            placeholder="Seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full h-14 pl-12 pr-5 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Crie uma senha (mín. 8 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full h-14 pl-12 pr-12 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        {/* Terms checkbox */}
        <div className="flex items-start gap-3 px-1">
          <Checkbox
            id="terms"
            checked={termsAccepted}
            onCheckedChange={(checked) => setTermsAccepted(checked === true)}
            className="mt-0.5"
          />
          <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
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
          className="mt-2"
        >
          {loading ? "Criando conta..." : "Criar conta"}
        </NeonButton>
      </form>

      {/* Footer */}
      <div className="pt-8 text-center">
        <p className="text-muted-foreground text-sm">
          Já tem conta?{" "}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Cadastro;
