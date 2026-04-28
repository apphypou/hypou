import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import NeonButton from "@/components/NeonButton";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import AuthScreen from "@/components/auth/AuthScreen";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";
import AuthInput from "@/components/auth/AuthInput";
import PasswordStrengthMeter from "@/components/auth/PasswordStrengthMeter";

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
      if (newUser) {
        await supabase.from("profiles").update({ terms_accepted_at: new Date().toISOString() }).eq("user_id", newUser.id);
      }
      toast({ title: "Conta criada com sucesso!" });
      navigate("/onboarding");
    }
  };

  return (
    <AuthScreen
      title={
        <>
          Crie sua conta no <span className="gradient-text">Hypou</span>
        </>
      }
      subtitle="Comece a trocar seus itens em segundos"
      backTo="/login"
      footer={
        <>
          Já tem conta?{" "}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      {/* Social first */}
      <SocialAuthButtons actionLabel="Criar conta com" redirectTo={`${window.location.origin}/onboarding`} />

      {/* Email form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full mt-6">
        <AuthInput
          icon={Mail}
          type="email"
          placeholder="Seu e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div className="flex flex-col gap-2">
          <AuthInput
            icon={Lock}
            type={showPassword ? "text" : "password"}
            placeholder="Senha (mín. 8 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            rightSlot={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            }
          />
          <PasswordStrengthMeter password={password} />
        </div>

        {/* Terms checkbox */}
        <div className="flex items-start gap-3 px-1 mt-1">
          <Checkbox
            id="terms"
            checked={termsAccepted}
            onCheckedChange={(checked) => setTermsAccepted(checked === true)}
            className="mt-0.5 border-foreground/30 data-[state=checked]:border-primary"
          />
          <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
            Li e aceito os{" "}
            <Link to="/termos" className="text-foreground font-semibold underline-offset-2 hover:underline" onClick={(e) => e.stopPropagation()}>
              Termos de Uso
            </Link>{" "}
            e a{" "}
            <Link to="/privacidade" className="text-foreground font-semibold underline-offset-2 hover:underline" onClick={(e) => e.stopPropagation()}>
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
    </AuthScreen>
  );
};

export default Cadastro;
