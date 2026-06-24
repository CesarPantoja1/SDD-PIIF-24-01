import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { DEFAULT_PROMPTS } from "@/lib/constants";
import { apiClient } from "@/lib/api/client";
import type { AgentSlotKey } from "@/lib/types";

const BACKEND_SLOTS = new Set(["discovery.creator", "discovery.reviewer", "specs.creator", "specs.reviewer"]);

export function usePromptTemplate(scope: "global" | string, slot: AgentSlotKey) {
  const qc = useQueryClient();
  const { user, session } = useAuth();
  const token = session?.access_token ?? null;
  const isBackendSlot = BACKEND_SLOTS.has(slot);
  const key = ["prompt", user?.id, scope, slot];

  // For backend-managed slots: load from backend agent_configs
  const { data: backendData } = useQuery({
    queryKey: ["agent_configs"],
    enabled: isBackendSlot && !!token,
    staleTime: 60_000,
    queryFn: async () => {
      return apiClient.get<{ configs: Record<string, { system_prompt: string }> }>(
        "/agents/configs",
        token,
      );
    },
    initialData: { configs: {} },
  });

  const backendPrompt = isBackendSlot
    ? backendData?.configs?.[slot]?.system_prompt
    : undefined;

  const fallback = DEFAULT_PROMPTS[slot] ?? "";

  const { data } = useQuery({
    queryKey: key,
    enabled: false,
    queryFn: async (): Promise<string> => fallback,
    initialData: backendPrompt || fallback,
  });

  const setContent = useCallback(
    async (next: string) => {
      qc.setQueryData(key, next);
      // For backend slots: persist to backend
      if (isBackendSlot && token) {
        try {
          await apiClient.patch(`/agents/configs/${slot}`, { system_prompt: next }, token);
          qc.invalidateQueries({ queryKey: ["agent_configs"] });
        } catch {
          /* save failed silently — prompt stays in local state */
        }
      }
    },
    [qc, token, isBackendSlot, slot],
  );

  return [data ?? fallback, setContent] as const;
}
