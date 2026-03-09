import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, User, ArrowRight, CheckCircle } from "lucide-react";
import logoHypou from "@/assets/logo-hypou.png";
import { useAuth } from "@/hooks/useAuth";
import NeonButton from "@/components/NeonButton";
import { useToast } from "@/hooks/use-toast";

const Cadastro = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.length > 100) {
      toast({ title: "Nome muito longo (máx. 100 caracteres)", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Senha deve ter no mínimo 6 caracteres", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, name);
    setLoading(false);

    if (error) {
      toast({
        title: "Erro ao criar conta",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Conta criada com sucesso!" });
      navigate("/explorar");
    }
  };

  if (emailSent) {
    return (
      <div className="relative flex flex-col items-center justify-center min-h-screen bg-background text-foreground font-display antialiased px-6">
        <div className="flex flex-col items-center w-full max-w-sm text-center">
          <div className="h-20 w-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mb-6">
            <CheckCircle className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-3">
            Verifique seu <span className="gradient-text">e-mail</span>
          </h1>
          <p className="text-muted-foreground text-sm mb-2">
            Enviamos um link de confirmação para:
          </p>
          <p className="text-foreground font-semibold text-sm mb-6 break-all">{email}</p>
          <p className="text-muted-foreground text-xs mb-8 leading-relaxed">
            Clique no link enviado para ativar sua conta. Verifique também a pasta de spam.
          </p>
          <NeonButton variant="primary" icon={ArrowRight} onClick={() => navigate("/login")}>
            Ir para o Login
          </NeonButton>
          <button
            onClick={() => setEmailSent(false)}
            className="text-muted-foreground text-xs mt-4 hover:text-primary transition-colors"
          >
            Tentar com outro e-mail
          </button>
        </div>
      </div>
    );
  }

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
          <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Seu nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
            className="w-full h-14 pl-12 pr-5 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>

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
            type="password"
            placeholder="Crie uma senha (mín. 6 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full h-14 pl-12 pr-5 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>

        <NeonButton
          variant="primary"
          icon={ArrowRight}
          type="submit"
          disabled={loading}
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
