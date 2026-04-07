import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquarePlus } from "lucide-react";
import { useUpdateIncidentStatus } from "@/hooks/useSystemStatus";
import { toast } from "sonner";

interface Props {
  incidentId: string;
  currentStatus: string;
}

const UpdateIncidentDialog = ({ incidentId, currentStatus }: Props) => {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(currentStatus);
  const [message, setMessage] = useState("");
  const updateIncident = useUpdateIncidentStatus();

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error("Adicione uma mensagem");
      return;
    }
    try {
      await updateIncident.mutateAsync({ incidentId, status, message });
      toast.success("Incidente atualizado");
      setMessage("");
      setOpen(false);
    } catch {
      toast.error("Erro ao atualizar");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
          <MessageSquarePlus className="h-3.5 w-3.5" />
          Atualizar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Atualizar Incidente</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Novo status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="investigating">Investigando</SelectItem>
                <SelectItem value="identified">Identificado</SelectItem>
                <SelectItem value="monitoring">Monitorando</SelectItem>
                <SelectItem value="resolved">Resolvido</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Mensagem</label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="O que mudou?" rows={3} />
          </div>
          <Button onClick={handleSubmit} disabled={updateIncident.isPending} className="w-full">
            {updateIncident.isPending ? "Atualizando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateIncidentDialog;
