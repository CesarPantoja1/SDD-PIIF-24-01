import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import type { ProjectMeta, SpecRef, ProjectStatus } from "@/lib/types";
import { pickSeedSpecs } from "@/lib/constants";

type Row = {
  id: string; owner_id: string; name: string; description: string;
  status: string; tags: string[]; cost: number | string; tokens: number;
  created_at: string; updated_at: string; deleted_at: string | null;
};

const rowToMeta = (r: Row, specsCount: number): ProjectMeta => ({
  id: r.id, name: r.name, description: r.description ?? "",
  status: (r.status as ProjectStatus) ?? "active",
  updatedAt: r.updated_at, cost: Number(r.cost) || 0, tokens: r.tokens || 0,
  specsCount, tags: r.tags ?? [],
});


export function useProjectsRaw() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["projects", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<ProjectMeta[]> => {
      const { data: rows, error } = await supabase
        .from("projects")
        .select("*")
        .is("deleted_at", null)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      if (!rows || rows.length === 0) return [];
      const { data: specs } = await supabase
        .from("specs")
        .select("project_id")
        .in("project_id", rows.map((r: any) => r.id));
      const counts: Record<string, number> = {};
      (specs ?? []).forEach((s: any) => { counts[s.project_id] = (counts[s.project_id] ?? 0) + 1; });
      return (rows as unknown as Row[]).map(r => rowToMeta(r, counts[r.id] ?? 0));
    },
    initialData: [],
  });
}

export function useVisibleProjects(): ProjectMeta[] {
  const { data } = useProjectsRaw();
  return data ?? [];
}

export function useProjectDisplayName(p: ProjectMeta) {
  return p.name;
}

export function useProjectById(projectId: string): ProjectMeta {
  const projects = useVisibleProjects();
  return projects.find(p => p.id === projectId) ?? {
    id: projectId, name: "", description: "", status: "active",
    updatedAt: new Date().toISOString(), cost: 0, tokens: 0, specsCount: 0, tags: [],
  };
}

export function useProjectSpecs(projectId: string) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const key = ["specs", projectId];
  const { data } = useQuery({
    queryKey: key,
    enabled: !!user && !!projectId,
    queryFn: async (): Promise<SpecRef[]> => {
      const { data, error } = await supabase
        .from("specs").select("*").eq("project_id", projectId)
        .order("position", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((s: any) => ({ id: s.id, name: s.name }));
    },
    initialData: [],
  });
  const setSpecs = useCallback(async (next: SpecRef[]) => {
    qc.setQueryData(key, next);
  }, [qc, projectId]);
  return [data ?? [], setSpecs] as const;
}

export function useDeletedProjects() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const setDeleted = useCallback(async (next: string[]) => {
    if (!user) return;
    if (next.length === 0) return;
    const last = next[next.length - 1];
    await supabase.from("projects").update({ deleted_at: new Date().toISOString() }).eq("id", last);
    qc.invalidateQueries({ queryKey: ["projects", user.id] });
  }, [qc, user]);
  return [[] as string[], setDeleted] as const;
}

/** generated map: "brief" o "<specId>.<doc>" => boolean (persistido en generated_phases) */
export function useGenerated(projectId: string) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const key = ["generated", projectId];
  const { data, isFetched } = useQuery({
    queryKey: key,
    enabled: !!user && !!projectId,
    queryFn: async (): Promise<Record<string, boolean>> => {
      const { data, error } = await supabase
        .from("generated_phases").select("*").eq("project_id", projectId);
      if (error) throw error;
      const map: Record<string, boolean> = {};
      (data ?? []).forEach((p: any) => {
        const k = p.spec_id ? `${p.spec_id}.${p.doc_key}` : p.doc_key;
        map[k] = !!p.generated;
      });
      if (!map.brief) {
        const { data: existingSpecs } = await supabase.from("specs").select("id").eq("project_id", projectId).limit(1);
        if (existingSpecs && existingSpecs.length > 0) {
          map.brief = true;
          const { data: existingBrief } = await supabase
            .from("generated_phases").select("id")
            .eq("project_id", projectId).eq("doc_key", "brief").is("spec_id", null).limit(1);
          if (existingBrief?.[0]?.id) {
            await supabase.from("generated_phases").update({ generated: true }).eq("id", existingBrief[0].id);
          } else {
            await supabase.from("generated_phases").insert({ project_id: projectId, spec_id: null, doc_key: "brief", generated: true });
          }
        }
      }
      return map;
    },
    initialData: {},
  });
  const setGenerated = useCallback(async (next: Record<string, boolean>) => {
    const current = (qc.getQueryData(key) as Record<string, boolean>) ?? {};
    const merged = { ...current, ...next };
    const newlyTrue = Object.entries(next).filter(([k, v]) => v && !current[k]);
    qc.setQueryData(key, merged);

    try {
      for (const [k] of newlyTrue) {
        const [a, b] = k.split(".");
        const spec_id = b ? a : null;
        const doc = b ?? a;
        let existingQuery = supabase
          .from("generated_phases").select("id")
          .eq("project_id", projectId).eq("doc_key", doc).limit(1);
        existingQuery = spec_id ? existingQuery.eq("spec_id", spec_id) : existingQuery.is("spec_id", null);
        const { data: existing, error: findError } = await existingQuery;
        if (findError) throw findError;

        if (existing?.[0]?.id) {
          const { error } = await supabase.from("generated_phases").update({ generated: true }).eq("id", existing[0].id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("generated_phases").insert({ project_id: projectId, spec_id, doc_key: doc, generated: true });
          if (error && (error as any).code !== "23505") throw error;
        }

        if (doc === "brief" && !spec_id) {
          const { data: existingSpecs, error: specsError } = await supabase.from("specs").select("id").eq("project_id", projectId).limit(1);
          if (specsError) throw specsError;
          if (!existingSpecs || existingSpecs.length === 0) {
            const { data: usedSpecs } = await supabase.from("specs").select("name");
            const seeds = pickSeedSpecs(projectId, (usedSpecs ?? []).map((spec: any) => spec.name));
            const rows = seeds.map((s, i) => ({ project_id: projectId, name: s.name, position: i }));
            const { error } = await supabase.from("specs").insert(rows);
            if (error) throw error;
            await qc.invalidateQueries({ queryKey: ["specs", projectId] });
            await qc.invalidateQueries({ queryKey: ["projects", user?.id] });
            await qc.invalidateQueries({ queryKey: ["specs", projectId] });
            await qc.invalidateQueries({ queryKey: ["projects", user?.id] });
          }
        }
      }
    } catch (error) {
      qc.setQueryData(key, current);
      throw error;
    }
  }, [qc, projectId, user?.id]);
  return [data ?? {}, setGenerated, { isLoaded: isFetched }] as const;

}

export function useCreateProject() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ name, idea }: { name: string; idea: string }) => {
      if (!user) throw new Error("not authenticated");
      const { data, error } = await supabase.from("projects")
        .insert({ owner_id: user.id, name, description: idea })
        .select("id").single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects", user?.id] }),
  });
}

export function useUpdateProject(projectId: string) {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (patch: Partial<{ name: string; description: string; tags: string[]; status: ProjectStatus }>) => {
      const { error } = await supabase.from("projects").update(patch).eq("id", projectId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects", user?.id] }),
  });
}
