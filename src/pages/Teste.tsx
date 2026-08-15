import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Mail, UserRound } from "lucide-react";
import HypouLogo from "@/components/HypouLogo";
import NeonButton from "@/components/NeonButton";
import { supabase } from "@/integrations/supabase/client";

const Teste = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !privacyAccepted) {
      setError("Preencha seus dados e aceite o aviso de privacidade.");
      return;
    }

    setIsSubmitting(true);
    const { error: registrationError } = await supabase.rpc("register_beta_tester", {
      p_first_name: firstName,
      p_last_name: lastName,
      p_email: email,
      p_privacy_accepted: privacyAccepted,
    });
    setIsSubmitting(false);

    if (registrationError) {
      setError("Não foi possível concluir seu cadastro agora. Tente novamente em instantes.");
      return;
    }

    setSubmitted(true);
  };

  return (
    <main className="dark min-h-[100dvh] bg-background text-foreground flex items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-border/60 bg-card/70 p-6 sm:p-8 shadow-2xl shadow-primary/5">
        <div className="flex justify-center mb-8">
          <HypouLogo size="lg" />
        </div>

        {submitted ? (
          <div className="text-center space-y-4 py-4">
            <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
            <h1 className="text-2xl font-bold">Cadastro recebido!</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Quando o beta estiver disponível, enviaremos o convite do TestFlight para o seu e-mail.
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-7">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary mb-3">Beta fechado</p>
              <h1 className="text-2xl font-bold">Teste o Hypou antes do lançamento</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Deixe seus dados para receber o convite do TestFlight assim que o beta estiver pronto.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium">
                  Nome
                  <span className="relative block">
                    <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      required
                      autoComplete="given-name"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      className="h-12 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm outline-none transition focus:border-primary"
                    />
                  </span>
                </label>
                <label className="space-y-2 text-sm font-medium">
                  Sobrenome
                  <input
                    required
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    className="h-12 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-primary"
                  />
                </label>
              </div>

              <label className="space-y-2 text-sm font-medium block">
                E-mail
                <span className="relative block">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-12 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm outline-none transition focus:border-primary"
                  />
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-xl border border-border/70 bg-background/50 p-3 text-xs leading-relaxed text-muted-foreground">
                <input
                  required
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={(event) => setPrivacyAccepted(event.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-primary"
                />
                <span>
                  Concordo que o Hypou use meus dados para enviar o convite e comunicações do beta, conforme a{" "}
                  <Link to="/privacidade" className="font-semibold text-primary hover:underline">Política de Privacidade</Link>.
                </span>
              </label>

              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

              <NeonButton type="submit" icon={ArrowRight} disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Enviando..." : "Quero participar do beta"}
              </NeonButton>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Já tem acesso? Abra o app em <a className="font-semibold text-primary hover:underline" href="https://app.hypou.app">app.hypou.app</a>.
        </p>
      </section>
    </main>
  );
};

export default Teste;
