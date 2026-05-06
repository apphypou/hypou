import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Package, Plus, Sparkles, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { formatValue } from "@/lib/utils";

const MAX_ITEMS = 3;

interface SelectItemDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (myItemIds: string[]) => void;
  targetItemName?: string;
  targetItemValue?: number;
  targetMarginUp?: number;
  targetMarginDown?: number;
  loading?: boolean;
}

const SelectItemDialog = ({
  open,
  onClose,
  onConfirm,
  targetItemName,
  targetItemValue,
  targetMarginUp = 15,
  targetMarginDown = 10,
  loading,
}: SelectItemDialogProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) setSelectedIds([]);
  }, [open]);

  const { data: myItems = [], isLoading } = useQuery({
    queryKey: ["my-active-items", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("items")
        .select("id, name, market_value, category, item_images (image_url, position)")
        .eq("user_id", user!.id)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && open,
  });

  const { data: totalItemCount = 0 } = useQuery({
    queryKey: ["user-total-items", user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("items")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user && open,
  });

  const isFirstTime = totalItemCount === 0 && myItems.length === 0;

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_ITEMS) return prev;
      return [...prev, id];
    });
  };

  const sum = selectedIds.reduce((acc, id) => {
    const it = myItems.find((m: any) => m.id === id);
    return acc + (it?.market_value || 0);
  }, 0);

  const targetMin = targetItemValue ? Math.round(targetItemValue * (1 - targetMarginDown / 100)) : 0;
  const targetMax = targetItemValue ? Math.round(targetItemValue * (1 + targetMarginUp / 100)) : 0;
  const rangeStatus: "ok" | "low" | "high" | null = !targetItemValue || selectedIds.length === 0
    ? null
    : sum < targetMin
      ? "low"
      : sum > targetMax
        ? "high"
        : "ok";

  const handleConfirm = () => {
    if (selectedIds.length > 0) onConfirm(selectedIds);
  };

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent className="max-h-[88vh]">
        <DrawerHeader className="text-center pb-2">
          <DrawerTitle className="text-lg font-extrabold text-foreground">
            Você curtiu! 🎯 Monte sua oferta
          </DrawerTitle>
          {targetItemName ? (
            <p className="text-xs text-muted-foreground mt-1">
              Combine até {MAX_ITEMS} itens para trocar por{" "}
              <span className="font-semibold text-primary">{targetItemName}</span>
              {targetItemValue ? <> ({formatValue(targetItemValue)})</> : null}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">
              Selecione até {MAX_ITEMS} itens para oferecer.
            </p>
          )}
        </DrawerHeader>

        <div className="px-4 pb-2 overflow-y-auto max-h-[48vh] no-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : myItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                {isFirstTime ? (
                  <Sparkles className="h-7 w-7 text-primary" />
                ) : (
                  <Package className="h-7 w-7 text-primary" />
                )}
              </div>
              <p className="text-foreground font-bold text-base mb-1">
                {isFirstTime ? "Cadastre seu primeiro item!" : "Nenhum item ativo"}
              </p>
              <p className="text-muted-foreground text-xs mb-4">
                {isFirstTime
                  ? "Para propor trocas, você precisa cadastrar pelo menos um item seu."
                  : "Cadastre um novo item para poder propor trocas."}
              </p>
              <Button
                onClick={() => { onClose(); navigate("/novo-item"); }}
                className="rounded-full px-6"
              >
                <Plus className="h-4 w-4 mr-1" />
                {isFirstTime ? "Cadastrar meu primeiro item" : "Cadastrar item"}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {myItems.map((item: any) => {
                const image = (item.item_images as any[])
                  ?.sort((a: any, b: any) => a.position - b.position)?.[0]?.image_url;
                const idx = selectedIds.indexOf(item.id);
                const isSelected = idx >= 0;
                const disabled = !isSelected && selectedIds.length >= MAX_ITEMS;

                return (
                  <button
                    key={item.id}
                    onClick={() => toggle(item.id)}
                    disabled={disabled}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                      isSelected
                        ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                        : disabled
                          ? "border-foreground/5 bg-card opacity-40"
                          : "border-foreground/10 bg-card hover:border-foreground/20"
                    }`}
                  >
                    <div className="h-14 w-14 rounded-lg overflow-hidden bg-muted flex-shrink-0 relative">
                      {image ? (
                        <img src={image} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-lg">📦</div>
                      )}
                      {isSelected && (
                        <div className="absolute top-1 left-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-semibold text-sm truncate">{item.name}</p>
                      <p className="text-primary text-xs font-bold">{formatValue(item.market_value)}</p>
                      <p className="text-muted-foreground text-[10px]">{item.category}</p>
                    </div>
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      isSelected ? "border-primary bg-primary" : "border-foreground/20"
                    }`}>
                      {isSelected && <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {myItems.length > 0 && (
          <DrawerFooter className="pt-2 gap-2">
            {selectedIds.length > 0 && (
              <div className="flex items-center justify-between rounded-xl bg-card border border-foreground/10 px-4 py-2.5">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                    Sua oferta ({selectedIds.length}/{MAX_ITEMS})
                  </p>
                  <p className="text-foreground font-bold text-base">{formatValue(sum)}</p>
                </div>
                {rangeStatus && (
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                    rangeStatus === "ok"
                      ? "bg-success/15 text-success"
                      : rangeStatus === "low"
                        ? "bg-warning/15 text-warning"
                        : "bg-warning/15 text-warning"
                  }`}>
                    {rangeStatus === "ok" ? "Dentro da faixa" : rangeStatus === "low" ? "Abaixo" : "Acima"}
                  </span>
                )}
              </div>
            )}
            <Button
              onClick={handleConfirm}
              disabled={selectedIds.length === 0 || loading}
              className="w-full h-12 rounded-xl font-bold text-base"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                `Enviar proposta${selectedIds.length > 1 ? ` (${selectedIds.length} itens)` : ""}`
              )}
            </Button>
            <Button variant="ghost" onClick={onClose} className="text-muted-foreground">
              Cancelar
            </Button>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
};

export default SelectItemDialog;
