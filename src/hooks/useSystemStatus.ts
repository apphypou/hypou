import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SystemIncident {
  id: string;
  title: string;
  status: "investigating" | "identified" | "monitoring" | "resolved";
  severity: "minor" | "major" | "critical";
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  created_by: string;
  updates?: IncidentUpdate[];
}

export interface IncidentUpdate {
  id: string;
  incident_id: string;
  status: string;
  message: string;
  created_at: string;
  created_by: string;
}

export interface UptimeCheck {
  id: string;
  component: string;
  status: string;
  latency_ms: number | null;
  checked_at: string;
}

export function useIncidents() {
  return useQuery<SystemIncident[]>({
    queryKey: ["system-incidents"],
    queryFn: async () => {
      const { data: incidents, error } = await supabase
        .from("system_incidents")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      // Fetch updates for each incident
      const ids = (incidents || []).map((i: any) => i.id);
      let updates: any[] = [];
      if (ids.length > 0) {
        const { data } = await supabase
          .from("incident_updates")
          .select("*")
          .in("incident_id", ids)
          .order("created_at", { ascending: false });
        updates = data || [];
      }

      return (incidents || []).map((incident: any) => ({
        ...incident,
        updates: updates.filter((u: any) => u.incident_id === incident.id),
      }));
    },
    refetchInterval: 30000,
  });
}

export function useUptimeHistory(component?: string) {
  return useQuery<UptimeCheck[]>({
    queryKey: ["uptime-checks", component],
    queryFn: async () => {
      let query = supabase
        .from("uptime_checks")
        .select("*")
        .order("checked_at", { ascending: false })
        .limit(500);

      if (component) {
        query = query.eq("component", component);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
  });
}

export function useCreateIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string; severity: string; message: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: incident, error } = await supabase
        .from("system_incidents")
        .insert({
          title: input.title,
          severity: input.severity,
          status: "investigating",
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Add initial update
      await supabase.from("incident_updates").insert({
        incident_id: incident.id,
        status: "investigating",
        message: input.message,
        created_by: user.id,
      });

      return incident;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["system-incidents"] }),
  });
}

export function useUpdateIncidentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { incidentId: string; status: string; message: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const updateData: any = { status: input.status };
      if (input.status === "resolved") {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error: incError } = await supabase
        .from("system_incidents")
        .update(updateData)
        .eq("id", input.incidentId);

      if (incError) throw incError;

      const { error: updError } = await supabase
        .from("incident_updates")
        .insert({
          incident_id: input.incidentId,
          status: input.status,
          message: input.message,
          created_by: user.id,
        });

      if (updError) throw updError;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["system-incidents"] }),
  });
}
