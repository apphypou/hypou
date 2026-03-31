import { ArrowLeft, Search, SlidersHorizontal, X, ArrowUpDown, Loader2 } from "lucide-react";
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { searchItems, type SearchFilters } from "@/services/searchService";
import ScreenLayout from "@/components/ScreenLayout";
import BottomNav from "@/components/BottomNav";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatePresence, motion } from "framer-motion";

import { categories, conditions } from "@/constants/categories";

const formatValue = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

const SORT_OPTIONS = [
  { value: "recent" as const, label: "Mais recentes" },
  { value: "price_asc" as const, label: "Menor preço" },
  { value: "price_desc" as const, label: "Maior preço" },
];

const Busca = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [category, setCategory] = useState<string | null>(null);
  const [condition, setCondition] = useState<string | null>(null);
  const [sort, setSort] = useState<"recent" | "price_asc" | "price_desc">("recent");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const debounceRef = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleQueryChange = useCallback((val: string) => {
    setQuery(val);
    if (debounceRef[0]) clearTimeout(debounceRef[0]);
    const timeout = setTimeout(() => setDebouncedQuery(val), 400);
    debounceRef[0] = timeout;
  }, [debounceRef]);

  const filters: SearchFilters = useMemo(() => ({
    query: debouncedQuery,
    category: category || undefined,
    condition: condition || undefined,
    sort,
  }), [debouncedQuery, category, condition, sort]);

  const hasFilters = !!debouncedQuery || !!category || !!condition;

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["search-items", user?.id, filters],
    queryFn: () => searchItems(user!.id, filters),
    enabled: !!user && hasFilters,
    staleTime: 30_000,
  });

  const clearFilters = () => {
    setQuery("");
    setDebouncedQuery("");
    setCategory(null);
    setCondition(null);
    setSort("recent");
  };

  const activeFilterCount = [category, condition].filter(Boolean).length;

  return (
    <ScreenLayout>
      <header className="relative z-40 flex w-full items-center gap-3 px-5 pt-6 pb-2 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="h-10 w-10 rounded-full flex items-center justify-center bg-card border border-foreground/10 text-foreground/60 hover:text-foreground transition-all shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/30" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Buscar itens..."
            autoFocus
            className="w-full bg-card border border-foreground/10 text-foreground rounded-full pl-11 pr-10 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:text-foreground/30"
          />
          {query && (
            <button
              onClick={() => handleQueryChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-foreground/10 flex items-center justify-center"
            >
              <X className="h-3 w-3 text-foreground/50" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`h-10 w-10 rounded-full flex items-center justify-center transition-all shrink-0 relative ${
            showFilters || activeFilterCount > 0
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-foreground/10 text-foreground/50"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </header>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden px-5 shrink-0"
          >
            <div className="py-3 space-y-3">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Categoria</p>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((cat) => (
                    <button
                      key={cat.label}
                      onClick={() => setCategory(category === cat.label ? null : cat.label)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        category === cat.label
                          ? "bg-primary text-primary-foreground"
                          : "bg-card border border-foreground/10 text-foreground/50"
                      }`}
                    >
                      {cat.emoji} {cat.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Condição</p>
                <div className="flex flex-wrap gap-1.5">
                  {conditions.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setCondition(condition === c.value ? null : c.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        condition === c.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-card border border-foreground/10 text-foreground/50"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Ordenar por</p>
                <div className="flex flex-wrap gap-1.5">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSort(opt.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                        sort === opt.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-card border border-foreground/10 text-foreground/50"
                      }`}
                    >
                      <ArrowUpDown className="h-3 w-3" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {(category || condition) && (
                <button
                  onClick={clearFilters}
                  className="text-primary text-xs font-bold uppercase tracking-wider"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <main className="flex-1 w-full px-5 overflow-y-auto no-scrollbar pb-28">
        {!hasFilters ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4"
            >
              <Search className="h-10 w-10 text-primary/50" />
            </motion.div>
            <h2 className="text-lg font-bold text-foreground mb-1">Busque por itens</h2>
            <p className="text-muted-foreground text-sm max-w-xs">
              Digite o nome do item ou use os filtros para encontrar o que procura.
            </p>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-2 gap-3 mt-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-52 rounded-2xl" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="h-20 w-20 rounded-2xl bg-foreground/5 flex items-center justify-center mb-4"
            >
              <span className="text-4xl">😕</span>
            </motion.div>
            <h2 className="text-lg font-bold text-foreground mb-1">Nenhum resultado</h2>
            <p className="text-muted-foreground text-sm max-w-xs">
              Tente buscar com outros termos ou remova os filtros.
            </p>
            <button onClick={clearFilters} className="mt-4 text-primary text-xs font-bold uppercase tracking-wider">
              Limpar busca
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mt-3 mb-2">{results.length} resultado{results.length !== 1 ? "s" : ""}</p>
            <div className="grid grid-cols-2 gap-3">
              {results.map((item: any) => {
                const mainImage = item.item_images?.sort((a: any, b: any) => a.position - b.position)[0];
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl bg-card border border-foreground/5 overflow-hidden cursor-pointer hover:border-primary/30 transition-all"
                    onClick={() => navigate(`/explorar`)}
                  >
                    <div className="aspect-square relative">
                      {mainImage ? (
                        <img
                          src={mainImage.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center text-foreground/10 text-xs">
                          Sem foto
                        </div>
                      )}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                        <span className="text-white text-xs font-bold">
                          {formatValue(item.market_value)}
                        </span>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-0.5">
                        {item.category}
                      </p>
                      <h3 className="text-sm font-bold text-foreground leading-tight truncate">
                        {item.name}
                      </h3>
                      {item.profiles?.display_name && (
                        <p className="text-[10px] text-muted-foreground mt-1 truncate">
                          por {item.profiles.display_name}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </main>

      <BottomNav activeTab="explorar" />
    </ScreenLayout>
  );
};

export default Busca;
