import { Loader2, Flag, Ban } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";

interface ReportDialogsProps {
  reportOpen: boolean;
  setReportOpen: (v: boolean) => void;
  reportReason: string;
  setReportReason: (v: string) => void;
  reportDesc: string;
  setReportDesc: (v: string) => void;
  reporting: boolean;
  onReport: () => void;

  blockConfirmOpen: boolean;
  setBlockConfirmOpen: (v: boolean) => void;
  blocking: boolean;
  onBlock: () => void;
}

const REPORT_REASONS = ["Golpe", "Conteúdo impróprio", "Assédio", "Perfil falso", "Outro"];

export const ReportDialogs = ({
  reportOpen,
  setReportOpen,
  reportReason,
  setReportReason,
  reportDesc,
  setReportDesc,
  reporting,
  onReport,
  blockConfirmOpen,
  setBlockConfirmOpen,
  blocking,
  onBlock,
}: ReportDialogsProps) => {
  return (
    <>
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="bg-background border-foreground/10">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Flag className="h-5 w-5 text-destructive" />
              Denunciar Usuário
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">Motivo</p>
              <div className="flex flex-wrap gap-2">
                {REPORT_REASONS.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setReportReason(reason)}
                    className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all ${
                      reportReason === reason
                        ? "bg-primary text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.4)]"
                        : "bg-foreground/5 border border-foreground/10 text-foreground/70 hover:border-foreground/20 hover:text-foreground"
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Detalhes (opcional)</p>
              <Textarea
                value={reportDesc}
                onChange={(e) => setReportDesc(e.target.value)}
                placeholder="Descreva o que aconteceu..."
                rows={3}
                className="bg-foreground/5 border-foreground/10 resize-none focus:border-primary/50"
              />
            </div>
            <button
              onClick={onReport}
              disabled={!reportReason || reporting}
              className="w-full py-3 rounded-full bg-destructive text-destructive-foreground font-bold text-sm uppercase tracking-wider disabled:opacity-30 flex items-center justify-center gap-2 hover:bg-destructive/90 transition-all shadow-[0_4px_16px_hsl(var(--destructive)/0.3)]"
            >
              {reporting && <Loader2 className="h-4 w-4 animate-spin" />}
              Enviar Denúncia
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={blockConfirmOpen} onOpenChange={setBlockConfirmOpen}>
        <AlertDialogContent className="bg-card border-foreground/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-foreground">
              <Ban className="h-5 w-5 text-destructive" />
              Bloquear Usuário
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Ao bloquear, você não verá mais itens deste usuário e ele não poderá interagir com os seus. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={onBlock}
              disabled={blocking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {blocking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Bloquear"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
