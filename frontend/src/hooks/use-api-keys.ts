import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { DEFAULT_KEYS } from "@/lib/constants";
import type { ApiKeys } from "@/lib/types";

export function useApiKeys() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const key = ["api_keys", user?.id];
  const { data } = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async (): Promise<ApiKeys> => {
      const { data } = await supabase
        .from("api_keys")
        .select("keys")
        .eq("user_id", user!.id)
        .maybeSingle();
      return { ...DEFAULT_KEYS, ...((data?.keys as Partial<ApiKeys>) ?? {}) };
    },
    initialData: DEFAULT_KEYS,
  });
  const setKeys = useCallback(async (next: ApiKeys) => {
    qc.setQueryData(key, next);
    if (!user) return;
    await supabase
      .from("api_keys")
      .upsert({ user_id: user.id, keys: next as any }, { onConflict: "user_id" } as any);
  }, [qc, user]);
  return [data ?? DEFAULT_KEYS, setKeys] as const;
}
