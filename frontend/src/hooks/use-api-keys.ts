import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
// import { supabase } from "@/integrations/supabase/client"; // Habilitado cuando api_keys esté en scope
import { DEFAULT_KEYS } from "@/lib/constants";
import type { ApiKeys } from "@/lib/types";
// import { useAuth } from "./use-auth"; // Habilitado cuando api_keys esté en scope

export function useApiKeys() {
  const qc = useQueryClient();
  // const { user } = useAuth(); // TODO (iteración futura): conectar con tabla api_keys vía backend
  const key = ["api_keys"];
  const { data } = useQuery({
    queryKey: key,
    enabled: false, // Deshabilitado hasta que la tabla api_keys esté en scope
    queryFn: async (): Promise<ApiKeys> => {
      // TODO (iteración futura): implementar con backend
      // const { data } = await supabase.from("api_keys").select("keys").eq("user_id", user!.id).maybeSingle();
      // return { ...DEFAULT_KEYS, ...((data?.keys as Partial<ApiKeys>) ?? {}) };
      return DEFAULT_KEYS;
    },
    initialData: DEFAULT_KEYS,
  });
  const setKeys = useCallback(async (next: ApiKeys) => {
    qc.setQueryData(key, next);
    // TODO (iteración futura): persistir en backend
    // if (!user) return;
    // await supabase.from("api_keys").upsert({ user_id: user.id, keys: next as any }, { onConflict: "user_id" } as any);
  }, [qc]); // eslint-disable-line react-hooks/exhaustive-deps
  return [data ?? DEFAULT_KEYS, setKeys] as const;
}
