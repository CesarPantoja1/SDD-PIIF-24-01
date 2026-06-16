import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMe, updateMe } from "@/lib/api/api";
import { useAuth } from "./use-auth";

export type ProfileData = { name: string; email: string; role: string; bio: string };

const empty: ProfileData = { name: "", email: "", role: "", bio: "" };

export function useProfile() {
  const qc = useQueryClient();
  const { user, session } = useAuth();
  const token = session?.access_token ?? null;
  const key = ["profile", user?.id];

  const { data } = useQuery({
    queryKey: key,
    enabled: !!user && !!token,
    queryFn: async (): Promise<ProfileData> => {
      const profile = await fetchMe(token!);
      return {
        name: profile.display_name ?? user!.email?.split("@")[0] ?? "",
        email: profile.email ?? user!.email ?? "",
        role: profile.role ?? "user",
        bio: (user!.user_metadata as Record<string, unknown>)?.bio as string ?? "",
      };
    },
    initialData: empty,
  });

  const setProfile = useCallback(
    async (next: ProfileData) => {
      qc.setQueryData(key, next);
      if (!user || !token) return;
      await updateMe(token, next.name);
    },
    [qc, user, token] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return [data ?? empty, setProfile] as const;
}
