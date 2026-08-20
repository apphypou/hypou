import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AdminRole = "admin" | "moderator";

export function useAdminRole(userId?: string) {
  return useQuery<AdminRole[]>({
    queryKey: ["admin-staff-role", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId!).in("role", ["admin", "moderator"]);
      if (error) throw error;
      return (data || []).map((entry) => entry.role as AdminRole);
    },
    enabled: Boolean(userId),
  });
}
