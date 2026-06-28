import { useState } from "react";
import {
  Briefcase, AlertTriangle, Plus,
} from "lucide-react";
import {
  MAX_PROJECTS,
} from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";
import {
  useVisibleProjects, useCreateProject,
} from "@/hooks/use-project";

import {
  Card, Badge,
} from "@/components/kosmo/common";

export function NewProjectView({ onCreated }: { onCreated: (projectId: string) => void }) {
  const { session } = useAuth();
  const PROJECTS = useVisibleProjects();
  const [name, setName] = useState("");
  const [idea, setIdea] = useState("");
  const createProject = useCreateProject();
  const projectCount = PROJECTS.length;
  const limitReached = projectCount >= MAX_PROJECTS;

  const canCreate = !limitReached && name.trim().length > 1 && idea.trim().length > 5
    && !createProject.isPending;

  const handleCreate = async () => {
    if (!canCreate) return;
    try {
      const id = await createProject.mutateAsync({ name: name.trim(), idea: idea.trim() });
      onCreated(id);
    } catch (e: any) {
      alert(e?.message ?? "Error creando proyecto");
    }
  };

  return (
    <div className="h-full overflow-y-auto px-10 py-8">
      <div className="max-w-3xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Nuevo proyecto</h1>
            <p className="mt-1 text-sm text-muted-foreground">Define la idea del proyecto. Podrás configurar los agentes y generar el Discovery después.</p>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-slate-600">
              <Briefcase className="h-3 w-3 text-slate-400" /> {projectCount} / {MAX_PROJECTS} proyectos
            </div>
          </div>
        </div>

        {limitReached && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/70 p-4 flex items-start gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-amber-100 text-amber-700"><AlertTriangle className="h-4 w-4" /></div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-amber-900">Has alcanzado el límite de {MAX_PROJECTS} proyectos</div>
              <p className="mt-1 text-xs text-amber-800/80">Por ahora KOSMO permite hasta {MAX_PROJECTS} proyectos por workspace. Archiva o elimina uno existente para crear uno nuevo.</p>
            </div>
          </div>
        )}


        <Card className="mt-6">
          <label className="text-xs font-medium text-slate-600">Nombre del proyecto</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Sistema Contable Empresarial"
            className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
          />

          <label className="mt-5 block text-xs font-medium text-slate-600">Idea del proyecto</label>
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="Describe en pocas líneas el problema que resuelve y para quién…"
            rows={5}
            className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
          />

          <div className="mt-6 flex items-center justify-end gap-2">
            <button
              onClick={handleCreate}
              disabled={!canCreate}
              className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" /> {createProject.isPending ? "Creando…" : "Crear proyecto"}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
