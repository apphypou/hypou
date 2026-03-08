import { ArrowLeft, Camera, Plus, TrendingUp, TrendingDown, Info, Loader2, Check, MapPin, Trash2, AlertTriangle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { updateItem, uploadItemImage, getItemById, deleteItemImage, validateItemPrice } from "@/services/itemService";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import ScreenLayout from "@/components/ScreenLayout";
import IconButton from "@/components/IconButton";

const categories = [
  { emoji: "📱", label: "Celulares" },
  { emoji: "🚗", label: "Carros & Motos" },
  { emoji: "👕", label: "Moda" },
  { emoji: "🛋️", label: "Casa" },
  { emoji: "🎮", label: "Videogames" },
];

const conditions = [
  { value: "new", label: "Novo" },
  { value: "like_new", label: "Seminovo" },
  { value: "used", label: "Usado" },
  { value: "worn", label: "Bem usado" },
];

const formatCurrency = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  const number = parseInt(digits || "0", 10);
  return (number / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const parseCurrencyToCents = (formatted: string): number => {
  const digits = formatted.replace(/\D/g, "");
  return parseInt(digits || "0", 10);
};

const centsToFormatted = (cents: number): string => {
  if (!cents) return "";
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const EditarItem = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const itemInputRef = useRef<HTMLInputElement>(null);

  const { data: item, isLoading } = useQuery({
    queryKey: ["item-detail", itemId],
    queryFn: () => getItemById(itemId!),
    enabled: !!itemId,
  });

  const [itemName, setItemName] = useState("");
  const [itemValue, setItemValue] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("used");
  const [location, setLocation] = useState("");
  const [valorization, setValorization] = useState(15);
  const [devalorization, setDevalorization] = useState(10);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [priceAlert, setPriceAlert] = useState<{
    open: boolean;
    reason: string;
    suggestedMin: number;
    suggestedMax: number;
  }>({ open: false, reason: "", suggestedMin: 0, suggestedMax: 0 });

  // Populate form when item loads
  useEffect(() => {
    if (item) {
      setItemName(item.name);
      setItemValue(centsToFormatted(item.market_value));
      setItemDesc(item.description || "");
      setCategory(item.category);
      setCondition(item.condition || "used");
      setLocation(item.location || "");
      setValorization(item.margin_up);
      setDevalorization(item.margin_down);
      setExistingImages((item.item_images || []).sort((a: any, b: any) => a.position - b.position));
    }
  }, [item]);

  const totalImages = existingImages.length + newPhotos.length;

  const handleNewPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxNew = 5 - totalImages;
    const toAdd = files.slice(0, maxNew);
    setNewPhotos((prev) => [...prev, ...toAdd]);
    setNewPreviews((prev) => [...prev, ...toAdd.map((f) => URL.createObjectURL(f))]);
  };

  const handleRemoveExistingImage = async (imageId: string) => {
    try {
      await deleteItemImage(imageId);
      setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch {
      toast({ title: "Erro ao remover foto", variant: "destructive" });
    }
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw.length > 10) return;
    setItemValue(raw ? formatCurrency(raw) : "");
  };

  const saveItem = async () => {
    if (!user || !itemId) return;
    setSaving(true);
    try {
      const valueInCents = parseCurrencyToCents(itemValue);

      await updateItem(itemId, {
        name: itemName.trim(),
        description: itemDesc.trim().slice(0, 500) || null,
        category,
        condition,
        location: location.trim() || null,
        market_value: valueInCents,
        margin_up: valorization,
        margin_down: devalorization,
      });

      for (let i = 0; i < newPhotos.length; i++) {
        const position = existingImages.length + i;
        await uploadItemImage(user.id, itemId, newPhotos[i], position);
      }

      queryClient.invalidateQueries({ queryKey: ["my-items"] });
      queryClient.invalidateQueries({ queryKey: ["item-detail", itemId] });
      toast({ title: "Item atualizado com sucesso!" });
      navigate("/meu-perfil");
    } catch (err: any) {
      toast({ title: "Erro ao atualizar item", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !itemId || !itemName.trim()) {
      toast({ title: "Preencha o nome do item", variant: "destructive" });
      return;
    }
    if (!category) {
      toast({ title: "Selecione uma categoria", variant: "destructive" });
      return;
    }

    const valueInCents = parseCurrencyToCents(itemValue);

    setValidating(true);
    try {
      const validation = await validateItemPrice(itemName.trim(), category, condition, valueInCents);
      if (!validation.valid) {
        setPriceAlert({
          open: true,
          reason: validation.reason,
          suggestedMin: validation.suggestedMin,
          suggestedMax: validation.suggestedMax,
        });
        setValidating(false);
        return;
      }
    } catch {
      // Fail-open
    }
    setValidating(false);

    await saveItem();
  };

  const handleForceSubmit = async () => {
    setPriceAlert({ open: false, reason: "", suggestedMin: 0, suggestedMax: 0 });
    await saveItem();
  };

  const isSubmitting = saving || validating;

  const formatCentsDisplay = (cents: number): string => {
    return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  if (isLoading) {
    return (
      <ScreenLayout>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </div>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <input ref={itemInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleNewPhotos} />

      <header className="relative z-40 flex w-full items-center gap-3 px-6 pt-12 pb-4">
        <IconButton icon={ArrowLeft} size="sm" onClick={() => navigate(-1)} />
        <span className="text-sm font-bold tracking-wider uppercase text-foreground/80">Editar Item</span>
      </header>

      <main className="flex-1 w-full px-6 overflow-y-auto no-scrollbar pb-8">
        {/* Photos */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 pl-1">
            Fotos do Item
          </label>
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            {existingImages.map((img) => (
              <div key={img.id} className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-primary/30 group">
                <img src={img.image_url} alt="Foto" className="w-full h-full object-cover" />
                <button
                  onClick={() => handleRemoveExistingImage(img.id)}
                  className="absolute top-1 right-1 h-6 w-6 rounded-full bg-destructive/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3 w-3 text-destructive-foreground" />
                </button>
              </div>
            ))}
            {newPreviews.map((url, i) => (
              <div key={`new-${i}`} className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-primary/30">
                <img src={url} alt={`Nova foto ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
            {totalImages < 5 && (
              <div
                onClick={() => itemInputRef.current?.click()}
                className="w-24 h-24 rounded-2xl bg-card border border-foreground/10 border-dashed flex items-center justify-center shrink-0 cursor-pointer hover:bg-card/80 transition-all"
              >
                <Plus className="h-6 w-6 text-primary/50" />
              </div>
            )}
          </div>
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
              maxLength={120}
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
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 pl-1">Condição</label>
            <div className="flex flex-wrap gap-2">
              {conditions.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCondition(c.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    condition === c.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-foreground/10 text-foreground/60 hover:border-foreground/20"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 pl-1">Valor de Mercado</label>
            <input
              type="text"
              inputMode="numeric"
              value={itemValue}
              onChange={handleCurrencyChange}
              placeholder="R$ 0,00"
              className="w-full bg-card/50 border border-foreground/10 text-foreground rounded-xl px-5 py-4 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:text-foreground/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 pl-1">Localização</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Cidade, Estado"
                maxLength={100}
                className="w-full bg-card/50 border border-foreground/10 text-foreground rounded-xl pl-12 pr-5 py-4 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:text-foreground/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 pl-1">Descrição</label>
            <textarea
              value={itemDesc}
              onChange={(e) => setItemDesc(e.target.value)}
              placeholder="Detalhes sobre tempo de uso, acessórios inclusos, etc..."
              rows={3}
              maxLength={500}
              className="w-full bg-card/50 border border-foreground/10 text-foreground rounded-xl px-5 py-4 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:text-foreground/20 resize-none"
            />
            <span className="text-xs text-muted-foreground mt-1 block text-right">{itemDesc.length}/500</span>
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
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Check className="h-5 w-5" /><span>Salvar Alterações</span></>}
        </button>
      </div>
    </ScreenLayout>
  );
};

export default EditarItem;
