import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Package, Plus, Sparkles } from "lucide-react";
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

interface SelectItemDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (myItemId: string) => void;
  targetItemName?: string;
  loading?: boolean;
}

const SelectItemDialog = ({ open, onClose, onConfirm, targetItemName, loading }: SelectItemDialogProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  // Check if user has ever had any item (active or not) to differentiate first-time vs returning
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

  const handleConfirm = () => {
    if (selectedId) onConfirm(selectedId);
  };

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="text-center pb-2">
          <DrawerTitle className="text-lg font-extrabold text-foreground">
            Qual item você oferece?
          </DrawerTitle>
          {targetItemName && (
            <p className="text-xs text-muted-foreground mt-1">
              Para trocar por <span className="font-semibold text-primary">{targetItemName}</span>
            </p>
          )}
        </DrawerHeader>

        <div className="px-4 pb-4 overflow-y-auto max-h-[50vh] no-scrollbar">
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
              {myItems.map((item) => {
                const image = (item.item_images as any[])?.sort((a: any, b: any) => a.position - b.position)?.[0]?.image_url;
                const isSelected = selectedId === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedId(isSelected ? null : item.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                      isSelected
                        ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                        : "border-foreground/10 bg-card hover:border-foreground/20"
                    }`}
                  >
                    <div className="h-14 w-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {image ? (
                        <img src={image} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-lg">📦</div>
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
                      {isSelected && (
                        <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {myItems.length > 0 && (
          <DrawerFooter className="pt-2">
            <Button
              onClick={handleConfirm}
              disabled={!selectedId || loading}
              className="w-full h-12 rounded-xl font-bold text-base"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Confirmar proposta"
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
