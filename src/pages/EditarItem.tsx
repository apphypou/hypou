import { ArrowLeft, Camera, Plus, Loader2, Check, Trash2, AlertTriangle, X, Sparkles, Video } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { updateItem, uploadItemImage, getItemById, deleteItemImage, validateItemPrice } from "@/services/itemService";
import { supabase } from "@/integrations/supabase/client";
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
import TradeRangeCard from "@/components/TradeRangeCard";
import LocationSearch from "@/components/LocationSearch";
import { categories, conditions } from "@/constants/categories";

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

const formatCentsDisplay = (cents: number): string => {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const EditarItem = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const itemInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

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
  const [suggestingPrice, setSuggestingPrice] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [existingVideo, setExistingVideo] = useState<any>(null);
  const [priceAlert, setPriceAlert] = useState<{
    open: boolean;
    reason: string;
    suggestedMin: number;
    suggestedMax: number;
  }>({ open: false, reason: "", suggestedMin: 0, suggestedMax: 0 });

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
      // Fetch existing video
      supabase
        .from("item_videos")
        .select("id, video_url, thumbnail_url")
        .eq("item_id", item.id)
        .limit(1)
        .then(({ data }) => {
          if (data && data.length > 0) setExistingVideo(data[0]);
        });
    }
  }, [item]);

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

  const removeVideo = async () => {
    if (existingVideo) {
      await supabase.from("item_videos").delete().eq("id", existingVideo.id);
      setExistingVideo(null);
    }
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoFile(null);
    setVideoPreview(null);
  };

  const totalImages = existingImages.length + newPhotos.length;
  const valueCents = parseCurrencyToCents(itemValue);

  const handleNewPhotos = async (e?: React.ChangeEvent<HTMLInputElement>) => {
    if (isNativePlatform()) {
      const maxNew = 5 - totalImages;
      const results = await pickPhotos({ multiple: true, maxFiles: maxNew });
      if (results.length > 0) {
        setNewPhotos((prev) => [...prev, ...results.map((r) => r.file)]);
        setNewPreviews((prev) => [...prev, ...results.map((r) => r.previewUrl)]);
      }
      return;
    }
    if (!e) return;
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
        toast({ title: "💡 Preço sugerido!", description: `Baseado em preços reais: ${formatCentsDisplay(result.suggestedMin)} — ${formatCentsDisplay(result.suggestedMax)}` });
      } else {
        toast({ title: "Não foi possível sugerir um preço", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro ao buscar preço", variant: "destructive" });
    } finally {
      setSuggestingPrice(false);
    }
  };

  const saveItem = async () => {
    if (!user || !itemId) return;
    setSaving(true);
    try {
      await updateItem(itemId, {
        name: itemName.trim(),
        description: itemDesc.trim().slice(0, 500) || null,
        category,
        condition,
        location: location.trim() || null,
        market_value: valueCents,
        margin_up: valorization,
        margin_down: devalorization,
      });

      for (let i = 0; i < newPhotos.length; i++) {
        const position = existingImages.length + i;
        await uploadItemImage(user.id, itemId, newPhotos[i], position);
      }

      // Upload new video if selected
      if (videoFile) {
        const ext = videoFile.name.split(".").pop();
        const videoPath = `${user.id}/${itemId}/video.${ext}`;
        const { error: vUpErr } = await supabase.storage.from("item-videos").upload(videoPath, videoFile, { upsert: true });
        if (!vUpErr) {
          const { data: vUrl } = supabase.storage.from("item-videos").getPublicUrl(videoPath);
          const { data: imgs } = await supabase.from("item_images").select("image_url").eq("item_id", itemId).order("position").limit(1);
          const thumbnail = imgs?.[0]?.image_url || null;
          // Remove old video entry if exists
          if (existingVideo) {
            await supabase.from("item_videos").delete().eq("id", existingVideo.id);
          }
          await supabase.from("item_videos").insert({
            item_id: itemId,
            user_id: user.id,
            video_url: vUrl.publicUrl,
            thumbnail_url: thumbnail,
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: ["my-items"] });
      queryClient.invalidateQueries({ queryKey: ["item-detail", itemId] });
      queryClient.invalidateQueries({ queryKey: ["shorts-feed"] });
      toast({ title: "Item atualizado com sucesso!" });
      navigate("/meu-perfil");
    } catch (err: any) {
      toast({ title: "Erro ao atualizar item", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !itemId) return;
    const totalImgs = existingImages.length + newPhotos.length;
    if (totalImgs === 0) {
      toast({ title: "Adicione pelo menos uma foto", variant: "destructive" });
      return;
    }
    if (!itemName.trim()) {
      toast({ title: "Preencha o nome do item", variant: "destructive" });
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
              Salvar mesmo assim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-1 pt-1">
            {existingImages.map((img) => (
              <div key={img.id} className="relative w-24 h-24 rounded-2xl shrink-0 border border-primary/30">
                <img src={img.image_url} alt="Foto" className="w-full h-full object-cover rounded-2xl" />
                <button
                  type="button"
                  onClick={() => handleRemoveExistingImage(img.id)}
                  className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-destructive flex items-center justify-center shadow-md z-10"
                >
                  <X className="h-3 w-3 text-destructive-foreground" />
                </button>
              </div>
            ))}
            {newPreviews.map((url, i) => (
              <div key={`new-${i}`} className="relative w-24 h-24 rounded-2xl shrink-0 border border-primary/30">
                <img src={url} alt={`Nova foto ${i + 1}`} className="w-full h-full object-cover rounded-2xl" />
                <button
                  type="button"
                  onClick={() => {
                    URL.revokeObjectURL(newPreviews[i]);
                    setNewPhotos((prev) => prev.filter((_, idx) => idx !== i));
                    setNewPreviews((prev) => prev.filter((_, idx) => idx !== i));
                  }}
                  className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-destructive flex items-center justify-center shadow-md z-10"
                >
                  <X className="h-3 w-3 text-destructive-foreground" />
                </button>
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

        {/* Video (optional) */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 pl-1">
            Vídeo <span className="text-foreground/30 normal-case">(opcional — aparece na Vitrine)</span>
          </label>
          {videoPreview || existingVideo ? (
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-primary/30">
              <video
                src={videoPreview || existingVideo?.video_url}
                className="w-full h-full object-cover"
                controls
                preload="metadata"
              />
              <button
                type="button"
                onClick={removeVideo}
                className="absolute top-2 right-2 h-8 w-8 rounded-full bg-destructive flex items-center justify-center shadow-md z-10"
              >
                <X className="h-4 w-4 text-destructive-foreground" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="w-full py-4 rounded-2xl bg-card border border-foreground/10 border-dashed flex items-center justify-center gap-3 cursor-pointer hover:bg-card/80 transition-all"
            >
              <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                <Video className="h-5 w-5 text-primary/60" />
              </div>
              <div className="text-left">
                <span className="text-sm font-bold text-primary block">Adicionar vídeo</span>
                <span className="text-[11px] text-muted-foreground">Até 50MB · Aparece na aba Vitrine</span>
              </div>
            </button>
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
            <><Check className="h-5 w-5" /><span>Salvar Alterações</span></>
          )}
        </button>
      </div>
    </ScreenLayout>
  );
};

export default EditarItem;
