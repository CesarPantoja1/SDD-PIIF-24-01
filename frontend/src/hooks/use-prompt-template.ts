import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { useAgentConfigs } from "./use-agent-configs";
import { DEFAULT_PROMPTS } from "@/lib/constants";
import { apiClient } from "@/lib/api/client";
import type { AgentSlotKey } from "@/lib/types";

const DISCOVERY_SLOTS = new Set(["discovery.creator", "discovery.reviewer"]);

export function usePromptTemplate(scope: "global" | string, slot: AgentSlotKey) {
  const qc = useQueryClient();
  const { user, session } = useAuth();
  const token = session?.access_token ?? null;
  const isDiscoverySlot = DISCOVERY_SLOTS.has(slot);
  const key = ["prompt", user?.id, scope, slot];

  // For discovery slots: load from backend agent_configs
  const { data: backendData } = useQuery({
    queryKey: ["agent_configs"],
    enabled: isDiscoverySlot && !!token,
    staleTime: 60_000,
    queryFn: async () => {
      return apiClient.get<{ configs: Record<string, { system_prompt: string }> }>(
        "/agents/configs",
        token,
      );
    },
    initialData: { configs: {} },
  });

  const backendPrompt = isDiscoverySlot
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
      // For discovery slots: persist to backend
      if (isDiscoverySlot && token) {
        try {
          await apiClient.patch(`/agents/configs/${slot}`, { system_prompt: next }, token);
          qc.invalidateQueries({ queryKey: ["agent_configs"] });
        } catch {
          /* save failed silently — prompt stays in local state */
        }
      }
    },
    [qc, token, isDiscoverySlot, slot],
  );

  return [data ?? fallback, setContent] as const;
}
