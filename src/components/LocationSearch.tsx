import { MapPin, Loader2 } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { formatLocationFeature, isLocationResult, type PhotonFeature } from "@/lib/locationSearch";

interface LocationSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (value: string, coords: { lat: number; lng: number }) => void;
  placeholder?: string;
}

const LocationSearch = ({ value, onChange, onSelect, placeholder = "Cidade, Estado" }: LocationSearchProps) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<PhotonFeature[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.length < 3) {
      setResults([]);
      setIsOpen(false);
      setHasSearched(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=15&lang=default`
      );
      const data = await res.json();
      const seen = new Set<string>();
      const features: PhotonFeature[] = (data.features || [])
        .filter((f: PhotonFeature) => f.properties.countrycode === "BR")
        .filter(isLocationResult)
        .filter((f: PhotonFeature) => {
          const label = formatLocationFeature(f).toLocaleLowerCase("pt-BR");
          const [lng, lat] = f.geometry.coordinates;
          const key = `${label}:${lat.toFixed(4)}:${lng.toFixed(4)}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .slice(0, 10);
      setResults(features);
      setHasSearched(true);
      setIsOpen(true);
    } catch {
      setResults([]);
      setHasSearched(true);
      setIsOpen(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(val), 300);
  };

  const handleSelect = (feature: PhotonFeature) => {
    const label = formatLocationFeature(feature);
    const [lng, lat] = feature.geometry.coordinates;
    setQuery(label);
    onChange(label);
    if (onSelect) {
      onSelect(label, { lat, lng });
    }
    setIsOpen(false);
  };

  const handleFocus = () => {
    if (results.length > 0) setIsOpen(true);
    setTimeout(() => {
      inputRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 250);
  };

  return (
    <div ref={containerRef} className="relative">
      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
      {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin z-10" />}
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleChange}
        onFocus={handleFocus}
        placeholder={placeholder}
        maxLength={100}
        className="w-full bg-card/50 border border-foreground/10 text-foreground rounded-xl pl-12 pr-5 py-4 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:text-foreground/20"
      />

      {isOpen && (
        <div
          role="listbox"
          className="absolute z-[80] w-full mt-2 max-h-[min(320px,45dvh)] overflow-y-auto overscroll-contain bg-card/95 backdrop-blur-xl border border-foreground/10 rounded-xl shadow-2xl"
        >
          {results.map((f, i) => {
            const label = formatLocationFeature(f);
            const { state } = f.properties;
            return (
              <button
                key={f.properties.osm_id || i}
                type="button"
                role="option"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(f)}
                className="w-full px-4 py-3 text-left text-sm text-foreground hover:bg-primary/10 transition-colors flex items-center gap-3 border-b border-foreground/5 last:border-b-0"
              >
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <span className="font-medium block truncate">{label}</span>
                  {state && (
                    <span className="text-xs text-muted-foreground truncate block">{state}</span>
                  )}
                </div>
              </button>
            );
          })}
          {hasSearched && results.length === 0 && !loading && (
            <p className="px-4 py-3 text-sm text-muted-foreground">
              Nenhum endereco encontrado. Tente informar cidade, bairro, rua ou CEP.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
