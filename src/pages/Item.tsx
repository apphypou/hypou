import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Package, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatValue, CONDITION_MAP } from "@/lib/utils";
import NeonButton from "@/components/NeonButton";
import HypouLogo from "@/components/HypouLogo";
import { useAuth } from "@/hooks/useAuth";
import { cdnFull, cdnBlur } from "@/lib/imageUrl";

const Item = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState<any>(null);
  const [owner, setOwner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    if (!itemId) return;
    (async () => {
      const { data, error } = await supabase
        .from("items")
        .select("*, item_images (id, image_url, position)")
        .eq("id", itemId)
        .maybeSingle();
      if (!error && data) {
        setItem(data);
        const { data: prof } = await supabase
          .from("public_profiles")
          .select("user_id, display_name, avatar_url, city, state")
          .eq("user_id", data.user_id)
          .maybeSingle();
        setOwner(prof);
      }
      setLoading(false);
    })();
  }, [itemId]);

  const images = (item?.item_images || []).sort((a: any, b: any) => a.position - b.position);
  const conditionLabel = item?.condition ? (CONDITION_MAP[item.condition] || item.condition) : null;

  const handleShare = () => {
    const url = window.location.href;
    const data = {
      title: `${item?.name} — Hypou`,
      text: `Olha esse item no Hypou: ${item?.name}! Quer trocar?`,
      url,
    };
    if (navigator.share) navigator.share(data).catch(() => {});
    else navigator.clipboard.writeText(url);
  };

  const handleOpenApp = () => {
    if (user) navigate("/explorar");
    else navigate("/cadastro");
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-6 text-center gap-4">
        <HypouLogo />
        <h1 className="text-xl font-bold text-foreground">Item não encontrado</h1>
        <p className="text-sm text-muted-foreground">Esse anúncio pode ter sido removido ou já foi trocado.</p>
        <NeonButton onClick={() => navigate("/explorar")}>Explorar outros itens</NeonButton>
      </div>
    );
  }

  const heroImage = images[activeImg]?.image_url;

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Header */}
      <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between p-4">
        <button
          onClick={() => navigate(-1)}
          className="h-10 w-10 rounded-full bg-scrim/40 backdrop-blur-xl border border-on-media/10 flex items-center justify-center"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5 text-on-media" />
        </button>
        <button
          onClick={handleShare}
          className="h-10 w-10 rounded-full bg-scrim/40 backdrop-blur-xl border border-on-media/10 flex items-center justify-center"
          aria-label="Compartilhar"
        >
          <Share2 className="h-5 w-5 text-on-media" />
        </button>
      </div>

      {/* Hero image */}
      <div className="relative w-full aspect-square bg-card overflow-hidden">
        {heroImage ? (
          <>
            <img src={cdnBlur(heroImage)} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-50" />
            <img src={cdnFull(heroImage)} alt={item.name} className="relative w-full h-full object-contain" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
        {images.length > 1 && (
          <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-1.5">
            {images.map((_: any, i: number) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                className={`h-1.5 rounded-full transition-all ${i === activeImg ? "w-5 bg-on-media" : "w-1.5 bg-on-media/40"}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 px-5 py-6 space-y-5"
      >
        <div className="space-y-2">
          <span className="text-3xl font-extrabold text-primary tracking-tight">{formatValue(item.market_value)}</span>
          <h1 className="text-2xl font-bold text-foreground leading-tight">{item.name}</h1>
          <div className="flex flex-wrap gap-2">
            {item.category && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-on-media/5 border border-on-media/10 text-muted-foreground">
                {item.category}
              </span>
            )}
            {conditionLabel && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-on-media/5 border border-on-media/10 text-muted-foreground">
                {conditionLabel}
              </span>
            )}
          </div>
        </div>

        {item.description && (
          <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{item.description}</p>
        )}

        {owner && (
          <button
            onClick={() => navigate(`/usuario/${owner.user_id}`)}
            className="w-full flex items-center gap-3 p-3 rounded-2xl bg-on-media/5 border border-on-media/10 active:scale-[0.99] transition"
          >
            {owner.avatar_url ? (
              <img src={owner.avatar_url} alt={owner.display_name} className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                {owner.display_name?.[0]?.toUpperCase() || "?"}
              </div>
            )}
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-foreground">{owner.display_name}</p>
              {(owner.city || owner.state) && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {[owner.city, owner.state].filter(Boolean).join(", ")}
                </p>
              )}
            </div>
          </button>
        )}
      </motion.div>

      {/* Sticky CTA */}
      <div className="sticky bottom-0 inset-x-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
        <NeonButton onClick={handleOpenApp}>
          {user ? "Abrir no Hypou" : "Entrar pra trocar"}
        </NeonButton>
      </div>
    </div>
  );
};

export default Item;
