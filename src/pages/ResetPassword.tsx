import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Check, Eye, EyeOff } from "lucide-react";
import logoHypou from "@/assets/logo-hypou.png";
import { supabase } from "@/integrations/supabase/client";
import NeonButton from "@/components/NeonButton";
import { useToast } from "@/hooks/use-toast";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [valid, setValid] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setValid(true);
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setValid(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast({ title: "As senhas não coincidem", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "A senha deve ter no mínimo 6 caracteres", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Senha atualizada com sucesso!" });
      navigate("/explorar");
    }
  };

  if (!valid) {
    return (
      <div className="dark flex flex-col items-center justify-center min-h-screen bg-background text-foreground px-6">
        <p className="text-muted-foreground text-center">
          Link inválido ou expirado. Solicite um novo link de recuperação.
        </p>
        <button onClick={() => navigate("/recuperar-senha")} className="text-primary mt-4 font-semibold hover:underline">
          Solicitar novo link
        </button>
      </div>
    );
  }

  return (
    <div className="dark relative flex flex-col items-center justify-center min-h-screen bg-background text-foreground font-display antialiased px-6">
      <div className="flex flex-col items-center pb-8 w-full max-w-sm">
        <img src={logoHypou} alt="Hypou" className="h-20 w-auto object-contain mb-6" />
        <h1 className="text-3xl font-bold tracking-tight">
          Nova <span className="gradient-text">Senha</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-2">Digite sua nova senha abaixo</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm mt-4">
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Nova senha (mín. 6 caracteres)"
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
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type={showConfirm ? "text" : "password"}
            placeholder="Confirmar nova senha"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={6}
            className="w-full h-14 pl-12 pr-12 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        <NeonButton variant="primary" icon={Check} type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar nova senha"}
        </NeonButton>
      </form>
    </div>
  );
};

export default ResetPassword;
