import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, Send } from "lucide-react";
import logoHypou from "@/assets/logo-hypou.png";
import { supabase } from "@/integrations/supabase/client";
import NeonButton from "@/components/NeonButton";
import { useToast } from "@/hooks/use-toast";

const RecuperarSenha = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-background text-foreground font-display antialiased px-6">
      <div className="flex flex-col items-center pb-8 w-full max-w-sm">
        <img src={logoHypou} alt="Hypou" className="h-20 w-auto object-contain mb-6" />
        <h1 className="text-3xl font-bold tracking-tight">
          Recuperar <span className="gradient-text">Senha</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-2 text-center">
          {sent
            ? "Enviamos um link para seu e-mail. Verifique sua caixa de entrada."
            : "Digite seu e-mail e enviaremos um link para redefinir sua senha."}
        </p>
      </div>

      {!sent ? (
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
          <NeonButton variant="primary" icon={Send} type="submit" disabled={loading}>
            {loading ? "Enviando..." : "Enviar link"}
          </NeonButton>
        </form>
      ) : (
        <div className="mt-4 w-full max-w-sm">
          <NeonButton variant="outline" icon={ArrowLeft} iconPosition="left" onClick={() => setSent(false)}>
            Tentar outro e-mail
          </NeonButton>
        </div>
      )}

      <div className="pt-8 text-center">
        <Link to="/login" className="text-primary text-sm font-semibold hover:underline flex items-center gap-1 justify-center">
          <ArrowLeft className="h-4 w-4" /> Voltar ao login
        </Link>
      </div>
    </div>
  );
};

export default RecuperarSenha;
