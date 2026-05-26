import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Lock, Check, Eye, EyeOff, ArrowLeft, MailCheck } from "lucide-react";
import logoHypou from "@/assets/logo-hypou.png";
import { supabase } from "@/integrations/supabase/client";
import NeonButton from "@/components/NeonButton";
import { useToast } from "@/hooks/use-toast";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const ResetPassword = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Step state
  const [step, setStep] = useState<"code" | "password">("code");
  const [verifiedSession, setVerifiedSession] = useState(false);

  // Code step
  const emailParam = params.get("email") || "";
  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  // Password step
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  // If user arrived via magic link (hash contains recovery tokens), Supabase
  // automatically creates a recovery session. Skip the code step.
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setStep("password");
      setVerifiedSession(true);
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setStep("password");
        setVerifiedSession(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleVerify = async (token: string) => {
    if (verifying) return;
    if (!email) {
      toast({ title: "Informe seu e-mail", variant: "destructive" });
      return;
    }
    setVerifying(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "recovery",
    });
    setVerifying(false);
    if (error) {
      const msg = (error.message || "").toLowerCase();
      const friendly =
        msg.includes("expired") ? "Código expirado. Solicite um novo."
        : msg.includes("invalid") ? "Código inválido. Confere os dígitos."
        : error.message;
      toast({ title: "Não rolou", description: friendly, variant: "destructive" });
      setCode("");
      return;
    }
    setVerifiedSession(true);
    setStep("password");
  };

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
      const msg = (error.message || "").toLowerCase();
      const friendly =
        msg.includes("different from the old password") || msg.includes("same as the old password") || msg.includes("same password")
          ? "A nova senha precisa ser diferente da atual."
        : msg.includes("at least") || msg.includes("weak") || msg.includes("short")
          ? "Senha muito curta (mín. 6 caracteres)."
        : msg.includes("rate limit")
          ? "Muitas tentativas, aguarde um momento."
        : "Não foi possível atualizar a senha. Tente novamente.";
      toast({ title: "Erro", description: friendly, variant: "destructive" });
    } else {
      toast({ title: "Senha atualizada com sucesso!" });
      navigate("/explorar");
    }
  };

  if (step === "code" && !verifiedSession) {
    return (
      <div className="dark relative flex flex-col items-center min-h-screen bg-background text-foreground font-display antialiased px-6 py-10">
        <div className="w-full max-w-sm flex items-center justify-start mb-4">
          <Link to="/recuperar-senha" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>

        <div className="flex flex-col items-center pb-6 w-full max-w-sm">
          <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
            <MailCheck className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground text-center">Código de recuperação</h1>
          <p className="text-muted-foreground text-sm mt-2 text-center">
            Digite o código de 6 dígitos que enviamos pro seu e-mail.
          </p>
        </div>

        <div className="w-full max-w-sm flex flex-col items-center gap-6">
          {!emailParam && (
            <input
              type="email"
              placeholder="Seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-14 px-5 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          )}

          <InputOTP
            maxLength={6}
            value={code}
            onChange={(val) => {
              setCode(val);
              if (val.length === 6) handleVerify(val);
            }}
            disabled={verifying}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>

          <NeonButton
            onClick={() => handleVerify(code)}
            disabled={verifying || code.length !== 6}
            className="w-full"
          >
            {verifying ? "Verificando..." : "Confirmar"}
          </NeonButton>

          <Link to="/recuperar-senha" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Não recebi o código — reenviar
          </Link>
        </div>
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
