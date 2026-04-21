import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Rocket, Link2, Save, ExternalLink, Users, Hash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SiteSetting {
  key: string;
  value: string;
  updated_at: string;
}

const LAUNCH_SETTINGS_KEYS = [
  "whatsapp_group_url",
  "telegram_group_url",
  "discord_invite_url",
  "instagram_url",
  "launch_date",
];

const settingLabels: Record<string, { label: string; description: string; placeholder: string }> = {
  whatsapp_group_url: {
    label: "Link do Grupo WhatsApp",
    description: "Link de convite do grupo WhatsApp exibido na lista de espera",
    placeholder: "https://chat.whatsapp.com/...",
  },
  telegram_group_url: {
    label: "Link do Grupo Telegram",
    description: "Link de convite do grupo Telegram (opcional)",
    placeholder: "https://t.me/...",
  },
  discord_invite_url: {
    label: "Link do Discord",
    description: "Link de convite do servidor Discord (opcional)",
    placeholder: "https://discord.gg/...",
  },
  instagram_url: {
    label: "Instagram",
    description: "Link do perfil do Instagram (opcional)",
    placeholder: "https://instagram.com/...",
  },
  launch_date: {
    label: "Data de Lançamento",
    description: "Data alvo para o lançamento (usada no countdown da lista de espera)",
    placeholder: "2026-06-01T00:00:00",
  },
};

const AdminLancamento = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin-launch-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .in("key", LAUNCH_SETTINGS_KEYS);
      if (error) throw error;
      return (data || []) as SiteSetting[];
    },
  });

  const { data: waitlistCount } = useQuery({
    queryKey: ["admin-waitlist-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("waitlist")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  useEffect(() => {
    if (settings) {
      const initial: Record<string, string> = {};
      settings.forEach((s) => {
        initial[s.key] = s.value;
      });
      setFormValues(initial);
      setHasChanges(false);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (entries: { key: string; value: string }[]) => {
      for (const entry of entries) {
        const { error } = await supabase
          .from("site_settings")
          .upsert({ key: entry.key, value: entry.value, updated_at: new Date().toISOString() }, { onConflict: "key" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-launch-settings"] });
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast({ title: "Configurações salvas", description: "As alterações foram aplicadas com sucesso." });
      setHasChanges(false);
    },
    onError: () => {
      toast({ title: "Erro ao salvar", description: "Tente novamente.", variant: "destructive" });
    },
  });

  const handleChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    const entries = LAUNCH_SETTINGS_KEYS
      .filter((key) => formValues[key] !== undefined && formValues[key] !== "")
      .map((key) => ({ key, value: formValues[key] }));
    saveMutation.mutate(entries);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Rocket className="h-6 w-6 text-primary" />
            Lançamento
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure links, datas e informações da fase de pré-lançamento
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || saveMutation.isPending}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {saveMutation.isPending ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{waitlistCount ?? "—"}</p>
              <p className="text-xs text-muted-foreground">Inscritos na waitlist</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Link2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {LAUNCH_SETTINGS_KEYS.filter((k) => formValues[k] && formValues[k] !== "PLACEHOLDER").length}
              </p>
              <p className="text-xs text-muted-foreground">Links configurados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Hash className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {formValues["launch_date"]
                  ? new Date(formValues["launch_date"]).toLocaleDateString("pt-BR")
                  : "—"}
              </p>
              <p className="text-xs text-muted-foreground">Data de lançamento</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Settings form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Links e Configurações</CardTitle>
          <CardDescription>
            Estes valores são usados na página de lista de espera e comunicações do pré-lançamento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : (
            LAUNCH_SETTINGS_KEYS.map((key) => {
              const meta = settingLabels[key];
              const currentValue = formValues[key] || "";
              const isLink = key !== "launch_date";
              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={key} className="text-sm font-medium">
                      {meta.label}
                    </Label>
                    {isLink && currentValue && currentValue !== "PLACEHOLDER" && (
                      <a
                        href={currentValue}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary flex items-center gap-1 hover:underline"
                      >
                        Testar link <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <Input
                    id={key}
                    type={key === "launch_date" ? "datetime-local" : "url"}
                    placeholder={meta.placeholder}
                    value={currentValue}
                    onChange={(e) => handleChange(key, e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">{meta.description}</p>
                  {currentValue === "PLACEHOLDER" && (
                    <Badge variant="outline" className="text-destructive border-destructive/30 text-xs">
                      ⚠ Valor placeholder — substitua pelo link real
                    </Badge>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLancamento;
