import { ArrowLeft, Camera, Plus, TrendingUp, TrendingDown, Info, Loader2, Check } from "lucide-react";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { createItem, uploadItemImage } from "@/services/itemService";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import ScreenLayout from "@/components/ScreenLayout";
import IconButton from "@/components/IconButton";

const categories = [
  { emoji: "📱", label: "Celulares" },
  { emoji: "🚗", label: "Carros & Motos" },
  { emoji: "👕", label: "Moda" },
  { emoji: "🛋️", label: "Casa" },
  { emoji: "🎮", label: "Videogames" },
];

const NovoItem = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const itemInputRef = useRef<HTMLInputElement>(null);

  const [itemName, setItemName] = useState("");
  const [itemValue, setItemValue] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [category, setCategory] = useState("");
  const [valorization, setValorization] = useState(15);
  const [devalorization, setDevalorization] = useState(10);
  const [itemPhotos, setItemPhotos] = useState<File[]>([]);
  const [itemPreviews, setItemPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const handleItemPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxNew = 5 - itemPhotos.length;
    const toAdd = files.slice(0, maxNew);
    setItemPhotos((prev) => [...prev, ...toAdd]);
    setItemPreviews((prev) => [...prev, ...toAdd.map((f) => URL.createObjectURL(f))]);
  };

  const handleSubmit = async () => {
    if (!user || !itemName.trim()) {
      toast({ title: "Preencha o nome do item", variant: "destructive" });
      return;
    }
    if (!category) {
      toast({ title: "Selecione uma categoria", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const cleanValue = itemValue.replace(/\D/g, "");
      const valueInCents = parseInt(cleanValue || "0", 10) * 100;

      const item = await createItem({
        user_id: user.id,
        name: itemName.trim(),
        description: itemDesc.trim() || undefined,
        category,
        market_value: valueInCents,
        margin_up: valorization,
        margin_down: devalorization,
      });

      for (let i = 0; i < itemPhotos.length; i++) {
        await uploadItemImage(user.id, item.id, itemPhotos[i], i);
      }

      queryClient.invalidateQueries({ queryKey: ["my-items"] });
      toast({ title: "Item cadastrado com sucesso!" });
      navigate("/meu-perfil");
    } catch (err: any) {
      toast({ title: "Erro ao cadastrar item", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenLayout>
      <input ref={itemInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleItemPhotos} />

      <header className="relative z-40 flex w-full items-center gap-3 px-6 pt-12 pb-4">
        <IconButton icon={ArrowLeft} size="sm" onClick={() => navigate(-1)} />
        <span className="text-sm font-bold tracking-wider uppercase text-foreground/80">Cadastrar Item</span>
      </header>

      <main className="flex-1 w-full px-6 overflow-y-auto no-scrollbar pb-8">
        {/* Photos */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 pl-1">
            Fotos do Item
          </label>
          {itemPreviews.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto no-scrollbar">
              {itemPreviews.map((url, i) => (
                <div key={i} className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-primary/30">
                  <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
              {itemPreviews.length < 5 && (
                <div
                  onClick={() => itemInputRef.current?.click()}
                  className="w-24 h-24 rounded-2xl bg-card border border-foreground/10 border-dashed flex items-center justify-center shrink-0 cursor-pointer hover:bg-card/80 transition-all"
                >
                  <Plus className="h-6 w-6 text-primary/50" />
                </div>
              )}
            </div>
          ) : (
            <div
              onClick={() => itemInputRef.current?.click()}
              className="relative w-full aspect-[16/10] rounded-3xl bg-card flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:bg-card/80 dashed-border-glow"
            >
              <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center">
                <Camera className="h-7 w-7 text-primary/60" />
              </div>
              <span className="text-sm font-bold text-primary uppercase tracking-wider">Adicionar fotos</span>
              <span className="text-xs text-muted-foreground">Até 5 fotos do item</span>
            </div>
          )}
        </div>

        {/* Form */}
        <div className="flex flex-col gap-5 mb-6">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 pl-1">Nome do Item</label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Ex: iPhone 14 Pro Max 256GB"
              className="w-full bg-card/50 border border-foreground/10 text-foreground rounded-xl px-5 py-4 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:text-foreground/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 pl-1">Categoria</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.label}
                  onClick={() => setCategory(cat.label)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    category === cat.label
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-foreground/10 text-foreground/60 hover:border-foreground/20"
                  }`}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 pl-1">Valor de Mercado (R$)</label>
            <input
              type="text"
              value={itemValue}
              onChange={(e) => setItemValue(e.target.value)}
              placeholder="0,00"
              className="w-full bg-card/50 border border-foreground/10 text-foreground rounded-xl px-5 py-4 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:text-foreground/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 pl-1">Descrição</label>
            <textarea
              value={itemDesc}
              onChange={(e) => setItemDesc(e.target.value)}
              placeholder="Detalhes sobre condição, tempo de uso, etc..."
              rows={3}
              className="w-full bg-card/50 border border-foreground/10 text-foreground rounded-xl px-5 py-4 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:text-foreground/20 resize-none"
            />
          </div>
        </div>

        {/* Margins */}
        <div className="rounded-2xl bg-card border border-foreground/5 p-6 mb-4">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Acima do Valor</span>
          <div className="flex items-center justify-between mt-2 mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">Valorização</span>
            </div>
            <span className="text-3xl font-bold text-primary text-glow">+{valorization}<span className="text-lg">%</span></span>
          </div>
          <input type="range" min={0} max={50} value={valorization} onChange={(e) => setValorization(Number(e.target.value))} className="w-full accent-primary" />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-muted-foreground">0%</span>
            <span className="text-xs text-muted-foreground">+50%</span>
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-foreground/5 p-6 mb-6">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Abaixo do Valor</span>
          <div className="flex items-center justify-between mt-2 mb-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">Desvalorização</span>
            </div>
            <span className="text-3xl font-bold text-primary text-glow">-{devalorization}<span className="text-lg">%</span></span>
          </div>
          <input type="range" min={0} max={50} value={devalorization} onChange={(e) => setDevalorization(Number(e.target.value))} className="w-full accent-primary" />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-muted-foreground">0%</span>
            <span className="text-xs text-muted-foreground">-50%</span>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl bg-card/50 border border-foreground/5 p-4 mb-8">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            A margem ajuda nosso algoritmo a encontrar trocas com valores compatíveis ao seu item.
          </p>
        </div>
      </main>

      {/* Submit */}
      <div className="relative z-50 w-full p-6 pb-10 bg-gradient-to-t from-background via-background to-transparent shrink-0">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full h-14 rounded-full bg-primary text-primary-foreground font-bold text-lg uppercase tracking-wider hover:opacity-90 transition-all active:scale-[0.98] neon-glow flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Check className="h-5 w-5" /><span>Cadastrar Item</span></>}
        </button>
      </div>
    </ScreenLayout>
  );
};

export default NovoItem;
