import { ArrowLeft, Camera, Plus, Loader2, Check, AlertTriangle, X, Sparkles, Video } from "lucide-react";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { createItem, uploadItemImage, validateItemPrice } from "@/services/itemService";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import ScreenLayout from "@/components/ScreenLayout";
import IconButton from "@/components/IconButton";
import TradeRangeCard from "@/components/TradeRangeCard";
import LocationSearch from "@/components/LocationSearch";
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

const categories = [
  { emoji: "📱", label: "Celulares" },
  { emoji: "🚗", label: "Carros & Motos" },
  { emoji: "👕", label: "Moda" },
  { emoji: "🛋️", label: "Casa" },
  { emoji: "🎮", label: "Videogames" },
  { emoji: "💻", label: "Eletrônicos" },
  { emoji: "⚽", label: "Esportes" },
  { emoji: "📚", label: "Livros" },
  { emoji: "🎸", label: "Instrumentos" },
  { emoji: "🔧", label: "Ferramentas" },
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

const formatCentsDisplay = (cents: number): string => {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const NovoItem = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const itemInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [itemName, setItemName] = useState("");
  const [itemValue, setItemValue] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("used");
  const [location, setLocation] = useState("");
  const [valorization, setValorization] = useState(15);
  const [devalorization, setDevalorization] = useState(10);
  const [itemPhotos, setItemPhotos] = useState<File[]>([]);
  const [itemPreviews, setItemPreviews] = useState<string[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [suggestingPrice, setSuggestingPrice] = useState(false);

  const [priceAlert, setPriceAlert] = useState<{
    open: boolean;
    reason: string;
    suggestedMin: number;
    suggestedMax: number;
  }>({ open: false, reason: "", suggestedMin: 0, suggestedMax: 0 });

  const valueCents = parseCurrencyToCents(itemValue);

  const handleItemPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxNew = 5 - itemPhotos.length;
    const toAdd = files.slice(0, maxNew);
    setItemPhotos((prev) => [...prev, ...toAdd]);
    setItemPreviews((prev) => [...prev, ...toAdd.map((f) => URL.createObjectURL(f))]);
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(itemPreviews[index]);
    setItemPhotos((prev) => prev.filter((_, i) => i !== index));
    setItemPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "Vídeo muito grande (máx. 50MB)", variant: "destructive" });
      return;
    }
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const removeVideo = () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoFile(null);
    setVideoPreview(null);
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw.length > 10) return;
    setItemValue(raw ? formatCurrency(raw) : "");
  };

  const handleSuggestPrice = async () => {
    if (!itemName.trim() || !category || !condition) {
      toast({ title: "Preencha nome, categoria e condição primeiro", variant: "destructive" });
      return;
    }
    setSuggestingPrice(true);
    try {
      const result = await validateItemPrice(itemName.trim(), category, condition, 0, itemDesc.trim() || undefined);
      if (result.suggestedMin > 0 && result.suggestedMax > 0) {
        const avg = Math.round((result.suggestedMin + result.suggestedMax) / 2);
        setItemValue(formatCurrency(String(avg)));
        toast({ title: "💡 Preço sugerido!", description: `Baseado em preços reais do mercado: ${formatCentsDisplay(result.suggestedMin)} — ${formatCentsDisplay(result.suggestedMax)}` });
      } else {
        toast({ title: "Não foi possível sugerir um preço", description: "Tente preencher manualmente.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro ao buscar preço", variant: "destructive" });
    } finally {
      setSuggestingPrice(false);
    }
  };

  const saveItem = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const item = await createItem({
        user_id: user.id,
        name: itemName.trim(),
        description: itemDesc.trim().slice(0, 500) || undefined,
        category,
        market_value: valueCents,
        margin_up: valorization,
        margin_down: devalorization,
        location: location.trim() || undefined,
      });

      if (condition) {
        const { supabase } = await import("@/integrations/supabase/client");
        await supabase.from("items").update({ condition }).eq("id", item.id);
      }

      for (let i = 0; i < itemPhotos.length; i++) {
        await uploadItemImage(user.id, item.id, itemPhotos[i], i);
      }

      // Upload optional video for Shorts
      if (videoFile) {
        const { supabase: sb } = await import("@/integrations/supabase/client");
        const ext = videoFile.name.split(".").pop();
        const videoPath = `${user.id}/${item.id}/video.${ext}`;
        const { error: vUpErr } = await sb.storage.from("item-videos").upload(videoPath, videoFile, { upsert: true });
        if (!vUpErr) {
          const { data: vUrl } = sb.storage.from("item-videos").getPublicUrl(videoPath);
          // Get thumbnail from first photo if available
          const thumbUrl = itemPreviews.length > 0 ? undefined : null;
          const firstImage = itemPhotos.length > 0 ? undefined : null;
          // Use the first uploaded image as thumbnail
          const { data: imgs } = await sb.from("item_images").select("image_url").eq("item_id", item.id).order("position").limit(1);
          const thumbnail = imgs?.[0]?.image_url || null;
          
          await sb.from("item_videos").insert({
            item_id: item.id,
            user_id: user.id,
            video_url: vUrl.publicUrl,
            thumbnail_url: thumbnail,
          });
        }
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

  const handleSubmit = async () => {
    if (!user) return;
    if (itemPhotos.length === 0) {
      toast({ title: "Adicione pelo menos uma foto", variant: "destructive" });
      return;
    }
    if (!itemName.trim()) {
      toast({ title: "Preencha o nome do item", variant: "destructive" });
      return;
    }
    if (itemName.trim().length > 120) {
      toast({ title: "Nome muito longo (máx. 120 caracteres)", variant: "destructive" });
      return;
    }
    if (!category) {
      toast({ title: "Selecione uma categoria", variant: "destructive" });
      return;
    }
    if (!condition) {
      toast({ title: "Selecione a condição do item", variant: "destructive" });
      return;
    }
    if (valueCents <= 0) {
      toast({ title: "Informe o valor de mercado", variant: "destructive" });
      return;
    }
    if (!location.trim()) {
      toast({ title: "Informe a localização", variant: "destructive" });
      return;
    }
    if (!itemDesc.trim()) {
      toast({ title: "Adicione uma descrição", variant: "destructive" });
      return;
    }

    setValidating(true);
    try {
      const validation = await validateItemPrice(itemName.trim(), category, condition, valueCents);
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

  return (
    <ScreenLayout>
      <input ref={itemInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleItemPhotos} />
      <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoSelect} />

      <AlertDialog open={priceAlert.open} onOpenChange={(open) => setPriceAlert((prev) => ({ ...prev, open }))}>
        <AlertDialogContent className="bg-card border-foreground/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Valor suspeito
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground space-y-3">
              <p>{priceAlert.reason}</p>
              {priceAlert.suggestedMin > 0 && priceAlert.suggestedMax > 0 && (
                <p className="font-medium text-foreground/80">
                  Faixa sugerida: {formatCentsDisplay(priceAlert.suggestedMin)} — {formatCentsDisplay(priceAlert.suggestedMax)}
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-primary text-primary-foreground hover:bg-primary/90">
              Corrigir valor
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleForceSubmit}
              className="bg-card border border-foreground/10 text-foreground hover:bg-card/80"
            >
              Cadastrar mesmo assim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
            <div className="flex gap-3 overflow-x-auto no-scrollbar px-1 pt-1">
              {itemPreviews.map((url, i) => (
                <div key={i} className="relative w-24 h-24 rounded-2xl shrink-0 border border-primary/30">
                  <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover rounded-2xl" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-destructive flex items-center justify-center shadow-md z-10"
                  >
                    <X className="h-3 w-3 text-destructive-foreground" />
                  </button>
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

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 pl-1">Localização</label>
            <LocationSearch value={location} onChange={setLocation} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 pl-1">Valor de Mercado</label>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                value={itemValue}
                onChange={handleCurrencyChange}
                placeholder="R$ 0,00"
                className="flex-1 bg-card/50 border border-foreground/10 text-foreground rounded-xl px-5 py-4 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:text-foreground/20"
              />
              <button
                type="button"
                onClick={handleSuggestPrice}
                disabled={suggestingPrice || !itemName.trim() || !category}
                className="px-4 py-3 rounded-xl bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider hover:bg-primary/20 transition-all disabled:opacity-30 flex items-center gap-1.5 shrink-0"
              >
                {suggestingPrice ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Sugerir
              </button>
            </div>
          </div>
        </div>

        {/* Trade Range */}
        {valueCents > 0 && (
          <TradeRangeCard
            valueCents={valueCents}
            marginDown={devalorization}
            marginUp={valorization}
            onMarginDownChange={setDevalorization}
            onMarginUpChange={setValorization}
          />
        )}
      </main>

      {/* Submit */}
      <div className="relative z-50 w-full p-6 pb-10 bg-gradient-to-t from-background via-background to-transparent shrink-0">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full h-14 rounded-full bg-primary text-primary-foreground font-bold text-lg uppercase tracking-wider hover:opacity-90 transition-all active:scale-[0.98] neon-glow flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {validating ? (
            <><Loader2 className="h-5 w-5 animate-spin" /><span>Verificando valor...</span></>
          ) : saving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <><Check className="h-5 w-5" /><span>Cadastrar Item</span></>
          )}
        </button>
      </div>
    </ScreenLayout>
  );
};

export default NovoItem;
