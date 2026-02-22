import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Diamond, Mail, Lock, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import NeonButton from "@/components/NeonButton";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      toast({
        title: "Erro ao entrar",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/explorar");
    }
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-background text-foreground font-display antialiased">
      {/* Header */}
      <div className="flex flex-col items-center pt-16 pb-8 px-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 border border-primary/30 backdrop-blur-md mb-6">
          <Diamond className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Entrar no <span className="gradient-text">Hypou</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-2">
          Acesse sua conta e continue trocando
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 mt-4">
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
            placeholder="Sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full h-14 pl-12 pr-5 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>

        <div className="flex justify-end">
          <Link
            to="/recuperar-senha"
            className="text-xs text-primary hover:underline"
          >
            Esqueci minha senha
          </Link>
        </div>

        <NeonButton
          variant="primary"
          icon={LogIn}
          type="submit"
          disabled={loading}
        >
          {loading ? "Entrando..." : "Entrar"}
        </NeonButton>
      </form>

      {/* Footer */}
      <div className="mt-auto pb-10 pt-8 text-center">
        <p className="text-muted-foreground text-sm">
          Ainda não tem conta?{" "}
          <Link to="/cadastro" className="text-primary font-semibold hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
