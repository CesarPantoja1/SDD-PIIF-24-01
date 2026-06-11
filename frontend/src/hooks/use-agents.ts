import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { DEFAULT_AGENTS } from "@/lib/constants";
import type { AgentsConfig } from "@/lib/types";

function merge(cfg: any): AgentsConfig {
  return { ...DEFAULT_AGENTS, ...(cfg ?? {}) };
}

export function useAgentPrefs() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const key = ["agent_prefs", user?.id];
  const { data } = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async (): Promise<AgentsConfig> => {
      const { data } = await supabase
        .from("agent_prefs")
        .select("config")
        .eq("user_id", user!.id)
        .maybeSingle();
      return merge(data?.config);
    },
    initialData: DEFAULT_AGENTS,
  });
  const setPrefs = useCallback(async (next: AgentsConfig) => {
    qc.setQueryData(key, next);
    if (!user) return;
    await supabase
      .from("agent_prefs")
      .upsert({ user_id: user.id, config: next as any }, { onConflict: "user_id" } as any);
  }, [qc, user]);
  return [data ?? DEFAULT_AGENTS, setPrefs] as const;
}

export function useProjectAgents(projectId: string) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [prefs] = useAgentPrefs();
  const key = ["project_agents", projectId];
  const { data } = useQuery({
    queryKey: key,
    enabled: !!user && !!projectId,
    queryFn: async (): Promise<AgentsConfig> => {
      const { data } = await supabase
        .from("projects")
        .select("agents_config")
        .eq("id", projectId)
        .maybeSingle();
      const cfg = data?.agents_config as any;
      if (!cfg || Object.keys(cfg).length === 0) return prefs;
      return merge(cfg);
    },
    initialData: prefs,
  });
  const setAgents = useCallback(async (next: AgentsConfig) => {
    qc.setQueryData(key, next);
    await supabase.from("projects").update({ agents_config: next as any }).eq("id", projectId);
  }, [qc, projectId]);
  return [data ?? prefs, setAgents] as const;
}
