/**
 * Hooks for project management.
 *
 * SCOPE ACTUAL (iteración 1): Perfiles y Proyectos
 *   - All write operations (create, update, delete) go through the FastAPI backend.
 *   - Read operations use listProjects from the backend API.
 *
 * SCOPE FUTURO (iteración 2+): specs, generated_phases, etc.
 *   - The original Supabase-based logic for specs/generated is preserved in comments.
 *   - Re-enable by uncommenting the relevant sections and wiring to the backend.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
// import { supabase } from "@/integrations/supabase/client"; // Habilitar para specs/generated (iter. futura)
import { useAuth } from "./use-auth";
import type { ProjectMeta, SpecRef, ProjectStatus } from "@/lib/types";
// import { pickSeedSpecs } from "@/lib/constants"; // Habilitar para specs (iter. futura)
import {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
} from "@/lib/api/api";

// ─── Projects ─────────────────────────────────────────────────────────────

export function useProjectsRaw() {
  const { user, session } = useAuth();
  const token = session?.access_token ?? null;

  return useQuery({
    queryKey: ["projects", user?.id],
    enabled: !!user && !!token,
    staleTime: 30_000,
    queryFn: async (): Promise<ProjectMeta[]> => {
      const items = await listProjects(token!);
      return items.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description ?? "",
        status: (r.status as ProjectStatus) ?? "active",
        updatedAt: r.updated_at,
        cost: Number(r.cost) || 0,
        tokens: r.tokens || 0,
        specsCount: 0, // TODO (iter. futura): contar specs desde backend
        tags: r.tags ?? [],
      }));
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
  return (
    projects.find((p) => p.id === projectId) ?? {
      id: projectId,
      name: "",
      description: "",
      status: "active" as ProjectStatus,
      updatedAt: new Date().toISOString(),
      cost: 0,
      tokens: 0,
      specsCount: 0,
      tags: [],
    }
  );
}

export function useCreateProject() {
  const qc = useQueryClient();
  const { user, session } = useAuth();
  const token = session?.access_token ?? null;

  return useMutation({
    mutationFn: async ({ name, idea }: { name: string; idea: string }) => {
      if (!user || !token) throw new Error("not authenticated");
      const project = await createProject(token, { name, description: idea });
      return project.id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects", user?.id] }),
  });
}

export function useUpdateProject(projectId: string) {
  const qc = useQueryClient();
  const { user, session } = useAuth();
  const token = session?.access_token ?? null;

  return useMutation({
    mutationFn: async (
      patch: Partial<{ name: string; description: string; tags: string[]; status: ProjectStatus }>
    ) => {
      if (!token) throw new Error("not authenticated");
      await updateProject(token, projectId, patch);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects", user?.id] }),
  });
}

export function useDeletedProjects() {
  const qc = useQueryClient();
  const { user, session } = useAuth();
  const token = session?.access_token ?? null;

  const setDeleted = useCallback(
    async (next: string[]) => {
      if (!user || !token) return;
      if (next.length === 0) return;
      const last = next[next.length - 1];
      await deleteProject(token, last);
      qc.invalidateQueries({ queryKey: ["projects", user.id] });
    },
    [qc, user, token] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return [[] as string[], setDeleted] as const;
}

import { useLocal } from "./use-local";

// ─── Specs (mock data persistido localmente) ──

export function useProjectSpecs(_projectId: string) {
  const [specs, setSpecs] = useLocal<SpecRef[]>(`kosmo.mock.specs.${_projectId}`, []);
  
  const updateSpecs = useCallback(async (next: SpecRef[]) => {
    setSpecs(next);
  }, [setSpecs]);

  return [specs, updateSpecs] as const;
}

// ─── Generated phases (mock data persistido localmente) ──

export function useGenerated(_projectId: string) {
  const [generated, setGenerated] = useLocal<Record<string, boolean>>(`kosmo.mock.generated.${_projectId}`, {});

  const updateGenerated = useCallback(async (next: Record<string, boolean>) => {
    // Cuando actualizamos, hacemos merge para no perder el estado anterior
    setGenerated((prev) => ({ ...prev, ...next }));
  }, [setGenerated]);

  return [generated, updateGenerated, { isLoaded: true }] as const;
}

