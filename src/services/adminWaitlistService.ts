import { supabase } from "@/integrations/supabase/client";

export type WaitlistEntry = {
  id: string;
  position: number;
  email: string;
  referral_code: string;
  referred_by: string | null;
  created_at: string;
  converted_at: string | null;
};

export type WaitlistPage = {
  entries: WaitlistEntry[];
  total: number;
  convertedCount: number;
  page: number;
  pageSize: number;
};

async function invoke(action: "list" | "export", input: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke("admin-waitlist", { body: { action, ...input } });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function getAdminWaitlistPage(page: number, query: string): Promise<WaitlistPage> {
  return invoke("list", { page, pageSize: 25, query }) as Promise<WaitlistPage>;
}

export async function exportAdminWaitlist(query: string): Promise<WaitlistEntry[]> {
  const data = await invoke("export", { query });
  return data.entries as WaitlistEntry[];
}
