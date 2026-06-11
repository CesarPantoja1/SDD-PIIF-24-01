import { useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import {
  Home, Briefcase, ChevronRight, ChevronDown, Settings, LogOut, User,
  FileText, Layers, ListChecks, Compass, Send, Sparkles, Plus,
  CheckCircle2, Circle, Github, Cpu, AlertTriangle, Globe, Wrench,
  BarChart3, Box, GitBranch, Bot, MoreHorizontal, Edit3, Eye, Search,
  Zap, Folder, FolderOpen, Terminal, Sun, Moon, MessageSquare, X, ArrowRight,
  Bold, Italic, Strikethrough, Code, Heading1, Heading2, List, ListOrdered,
  Quote, Code2, Minus, Table as TableIcon, Link as LinkIcon, Undo2, Redo2,
  Copy, Download, Maximize2, Wand2, RefreshCw, Save, PanelLeft,
  ClipboardList, Brain, Lock, GitCommit, GitMerge, ArrowDownToLine, ArrowUpFromLine,
  Trash2, FileCode2,
} from "lucide-react";
import type {
  AgentSlotKey, AgentSpec, AgentsConfig, ApiKeys, DocKey,
  ProjectMeta, ProjectStatus, ProviderKey, SpecRef, StageKey, View,
} from "@/lib/types";
import {
  AGENT_SLOT_LABELS, ALL_AGENT_SLOTS, DEFAULT_AGENTS, DEFAULT_KEYS,
  DEFAULT_PROMPTS, DEFAULT_SPECS, DOCS, MAX_PROJECTS, PROJECTS, PROVIDERS,
  SPEC_DOCS, STAGE_COLORS, STAGES,
} from "@/lib/constants";
import {
  DELETED_KEY, KEYS_KEY, PREFS_KEY, docKey, generatedKey, openSpecsKey,
  projectAgentsKey, projectNameKey, promptKey, specsKey,
} from "@/lib/storage";
import { escapeHtml, htmlToMd, mdInline, mdToHtml } from "@/lib/markdown";
import { useLocal } from "@/hooks/use-local";
import { useApiKeys } from "@/hooks/use-api-keys";
import { useAgentPrefs, useProjectAgents } from "@/hooks/use-agents";
import { usePromptTemplate } from "@/hooks/use-prompt-template";
import {
  useDeletedProjects, useGenerated, useProjectDisplayName,
  useProjectSpecs, useVisibleProjects, useCreateProject,
} from "@/hooks/use-project";

import {
  Card, CardHeader, Badge, Stat, KpiCard, Donut, fmtTokens, MissingKeyHint,
  PromptEditButton, IconBtn, ToolBtn, ToolDiv, Section, Tree, DiagramBox,
  Arrow, Dot, InnerSidebar, iconFor, TerminalLog, timeAgo, PField,
  PlaceholderCard, StatusBadge, inputCls, SidebarProjectRow, SidebarItem,
  MenuItem, ProjectTree,
} from "@/components/kosmo/common";

import { CodingAgentsTab, ProjectMonitoring, AgentRow, AgentPicker, AgentPickerInner, PromptEditorModal, buildUsage } from "@/components/kosmo/agents";
import { AgentWorkingModal } from "@/components/kosmo/workspace/AgentWorkingModal";

export function NewProjectView({ onConfigureAgents, onGenerate }: { onConfigureAgents: () => void; onGenerate: (projectId: string) => void }) {
  const [name, setName] = useState("");
  const [idea, setIdea] = useState("");
  const [agents] = useAgentPrefs();
  const PROJECTS = useVisibleProjects();
  const createProject = useCreateProject();
  const projectCount = PROJECTS.length;
  const limitReached = projectCount >= MAX_PROJECTS;
  const [pendingProjectId, setPendingProjectId] = useState<string | null>(null);
  const [, setGenerated] = useGenerated(pendingProjectId || "");

  const canGenerate = !limitReached && name.trim().length > 1 && idea.trim().length > 5 && agents.configured && !createProject.isPending;
  const handleGenerate = async () => {
    if (!canGenerate) return;
    try {
      const id = await createProject.mutateAsync({ name: name.trim(), idea: idea.trim() });
      setPendingProjectId(id);
    } catch (e: any) {
      alert(e?.message ?? "Error creando proyecto");
    }
  };

  const handleModalDone = async () => {
    if (!pendingProjectId) return;
    try {
      await setGenerated({ [docKey(null, "brief")]: true });
      onGenerate(pendingProjectId);
    } catch (e: any) {
      alert(e?.message ?? "Error guardando progreso");
    } finally {
      setPendingProjectId(null);
    }
  };

  return (
    <div className="h-full overflow-y-auto px-10 py-8">
      <div className="max-w-3xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Nuevo proyecto</h1>
            <p className="mt-1 text-sm text-muted-foreground">Define la idea inicial. Los agentes globales se reutilizan automáticamente.</p>
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
            placeholder="Ej: Pasa Libro"
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

          <div className="mt-6 rounded-lg border border-border bg-slate-50 p-4 flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-card border border-border text-indigo-600"><Bot className="h-4 w-4" /></div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium flex items-center gap-2">
                Configuración de agentes
                {agents.configured ? <Badge tone="green">Listos</Badge> : <Badge tone="amber">Requerido</Badge>}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {agents.configured ? `Clarificador: ${PROVIDERS[agents.clarifier.provider].label} · ${agents.clarifier.model} — Discovery: ${PROVIDERS[agents.discovery.creator.provider].label} · ${agents.discovery.creator.model} / ${PROVIDERS[agents.discovery.reviewer.provider].label} · ${agents.discovery.reviewer.model}` : "Configura los agentes globales antes de generar el descubrimiento."}
              </div>
            </div>
            <button onClick={onConfigureAgents} className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
              Configuración de proyecto
            </button>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2">
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Sparkles className="h-4 w-4" /> {createProject.isPending ? "Creando…" : "Generar descubrimiento"}
            </button>
          </div>
          {!agents.configured && (
            <p className="mt-3 text-right text-[11px] text-amber-600">Configura los agentes globales para habilitar la generación.</p>
          )}
        </Card>
      </div>
      {pendingProjectId && (
        <AgentWorkingModal
          mode="generate"
          toLabel="Descubrimiento"
          onDone={handleModalDone}
          onCancel={() => setPendingProjectId(null)}
        />
      )}
    </div>
  );
}

