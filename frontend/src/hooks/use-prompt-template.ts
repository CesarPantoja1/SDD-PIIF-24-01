import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { DEFAULT_PROMPTS } from "@/lib/constants";
import type { AgentSlotKey } from "@/lib/types";

export function usePromptTemplate(scope: "global" | string, slot: AgentSlotKey) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const key = ["prompt", user?.id, scope, slot];
  const { data } = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async (): Promise<string> => {
      const { data } = await supabase.from("prompts")
        .select("content").eq("user_id", user!.id).eq("scope", scope).eq("slot", slot).maybeSingle();
      return data?.content ?? DEFAULT_PROMPTS[slot];
    },
    initialData: DEFAULT_PROMPTS[slot],
  });
  const setContent = useCallback(async (next: string) => {
    qc.setQueryData(key, next);
    if (!user) return;
    await supabase.from("prompts").upsert(
      { user_id: user.id, scope, slot, content: next },
      { onConflict: "user_id,scope,slot" } as any
    );
  }, [qc, user, scope, slot]);
  return [data ?? DEFAULT_PROMPTS[slot], setContent] as const;
}
