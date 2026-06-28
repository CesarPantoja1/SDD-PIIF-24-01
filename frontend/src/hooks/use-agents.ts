import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { apiClient } from "@/lib/api/client";
import { DEFAULT_AGENTS } from "@/lib/constants";
import type { AgentsConfig, AgentSlotKey, ProviderKey } from "@/lib/types";

type BackendConfig = { provider: string; model: string; system_prompt: string };

export function useAgentPrefs() {
  const qc = useQueryClient();
  const { session } = useAuth();
  const token = session?.access_token ?? null;

  // Load agent configs from backend
  const { data: backendData } = useQuery({
    queryKey: ["agent_configs", session?.user?.id],
    enabled: !!token,
    staleTime: 60_000,
    queryFn: async () => {
      return apiClient.get<{ configs: Record<string, BackendConfig> }>(
        "/agents/configs",
        token,
      );
    },
    initialData: { configs: {} },
  });

  // Derive AgentsConfig reactively from backend data (no disabled query needed)
  const agents = useMemo<AgentsConfig>(() => {
    return mergeBackendToAgents(backendData?.configs ?? {});
  }, [backendData]);

  const setPrefs = useCallback(
    async (next: AgentsConfig) => {
      const queryKey = ["agent_configs", session?.user?.id];

      // 1. Optimistic: update cache immediately so UI reacts instantly
      qc.setQueryData(queryKey, agentsToBackendConfigs(next));

      // 2. Sync changed slots to backend
      if (token) {
        try {
          const slotUpdates = getChangedSlots(agents, next);
          for (const slotKey of slotUpdates) {
            const spec = getSpecBySlotKey(next, slotKey);
            if (spec) {
              await apiClient.put(
                `/agents/configs/${slotKey}`,
                { provider: spec.provider, model: spec.model, system_prompt: "" },
                token,
              );
            }
          }
          // Re-fetch to confirm server state
          qc.invalidateQueries({ queryKey });
        } catch {
          /* sync failed; next fetch will restore correct state */
        }
      }
    },
    [qc, session?.user?.id, token, agents],
  );

  return [agents, setPrefs] as const;
}

export function useProjectAgents(projectId: string) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [prefs] = useAgentPrefs();
  const key = ["project_agents", projectId];

  const { data } = useQuery({
    queryKey: key,
    enabled: false,
    queryFn: async (): Promise<AgentsConfig> => prefs,
    initialData: prefs,
  });

  const setAgents = useCallback(
    async (next: AgentsConfig) => {
      qc.setQueryData(key, next);
    },
    [qc, projectId],
  );

  return [data ?? prefs, setAgents] as const;
}

// ── Helpers ──────────────────────────────────────────────────────

function mergeBackendToAgents(configs: Record<string, BackendConfig>): AgentsConfig {
  const result = { ...DEFAULT_AGENTS, configured: false };
  let hasAny = false;

  for (const [slotKey, cfg] of Object.entries(configs)) {
    if (!cfg?.provider || !cfg?.model) continue;
    hasAny = true;

  if (slotKey === "clarifier") {
    result.clarifier = { provider: cfg.provider as ProviderKey, model: cfg.model };
    } else {
      const parts = slotKey.split(".");
      if (parts.length === 2) {
        const [stage, which] = parts as [string, "creator" | "reviewer"];
        if (stage in result) {
          const stageAgents = result[stage as keyof typeof result];
          if (typeof stageAgents === "object" && stageAgents && which in stageAgents) {
            (stageAgents as Record<string, { provider: string; model: string }>)[which] = {
              provider: cfg.provider as ProviderKey,
              model: cfg.model,
            };
          }
        }
      }
    }
  }

  result.configured = hasAny;
  return result;
}

function getSpecBySlotKey(
  agents: AgentsConfig,
  slotKey: AgentSlotKey,
): { provider: ProviderKey; model: string } | null {
  if (slotKey === "clarifier") return agents.clarifier;
  const parts = slotKey.split(".");
  if (parts.length === 2) {
    const [stage, which] = parts as [string, "creator" | "reviewer"];
    if (stage in agents) {
      const stageAgents = agents[stage as keyof typeof agents];
      if (typeof stageAgents === "object" && stageAgents && which in stageAgents) {
        return (stageAgents as Record<string, { provider: string; model: string }>)[which] as { provider: ProviderKey; model: string };
      }
    }
  }
  return null;
}

function getChangedSlots(before: AgentsConfig, after: AgentsConfig): AgentSlotKey[] {
  const changed: AgentSlotKey[] = [];
  const stages = ["discovery", "specs", "requirements", "design", "tasks"] as const;
  const whiches = ["creator", "reviewer"] as const;

  for (const [key, get] of [
    ["clarifier", (a: AgentsConfig) => a.clarifier] as const,
    ...stages.flatMap((stage) =>
      whiches.map(
        (which) => [`${stage}.${which}`, (a: AgentsConfig) => a[stage][which]] as const,
      ),
    ),
  ]) {
    const sk = key as AgentSlotKey;
    const beforeSpec = get(before);
    const afterSpec = get(after);
    if (
      beforeSpec.provider !== afterSpec.provider ||
      beforeSpec.model !== afterSpec.model
    ) {
      changed.push(sk);
    }
  }

  return changed;
}

function agentsToBackendConfigs(agents: AgentsConfig): { configs: Record<string, BackendConfig> } {
  const configs: Record<string, BackendConfig> = {};
  const stages = ["discovery", "specs", "requirements", "design", "tasks"] as const;
  const whiches = ["creator", "reviewer"] as const;

  if (agents.clarifier.provider) {
    configs.clarifier = {
      provider: agents.clarifier.provider,
      model: agents.clarifier.model,
      system_prompt: "",
    };
  }

  for (const stage of stages) {
    for (const which of whiches) {
      const spec = agents[stage][which];
      if (spec.provider) {
        configs[`${stage}.${which}`] = {
          provider: spec.provider,
          model: spec.model,
          system_prompt: "",
        };
      }
    }
  }

  return { configs };
}
