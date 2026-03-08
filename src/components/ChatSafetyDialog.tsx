import { useState } from "react";
import { Shield, MapPin, AlertTriangle, UserCheck, Ban } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

interface ChatSafetyDialogProps {
  open: boolean;
  userId: string;
  onAccepted: () => void;
}

const tips = [
  { icon: Ban, text: "Nunca compartilhe dados bancários ou senhas" },
  { icon: MapPin, text: "Combine encontros em locais públicos e movimentados" },
  { icon: AlertTriangle, text: "Desconfie de ofertas boas demais" },
  { icon: UserCheck, text: "Verifique o perfil e as avaliações do usuário" },
  { icon: Shield, text: "Não envie pagamentos antecipados" },
];

const ChatSafetyDialog = ({ open, userId, onAccepted }: ChatSafetyDialogProps) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAccept = async () => {
    if (!accepted || saving) return;
    setSaving(true);
    try {
      await supabase
        .from("profiles")
        .update({ chat_terms_accepted_at: new Date().toISOString() } as any)
        .eq("user_id", userId);
      onAccepted();
    } catch {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="max-w-sm rounded-2xl border-foreground/10 bg-background p-0 overflow-hidden [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="p-6"
            >
              <DialogHeader className="mb-5">
                <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="h-7 w-7 text-primary" />
                </div>
                <DialogTitle className="text-center text-lg">
                  Negocie com segurança
                </DialogTitle>
                <DialogDescription className="text-center text-sm text-muted-foreground">
                  Antes de começar, confira algumas dicas importantes
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 mb-6">
                {tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="h-8 w-8 shrink-0 rounded-lg bg-card flex items-center justify-center border border-foreground/5">
                      <tip.icon className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-sm text-foreground/80 pt-1">{tip.text}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm transition-all active:scale-95 neon-glow"
              >
                Continuar
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="p-6"
            >
              <DialogHeader className="mb-5">
                <DialogTitle className="text-center text-lg">
                  Termos de Uso do Chat
                </DialogTitle>
                <DialogDescription className="text-center text-sm text-muted-foreground">
                  Leia com atenção antes de prosseguir
                </DialogDescription>
              </DialogHeader>

              <div className="bg-card/50 border border-foreground/5 rounded-xl p-4 mb-5 max-h-48 overflow-y-auto text-xs text-foreground/70 leading-relaxed space-y-3">
                <p>
                  <strong className="text-foreground/90">1. Responsabilidade do usuário:</strong> Você é
                  integralmente responsável por todas as negociações realizadas através do
                  chat. A Hypou atua apenas como plataforma de conexão entre usuários.
                </p>
                <p>
                  <strong className="text-foreground/90">2. Conteúdo proibido:</strong> É proibido o envio
                  de conteúdo ilegal, ofensivo, discriminatório ou que viole direitos de
                  terceiros. Contas que violarem esta regra poderão ser suspensas.
                </p>
                <p>
                  <strong className="text-foreground/90">3. Negociações externas:</strong> A Hypou não se
                  responsabiliza por acordos, pagamentos ou trocas realizadas fora da
                  plataforma. Recomendamos que todas as transações sejam documentadas.
                </p>
                <p>
                  <strong className="text-foreground/90">4. Segurança:</strong> Nunca compartilhe
                  informações sensíveis como senhas, dados bancários ou documentos pessoais
                  pelo chat.
                </p>
                <p>
                  <strong className="text-foreground/90">5. Denúncias:</strong> Caso identifique
                  comportamento suspeito, entre em contato com o suporte da Hypou para que
                  as medidas cabíveis sejam tomadas.
                </p>
              </div>

              <label className="flex items-center gap-3 mb-5 cursor-pointer">
                <Checkbox
                  checked={accepted}
                  onCheckedChange={(v) => setAccepted(v === true)}
                />
                <span className="text-sm text-foreground/80">
                  Li e aceito os termos de uso
                </span>
              </label>

              <button
                onClick={handleAccept}
                disabled={!accepted || saving}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm transition-all active:scale-95 disabled:opacity-40 disabled:active:scale-100 neon-glow"
              >
                {saving ? "Salvando..." : "Aceitar e Continuar"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default ChatSafetyDialog;
