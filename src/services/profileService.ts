import { supabase } from "@/integrations/supabase/client";

interface ProfileUpdate {
  display_name?: string;
  location?: string | null;
  avatar_url?: string;
  onboarding_completed?: boolean;
  bio?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
}

export const updateProfile = async (userId: string, data: ProfileUpdate) => {
  const { error } = await supabase
    .from("profiles")
    .update(data)
    .eq("user_id", userId);
  if (error) throw error;
};

export const uploadAvatar = async (userId: string, file: File): Promise<string> => {
  const ext = file.name.split(".").pop();
  const path = `${userId}/avatar.${ext}`;
  
  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
};

export const saveUserCategories = async (userId: string, categories: string[]) => {
  await supabase.from("user_categories").delete().eq("user_id", userId);
  
  if (categories.length === 0) return;
  
  const rows = categories.map((category) => ({ user_id: userId, category }));
  const { error } = await supabase.from("user_categories").insert(rows);
  if (error) throw error;
};

export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (error) throw error;
  return data;
};
