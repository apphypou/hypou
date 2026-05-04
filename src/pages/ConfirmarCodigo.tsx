import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, MailCheck } from "lucide-react";
import logoHypou from "@/assets/logo-hypou.png";
import NeonButton from "@/components/NeonButton";
import { useToast } from "@/hooks/use-toast";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const ConfirmarCodigo = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const email = params.get("email") || "";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!email) {
      navigate("/cadastro", { replace: true });
      return;
    }
    // Se já tem sessão ativa (e-mail já confirmado em tentativa anterior), pula direto
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/onboarding", { replace: true });
    });
  }, [email, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleVerify = async (token: string) => {
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "signup",
    });
    setLoading(false);

    if (error) {
      const msg = (error.message || "").toLowerCase();
      const friendly =
        msg.includes("expired") ? "Código expirado. Peça um novo."
        : msg.includes("invalid") ? "Código inválido. Confere os dígitos."
        : error.message;
      toast({ title: "Não rolou", description: friendly, variant: "destructive" });
      setCode("");
      return;
    }

    toast({ title: "E-mail confirmado!" });
    navigate("/onboarding", { replace: true });
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setResending(true);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setResending(false);
    if (error) {
      toast({ title: "Erro ao reenviar", description: error.message, variant: "destructive" });
      return;
    }
    setCooldown(60);
    toast({ title: "Novo código enviado" });
  };

  return (
    <div className="dark relative flex flex-col items-center min-h-screen bg-background text-foreground font-display antialiased px-6 py-10">
      <div className="w-full max-w-sm flex items-center justify-start mb-4">
        <Link to="/cadastro" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
      </div>

      <div className="flex flex-col items-center pb-6 w-full max-w-sm">
        
        <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
          <MailCheck className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-xl font-bold text-foreground text-center">Confirme seu e-mail</h1>
        <p className="text-muted-foreground text-sm mt-2 text-center">
          Enviamos um código de 6 dígitos para
          <br />
          <span className="text-foreground font-medium">{email}</span>
        </p>
      </div>

      <div className="w-full max-w-sm flex flex-col items-center gap-6">
        <InputOTP
          maxLength={6}
          value={code}
          onChange={(val) => {
            setCode(val);
            if (val.length === 6) handleVerify(val);
          }}
          disabled={loading}
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
          disabled={loading || code.length !== 6}
          className="w-full"
        >
          {loading ? "Confirmando..." : "Confirmar"}
        </NeonButton>

        <button
          type="button"
          onClick={handleResend}
          disabled={resending || cooldown > 0}
          className="text-sm text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
        >
          {cooldown > 0
            ? `Reenviar em ${cooldown}s`
            : resending
              ? "Enviando..."
              : "Não recebi o código — reenviar"}
        </button>
      </div>
    </div>
  );
};

export default ConfirmarCodigo;
