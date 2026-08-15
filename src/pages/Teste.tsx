import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Mail, MessageCircle, ShieldCheck, Sparkles, UserRound, Users } from "lucide-react";
import logoHypou from "@/assets/logo-hypou.png";
import authBackground from "@/assets/auth-marketplace-bg.webp";
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
    <main className="dark relative min-h-[100dvh] overflow-hidden bg-[#020711] font-display text-white">
      <img
        src={authBackground}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(2,7,17,0.9),rgba(2,7,17,0.56),rgba(2,7,17,0.88))]" />
      <div className="pointer-events-none absolute -right-24 top-1/4 h-80 w-80 rounded-full bg-primary/20 blur-[120px]" />
      <div className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-pink/15 blur-[120px]" />

      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <section className="max-w-xl text-center lg:text-left">
            <img
              src={logoHypou}
              alt="Hypou"
              className="mx-auto mb-8 w-36 drop-shadow-[0_0_24px_rgba(13,214,224,0.18)] sm:w-44 lg:mx-0 lg:mb-10"
            />
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Beta fechado · iOS
            </div>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">
              Ajude a construir o <span className="bg-[linear-gradient(90deg,#ff1493_0%,#7c3aed_52%,#11d7e5_100%)] bg-clip-text text-transparent">futuro das trocas</span>.
            </h1>
            <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-white/65 sm:text-lg lg:mx-0">
              Entre para o grupo seleto que vai testar o Hypou antes do lançamento e moldar cada detalhe da experiência.
            </p>
            <div className="mt-8 hidden flex-wrap gap-x-6 gap-y-3 text-sm text-white/70 lg:flex">
              <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Convite individual</span>
              <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Acesso antecipado</span>
              <span className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Comunidade fundadora</span>
            </div>
          </section>

          <section className="mx-auto w-full max-w-[460px] rounded-[28px] border border-white/15 bg-[rgba(11,17,29,0.8)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur-2xl sm:p-7">
            {submitted ? (
              <div className="py-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-primary">Você está na lista</p>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight">Cadastro recebido.</h2>
                <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-white/60">
                  Entre no grupo para acompanhar o beta e enviar seu feedback. O convite do TestFlight chegará no seu e-mail.
                </p>
                <a
                  href="https://chat.whatsapp.com/KWTaRcCEzHcHw5xs0b9ilO"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#25D366]/50 bg-[#25D366]/15 px-5 text-sm font-bold text-white transition hover:bg-[#25D366]/25"
                >
                  <MessageCircle className="h-4 w-4" /> Entrar no grupo do WhatsApp
                </a>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Acesso antecipado</p>
                  <h2 className="mt-2 text-2xl font-extrabold tracking-tight">Reserve seu convite.</h2>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">São seus dados que usaremos para enviar o acesso ao beta.</p>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-sm font-medium text-white/85">
                      Nome
                      <span className="relative mt-2 block">
                        <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                        <input
                          required
                          autoComplete="given-name"
                          value={firstName}
                          onChange={(event) => setFirstName(event.target.value)}
                          className="h-14 w-full rounded-2xl border border-white/15 bg-black/20 pl-11 pr-4 text-white shadow-[0_12px_32px_rgba(0,0,0,0.16)] outline-none transition placeholder:text-white/35 focus:border-primary/70 focus:ring-2 focus:ring-primary/20"
                        />
                      </span>
                    </label>
                    <label className="text-sm font-medium text-white/85">
                      Sobrenome
                      <input
                        required
                        autoComplete="family-name"
                        value={lastName}
                        onChange={(event) => setLastName(event.target.value)}
                        className="mt-2 h-14 w-full rounded-2xl border border-white/15 bg-black/20 px-4 text-white shadow-[0_12px_32px_rgba(0,0,0,0.16)] outline-none transition placeholder:text-white/35 focus:border-primary/70 focus:ring-2 focus:ring-primary/20"
                      />
                    </label>
                  </div>

                  <label className="block text-sm font-medium text-white/85">
                    E-mail
                    <span className="relative mt-2 block">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                      <input
                        required
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="h-14 w-full rounded-2xl border border-white/15 bg-black/20 pl-11 pr-4 text-white shadow-[0_12px_32px_rgba(0,0,0,0.16)] outline-none transition placeholder:text-white/35 focus:border-primary/70 focus:ring-2 focus:ring-primary/20"
                      />
                    </span>
                  </label>

                  <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-3.5 text-xs leading-relaxed text-white/58">
                    <input
                      required
                      type="checkbox"
                      checked={privacyAccepted}
                      onChange={(event) => setPrivacyAccepted(event.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                    />
                    <span>
                      Concordo que o Hypou use meus dados para enviar o convite e comunicações do beta, conforme a{" "}
                      <Link to="/privacidade" className="font-semibold text-primary hover:underline">Política de Privacidade</Link>.
                    </span>
                  </label>

                  {error && <p role="alert" className="text-sm text-[#ff7bbd]">{error}</p>}

                  <NeonButton
                    type="submit"
                    icon={ArrowRight}
                    disabled={isSubmitting}
                    className="border border-white/25 bg-[linear-gradient(90deg,#ff1493_0%,#7c3aed_52%,#11d7e5_100%)] text-white shadow-[0_0_26px_rgba(21,198,231,0.28)]"
                  >
                    {isSubmitting ? "Enviando..." : "Quero participar do beta"}
                  </NeonButton>
                </form>
              </>
            )}

            <p className="mt-5 text-center text-xs text-white/45">
              Convites enviados exclusivamente pelo TestFlight.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
};

export default Teste;
