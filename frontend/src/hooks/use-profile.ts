import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export type ProfileData = { name: string; email: string; role: string; bio: string };

const empty: ProfileData = { name: "", email: "", role: "", bio: "" };

export function useProfile() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const key = ["profile", user?.id];
  const { data } = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async (): Promise<ProfileData> => {
      const { data } = await supabase.from("profiles")
        .select("display_name").eq("id", user!.id).maybeSingle();
      return {
        name: data?.display_name ?? user!.email?.split("@")[0] ?? "",
        email: user!.email ?? "",
        role: (user!.user_metadata as any)?.role ?? "",
        bio: (user!.user_metadata as any)?.bio ?? "",
      };
    },
    initialData: empty,
  });
  const setProfile = useCallback(async (next: ProfileData) => {
    qc.setQueryData(key, next);
    if (!user) return;
    await supabase.from("profiles").update({ display_name: next.name }).eq("id", user.id);
    await supabase.auth.updateUser({ data: { role: next.role, bio: next.bio } });
  }, [qc, user]);
  return [data ?? empty, setProfile] as const;
}
