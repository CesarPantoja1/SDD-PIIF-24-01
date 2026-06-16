import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
// import { supabase } from "@/integrations/supabase/client"; // Habilitar cuando prompts esté en scope
import { useAuth } from "./use-auth";
import { DEFAULT_PROMPTS } from "@/lib/constants";
import type { AgentSlotKey } from "@/lib/types";

export function usePromptTemplate(scope: "global" | string, slot: AgentSlotKey) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const key = ["prompt", user?.id, scope, slot];
  const { data } = useQuery({
    queryKey: key,
    enabled: false, // Deshabilitado hasta que la tabla prompts esté en scope (iter. futura)
    queryFn: async (): Promise<string> => {
      // TODO (iteración futura): implementar con tabla prompts vía backend
      /*
      const { data } = await supabase
        .from("prompts")
        .select("content")
        .eq("user_id", user!.id)
        .eq("scope", scope)
        .eq("slot", slot)
        .maybeSingle();
      return data?.content ?? DEFAULT_PROMPTS[slot];
      */
      return DEFAULT_PROMPTS[slot];
    },
    initialData: DEFAULT_PROMPTS[slot],
  });
  const setContent = useCallback(async (next: string) => {
    qc.setQueryData(key, next);
    // TODO (iteración futura): persistir en tabla prompts vía backend
    /*
    if (!user) return;
    const { data: existing } = await supabase
      .from("prompts").select("id")
      .eq("user_id", user.id).eq("scope", scope).eq("slot", slot)
      .maybeSingle();
    if (existing?.id) {
      await supabase.from("prompts").update({ content: next }).eq("id", existing.id);
    } else {
      await supabase.from("prompts").insert({ user_id: user.id, scope, slot, content: next });
    }
    */
  }, [qc, user, scope, slot]); // eslint-disable-line react-hooks/exhaustive-deps
  return [data ?? DEFAULT_PROMPTS[slot], setContent] as const;
}
