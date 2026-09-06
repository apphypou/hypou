import { useEffect, useState, type ReactNode } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type GateState = "checking" | "setup" | "challenge" | "verified";

export default function AdminMfaGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GateState>("checking");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data: aal, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalError) {
        setError("Não foi possível verificar a autenticação em duas etapas.");
        setState("setup");
        return;
      }
      if (aal.currentLevel === "aal2") {
        setState("verified");
        return;
      }
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const verifiedFactor = factors?.totp.find((factor) => factor.status === "verified");
      if (verifiedFactor) {
        setFactorId(verifiedFactor.id);
        setState("challenge");
      } else {
        setState("setup");
      }
    })();
  }, []);

  const enroll = async () => {
    setBusy(true);
    setError("");
    const { data, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Painel Hypou",
    });
    setBusy(false);
    if (enrollError) {
      setError(enrollError.message);
      return;
    }
    setFactorId(data.id);
    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
    setState("challenge");
  };

  const verify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!factorId || !/^\d{6}$/.test(code)) return;
    setBusy(true);
    setError("");
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
    setBusy(false);
    if (verifyError) {
      setError("Código inválido ou expirado.");
      return;
    }
    setCode("");
    setState("verified");
  };

  if (state === "verified") return <>{children}</>;
  if (state === "checking") {
    return <div className="flex h-screen items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <section className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-xl">
        <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-4 text-xl font-bold">Verificação em duas etapas</h1>
        {state === "setup" ? (
          <>
            <p className="mt-2 text-sm text-muted-foreground">O painel exige um aplicativo autenticador para proteger ações administrativas.</p>
            <Button className="mt-5 w-full" disabled={busy} onClick={enroll}>
              {busy ? "Configurando..." : "Configurar autenticador"}
            </Button>
          </>
        ) : (
          <form className="mt-5 space-y-4" onSubmit={verify}>
            {qrCode && <img src={qrCode} alt="QR Code para configurar o autenticador" className="mx-auto h-48 w-48 rounded-lg bg-white p-2" />}
            {secret && <p className="break-all font-mono text-xs text-muted-foreground">Chave: {secret}</p>}
            <Input inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9]{6}" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} placeholder="Código de 6 dígitos" aria-label="Código do autenticador" />
            <Button className="w-full" type="submit" disabled={busy || code.length !== 6}>
              {busy ? "Verificando..." : "Verificar e entrar"}
            </Button>
          </form>
        )}
        {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
      </section>
    </div>
  );
}
