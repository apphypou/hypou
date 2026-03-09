import { MapPin, Loader2 } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";

interface LocationSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    osm_id: number;
    name?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

const LocationSearch = ({ value, onChange, placeholder = "Cidade, Estado" }: LocationSearchProps) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

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
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&countrycodes=br&limit=5&q=${encodeURIComponent(q)}`,
        { headers: { "Accept-Language": "pt-BR" } }
      );
      const data: NominatimResult[] = await res.json();
      setResults(data);
      setIsOpen(data.length > 0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(val), 400);
  };

  const handleSelect = (result: NominatimResult) => {
    // Extract city/state from display_name
    const parts = result.display_name.split(", ");
    const short = parts.length >= 2 ? `${parts[0]}, ${parts[1]}` : result.display_name;
    setQuery(short);
    onChange(short);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
      {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin z-10" />}
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onFocus={() => results.length > 0 && setIsOpen(true)}
        placeholder={placeholder}
        maxLength={100}
        className="w-full bg-card/50 border border-foreground/10 text-foreground rounded-xl pl-12 pr-5 py-4 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:text-foreground/20"
      />

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-foreground/10 rounded-xl overflow-hidden shadow-lg">
          {results.map((r) => {
            const parts = r.display_name.split(", ");
            const short = parts.length >= 2 ? `${parts[0]}, ${parts[1]}` : r.display_name;
            return (
              <button
                key={r.place_id}
                type="button"
                onClick={() => handleSelect(r)}
                className="w-full px-4 py-3 text-left text-sm text-foreground hover:bg-primary/10 transition-colors flex items-center gap-3 border-b border-foreground/5 last:border-b-0"
              >
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <span className="font-medium block truncate">{short}</span>
                  {parts.length > 2 && (
                    <span className="text-xs text-muted-foreground truncate block">{r.display_name}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
