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
  useProjectSpecs, useVisibleProjects, useProjectById, useUpdateProject,
} from "@/hooks/use-project";

import {
  Card, CardHeader, Badge, Stat, KpiCard, Donut, fmtTokens, MissingKeyHint,
  PromptEditButton, IconBtn, ToolBtn, ToolDiv, Section, Tree, DiagramBox,
  Arrow, Dot, InnerSidebar, iconFor, TerminalLog, timeAgo, PField,
  PlaceholderCard, StatusBadge, inputCls, SidebarProjectRow, SidebarItem,
  MenuItem, ProjectTree,
} from "@/components/kosmo/common";

import { CodingAgentsTab, ProjectMonitoring, AgentRow, AgentPicker, AgentPickerInner, PromptEditorModal, buildUsage } from "@/components/kosmo/agents";

export function ProjectGeneralTab({ projectId }: { projectId: string }) {
  const project = useProjectById(projectId);
  const update = useUpdateProject(projectId);
  const [name, setName] = useState(project.name);
  const [desc, setDesc] = useState(project.description);
  const [tagsStr, setTagsStr] = useState(project.tags.join(", "));
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [visibility, setVisibility] = useLocal(`kosmo.project.${projectId}.visibility`, "private");
  const [icon, setIcon] = useLocal(`kosmo.project.${projectId}.icon`, "folder");
  useEffect(() => { setName(project.name); setDesc(project.description); setTagsStr(project.tags.join(", ")); setStatus(project.status); }, [project.id, project.name, project.description, project.tags.join(","), project.status]);
  useEffect(() => {
    if (!project.id || !project.name) return;
    const tags = tagsStr.split(",").map(t => t.trim()).filter(Boolean);
    const changed = name !== project.name || desc !== project.description || status !== project.status || JSON.stringify(tags) !== JSON.stringify(project.tags);
    if (!changed) return;
    const t = setTimeout(() => { update.mutate({ name, description: desc, tags, status }); }, 600);
    return () => clearTimeout(t);
  }, [name, desc, tagsStr, status]);
  return (
    <div className="max-w-3xl space-y-6">
      <Card>
        <h3 className="font-semibold flex items-center gap-2"><Wrench className="h-4 w-4 text-indigo-500" /> Información general</h3>
        <p className="mt-1 text-sm text-muted-foreground">Identifica y describe el proyecto.</p>
        <div className="mt-5">
          <PField label="Nombre del proyecto"><input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} /></PField>
        </div>
        <div className="mt-4">
          <PField label="Descripción"><textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} className={inputCls} /></PField>
        </div>
        <div className="mt-4">
          <PField label="Tags (separados por coma)"><input value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} placeholder="marketplace, mobile" className={inputCls} /></PField>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-[11px] text-slate-400">Los cambios se guardan automáticamente, pero también puedes forzarlo aquí.</p>
        <button
          onClick={() => {
            const tags = tagsStr.split(",").map(t => t.trim()).filter(Boolean);
            update.mutate({ name, description: desc, tags, status });
          }}
          disabled={update.isPending}
          className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {update.isPending ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}

/* ============== PROJECT DANGER ZONE ============== */

