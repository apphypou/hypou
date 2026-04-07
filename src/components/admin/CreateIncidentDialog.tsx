import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useCreateIncident } from "@/hooks/useSystemStatus";
import { toast } from "sonner";

const CreateIncidentDialog = () => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState("minor");
  const [message, setMessage] = useState("");
  const createIncident = useCreateIncident();

  const handleSubmit = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }
    try {
      await createIncident.mutateAsync({ title, severity, message });
      toast.success("Incidente registrado");
      setTitle("");
      setMessage("");
      setSeverity("minor");
      setOpen(false);
    } catch {
      toast.error("Erro ao registrar incidente");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Registrar Incidente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Incidente</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Título</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Latência elevada no DB" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Severidade</label>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="minor">Menor</SelectItem>
                <SelectItem value="major">Maior</SelectItem>
                <SelectItem value="critical">Crítico</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Descrição inicial</label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Descreva o que está acontecendo..." rows={3} />
          </div>
          <Button onClick={handleSubmit} disabled={createIncident.isPending} className="w-full">
            {createIncident.isPending ? "Registrando..." : "Registrar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateIncidentDialog;
