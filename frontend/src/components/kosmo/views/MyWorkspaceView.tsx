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
  useProjectSpecs, useVisibleProjects,
} from "@/hooks/use-project";

import {
  Card, CardHeader, Badge, Stat, KpiCard, Donut, fmtTokens, MissingKeyHint,
  PromptEditButton, IconBtn, ToolBtn, ToolDiv, Section, Tree, DiagramBox,
  Arrow, Dot, InnerSidebar, iconFor, TerminalLog, timeAgo, PField,
  PlaceholderCard, StatusBadge, inputCls, SidebarProjectRow, SidebarItem,
  MenuItem, ProjectTree,
} from "@/components/kosmo/common";

import { CodingAgentsTab, ProjectMonitoring, AgentRow, AgentPicker, AgentPickerInner, PromptEditorModal, buildUsage } from "@/components/kosmo/agents";

export function MyWorkspaceView({ onOpenProject, onSettings, onNew }: { onOpenProject: (id: string) => void; onSettings: (id: string) => void; onNew: () => void }) {
  const PROJECTS = useVisibleProjects();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<ProjectStatus | "all">("all");
  const [sort, setSort] = useState<"recent" | "name" | "cost">("recent");
  const [view, setViewMode] = useState<"grid" | "list">("grid");
  const allTags = Array.from(new Set(PROJECTS.flatMap((p) => p.tags)));
  const [tag, setTag] = useState<string | "all">("all");

  let items = PROJECTS.filter((p) => {
    if (status !== "all" && p.status !== status) return false;
    if (tag !== "all" && !p.tags.includes(tag)) return false;
    if (q.trim()) {
      const s = q.toLowerCase();
      if (!p.name.toLowerCase().includes(s) && !p.description.toLowerCase().includes(s) && !p.tags.some((t) => t.includes(s))) return false;
    }
    return true;
  });
  items = items.sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name);
    if (sort === "cost") return b.cost - a.cost;
    return +new Date(b.updatedAt) - +new Date(a.updatedAt);
  });

  const counts = {
    all: PROJECTS.length,
    active: PROJECTS.filter((p) => p.status === "active").length,
    paused: PROJECTS.filter((p) => p.status === "paused").length,
    archived: PROJECTS.filter((p) => p.status === "archived").length,
  };

  return (
    <div className="h-full overflow-y-auto px-10 py-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Workspace</h1>
          <p className="mt-1 text-sm text-muted-foreground">Todos tus proyectos en un solo lugar.</p>
        </div>
        <button onClick={onNew} className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">
          <Plus className="h-4 w-4" /> Nuevo proyecto
        </button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-1.5">
        {(["all", "active", "paused", "archived"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setStatus(k)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${status === k ? "bg-indigo-600 text-white border-indigo-600" : "bg-card text-slate-600 border-border hover:bg-slate-50"}`}
          >
            <span>{k === "all" ? "Todos" : k === "active" ? "Activos" : k === "paused" ? "En pausa" : "Archivados"}</span>
            <span className={`tabular-nums text-[10px] rounded-full px-1.5 py-0.5 ${status === k ? "bg-white/20" : "bg-slate-100 text-muted-foreground"}`}>{counts[k]}</span>
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, descripción o tag…"
            className="w-full rounded-md border border-border bg-card pl-8 pr-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
          />
        </div>
        <select value={tag} onChange={(e) => setTag(e.target.value as any)} className="rounded-md border border-border bg-card px-2.5 py-2 text-sm">
          <option value="all">Todos los tags</option>
          {allTags.map((t) => <option key={t} value={t}>#{t}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="rounded-md border border-border bg-card px-2.5 py-2 text-sm">
          <option value="recent">Más recientes</option>
          <option value="name">Nombre (A–Z)</option>
          <option value="cost">Mayor gasto</option>
        </select>
        <div className="ml-auto flex items-center rounded-md border border-border bg-card p-0.5">
          <button onClick={() => setViewMode("grid")} className={`grid h-7 w-7 place-items-center rounded ${view === "grid" ? "bg-slate-100 text-foreground" : "text-muted-foreground"}`} title="Grid"><Box className="h-3.5 w-3.5" /></button>
          <button onClick={() => setViewMode("list")} className={`grid h-7 w-7 place-items-center rounded ${view === "list" ? "bg-slate-100 text-foreground" : "text-muted-foreground"}`} title="Lista"><List className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      <div className="mt-2 text-[11px] text-muted-foreground">{items.length} resultado{items.length === 1 ? "" : "s"}</div>

      {items.length === 0 ? (
        <Card className="mt-4">
          <div className="grid place-items-center py-10 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400"><Search className="h-5 w-5" /></div>
            <div className="mt-3 text-sm font-medium">Sin coincidencias</div>
            <div className="text-xs text-muted-foreground">Ajusta los filtros o crea un nuevo proyecto.</div>
          </div>
        </Card>
      ) : view === "grid" ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((p) => (
            <div key={p.id} className="group rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-indigo-300 hover:shadow-sm transition">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 text-white"><FolderOpen className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <button onClick={() => onOpenProject(p.id)} className="text-sm font-semibold hover:text-indigo-700 truncate text-left">{p.name}</button>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                </div>
                <button onClick={() => onSettings(p.id)} className="grid h-7 w-7 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="Settings"><Settings className="h-3.5 w-3.5" /></button>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {p.tags.map((t) => <span key={t} className="text-[10px] rounded-md bg-slate-100 text-slate-600 px-1.5 py-0.5">#{t}</span>)}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div><div className="text-[10px] uppercase text-slate-400 tracking-wider">Specs</div><div className="text-sm font-semibold tabular-nums">{p.specsCount}</div></div>
                <div><div className="text-[10px] uppercase text-slate-400 tracking-wider">Tokens</div><div className="text-sm font-semibold tabular-nums">{fmtTokens(p.tokens)}</div></div>
                <div><div className="text-[10px] uppercase text-slate-400 tracking-wider">Costo</div><div className="text-sm font-semibold tabular-nums">${p.cost.toFixed(0)}</div></div>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Actualizado {timeAgo(p.updatedAt)}</span>
                <button onClick={() => onOpenProject(p.id)} className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:text-indigo-700">Abrir <ArrowRight className="h-3 w-3" /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400">
                <th className="px-4 py-2 font-medium">Proyecto</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Tags</th>
                <th className="px-4 py-2 font-medium text-right">Specs</th>
                <th className="px-4 py-2 font-medium text-right">Tokens</th>
                <th className="px-4 py-2 font-medium text-right">Costo</th>
                <th className="px-4 py-2 font-medium">Actualizado</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <td className="px-4 py-2.5">
                    <button onClick={() => onOpenProject(p.id)} className="flex items-center gap-2 text-left">
                      <div className="grid h-7 w-7 place-items-center rounded-md bg-indigo-50 text-indigo-600"><FolderOpen className="h-3.5 w-3.5" /></div>
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-[11px] text-muted-foreground truncate max-w-xs">{p.description}</div>
                      </div>
                    </button>
                  </td>
                  <td className="px-4 py-2.5"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-2.5"><div className="flex flex-wrap gap-1">{p.tags.map((t) => <span key={t} className="text-[10px] rounded-md bg-slate-100 text-slate-600 px-1.5 py-0.5">#{t}</span>)}</div></td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{p.specsCount}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmtTokens(p.tokens)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-semibold">${p.cost.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-[11px] text-muted-foreground">{timeAgo(p.updatedAt)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => onSettings(p.id)} className="grid h-7 w-7 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="Settings"><Settings className="h-3.5 w-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

