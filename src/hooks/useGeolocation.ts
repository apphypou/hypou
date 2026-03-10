import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface GeoPosition {
  lat: number;
  lng: number;
}

export const useGeolocation = (userId: string | undefined) => {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(async () => {
    if (!userId) return;
    if (!navigator.geolocation) {
      setError("Geolocalização não suportada");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPosition(coords);

        // Save to profile
        try {
          await supabase
            .from("profiles")
            .update({
              latitude: coords.lat,
              longitude: coords.lng,
            })
            .eq("user_id", userId);
        } catch (err) {
          console.error("Failed to save location:", err);
        }

        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, [userId]);

  // Try to get cached position on mount
  useEffect(() => {
    if (!userId) return;
    navigator.geolocation?.getCurrentPosition(
      (pos) => setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 }
    );
  }, [userId]);

  return { position, loading, error, requestLocation };
};
