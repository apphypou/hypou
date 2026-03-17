import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { LogIn, UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

interface GuestPromptDialogProps {
  open: boolean;
  onClose: () => void;
}

const GuestPromptDialog = ({ open, onClose }: GuestPromptDialogProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // If user is already logged in (e.g. just signed up), redirect to onboarding
  useEffect(() => {
    if (open && user) {
      onClose();
      navigate("/onboarding", { replace: true });
    }
  }, [open, user, onClose, navigate]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-card border-foreground/10">
        <DialogHeader>
          <DialogTitle className="text-foreground text-center text-xl">
            Crie sua conta para trocar! 🤝
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Para curtir itens e enviar propostas de troca, você precisa estar logado.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-2">
          <button
            onClick={() => navigate("/cadastro")}
            className="w-full py-3 rounded-full bg-primary text-primary-foreground text-sm font-bold uppercase tracking-wider neon-glow transition-all flex items-center justify-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Criar conta grátis
          </button>

          <button
            onClick={() => navigate("/login")}
            className="w-full py-3 rounded-full bg-card border border-foreground/10 text-foreground text-sm font-bold uppercase tracking-wider hover:bg-card/80 transition-all flex items-center justify-center gap-2"
          >
            <LogIn className="h-4 w-4" />
            Já tenho conta
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GuestPromptDialog;
