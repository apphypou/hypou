import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, LogIn, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import NeonButton from "@/components/NeonButton";
import { useToast } from "@/hooks/use-toast";
import AuthScreen from "@/components/auth/AuthScreen";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";
import AuthInput from "@/components/auth/AuthInput";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      let description = error.message;
      if (error.message?.includes("Email not confirmed")) {
        description = "E-mail ainda não confirmado. Verifique sua caixa de entrada.";
      } else if (error.message?.includes("Invalid login credentials")) {
        description = "E-mail ou senha incorretos.";
      }
      toast({
        title: "Erro ao entrar",
        description,
        variant: "destructive",
      });
    } else {
      navigate("/explorar");
    }
  };

  return (
    <AuthScreen
      title={
        <>
          Bem-vindo de <span className="gradient-text">volta</span>
        </>
      }
      subtitle="Acesse sua conta e continue trocando"
      backTo="/"
      footer={
        <>
          Ainda não tem conta?{" "}
          <Link to="/cadastro" className="text-primary font-semibold hover:underline">
            Criar conta
          </Link>
        </>
      }
    >
      {/* Social first — mesmo padrão do Cadastro */}
      <SocialAuthButtons actionLabel="Entrar com" redirectTo={`${window.location.origin}/explorar`} />

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

        <AuthInput
          icon={Lock}
          type={showPassword ? "text" : "password"}
          placeholder="Sua senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
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

        <div className="flex justify-end -mt-1">
          <Link
            to="/recuperar-senha"
            className="text-xs text-primary hover:underline font-semibold"
          >
            Esqueci minha senha
          </Link>
        </div>

        <NeonButton
          variant="primary"
          icon={LogIn}
          type="submit"
          disabled={loading}
          className="mt-2"
        >
          {loading ? "Entrando..." : "Entrar"}
        </NeonButton>
      </form>
    </AuthScreen>
  );
};

export default Login;
