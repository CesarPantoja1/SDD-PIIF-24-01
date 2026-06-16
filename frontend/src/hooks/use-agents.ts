import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
// import { supabase } from "@/integrations/supabase/client"; // Habilitado cuando agent_prefs esté en scope
import { useAuth } from "./use-auth";
import { DEFAULT_AGENTS } from "@/lib/constants";
import type { AgentsConfig } from "@/lib/types";

function merge(cfg: unknown): AgentsConfig {
  return { ...DEFAULT_AGENTS, ...(cfg ?? {}) } as AgentsConfig;
}

export function useAgentPrefs() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const key = ["agent_prefs", user?.id];
  const { data } = useQuery({
    queryKey: key,
    enabled: false, // Deshabilitado hasta que agent_prefs esté en scope
    queryFn: async (): Promise<AgentsConfig> => {
      // TODO (iteración futura): implementar con tabla agent_prefs vía backend
      // const { data } = await supabase.from("agent_prefs").select("config").eq("user_id", user!.id).maybeSingle();
      // return merge(data?.config);
      return DEFAULT_AGENTS;
    },
    initialData: DEFAULT_AGENTS,
  });
  const setPrefs = useCallback(async (next: AgentsConfig) => {
    qc.setQueryData(key, next);
    // TODO (iteración futura): persistir en tabla agent_prefs vía backend
    // if (!user) return;
    // await supabase.from("agent_prefs").upsert({ user_id: user.id, config: next as any }, { onConflict: "user_id" } as any);
  }, [qc, user]); // eslint-disable-line react-hooks/exhaustive-deps
  return [data ?? DEFAULT_AGENTS, setPrefs] as const;
}

export function useProjectAgents(projectId: string) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [prefs] = useAgentPrefs();
  const key = ["project_agents", projectId];
  const { data } = useQuery({
    queryKey: key,
    enabled: false, // Deshabilitado hasta que agents_config (projects) esté en scope
    queryFn: async (): Promise<AgentsConfig> => {
      // TODO (iteración futura): implementar con campo agents_config de projects vía backend
      // const { data } = await supabase.from("projects").select("agents_config").eq("id", projectId).maybeSingle();
      // const cfg = data?.agents_config as any;
      // if (!cfg || Object.keys(cfg).length === 0) return prefs;
      // return merge(cfg);
      return prefs;
    },
    initialData: prefs,
  });
  const setAgents = useCallback(async (next: AgentsConfig) => {
    qc.setQueryData(key, next);
    // TODO (iteración futura): persistir en projects.agents_config vía backend
    // await supabase.from("projects").update({ agents_config: next as any }).eq("id", projectId);
  }, [qc, projectId]); // eslint-disable-line react-hooks/exhaustive-deps
  return [data ?? prefs, setAgents] as const;
}
