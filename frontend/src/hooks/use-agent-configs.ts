import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { apiClient } from "@/lib/api/client";

type AgentConfig = {
  provider: string;
  model: string;
  system_prompt: string;
};

type AgentConfigsResponse = {
  configs: Record<string, AgentConfig>;
};

const DISCOVERY_SLOTS = ["discovery.creator", "discovery.reviewer"] as const;

export function useAgentConfigs() {
  const { session } = useAuth();
  const token = session?.access_token ?? null;
  const qc = useQueryClient();
  const queryKey = ["agent_configs"];

  const { data, isLoading } = useQuery({
    queryKey,
    enabled: !!token,
    staleTime: 60_000,
    queryFn: async (): Promise<AgentConfigsResponse> => {
      return apiClient.get<AgentConfigsResponse>("/agents/configs", token);
    },
    initialData: { configs: {} },
  });

  const saveConfig = useCallback(
    async (slotKey: string, config: AgentConfig) => {
      await apiClient.put(`/agents/configs/${slotKey}`, config, token);
      qc.invalidateQueries({ queryKey });
    },
    [token, qc],
  );

  /** Get the system_prompt for a specific slot (with fallback). */
  const getPrompt = useCallback(
    (slotKey: string, fallback: string): string => {
      return data?.configs?.[slotKey]?.system_prompt || fallback;
    },
    [data],
  );

  /** Check if a config was loaded from backend (user has saved one). */
  const isConfigured = useCallback(
    (slotKey: string): boolean => {
      const cfg = data?.configs?.[slotKey];
      return !!(cfg && cfg.system_prompt);
    },
    [data],
  );

  return {
    configs: data?.configs ?? {},
    isLoading,
    saveConfig,
    getPrompt,
    isConfigured,
  } as const;
}
