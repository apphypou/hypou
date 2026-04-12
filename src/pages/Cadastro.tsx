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
    if (password.length < 8) {
      toast({ title: "Senha deve ter no mínimo 8 caracteres", variant: "destructive" });
      return;
    }
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      toast({ title: "Senha deve conter letras e números", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, "");
    setLoading(false);

    if (error) {
      toast({
        title: "Erro ao criar conta",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // Record terms acceptance
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({ terms_accepted_at: new Date().toISOString() }).eq("user_id", user.id);
      }
      toast({ title: "Conta criada com sucesso!" });
      navigate("/onboarding");
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-background text-foreground font-display antialiased px-6">
      {/* Header */}
      <div className="flex flex-col items-center pb-8 w-full max-w-sm">
        <img src={logoHypou} alt="Hypou" className="h-16 w-auto object-contain mb-6" />
        <h1 className="text-3xl font-bold tracking-tight">
          Criar conta no <span className="gradient-text">Hypou</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-2">
          Comece a trocar seus itens agora
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm mt-4">
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
