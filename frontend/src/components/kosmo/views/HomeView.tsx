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
import { useTranslation } from "react-i18next";

export function HomeView({ onOpenProject, onNew, onOpenWorkspace }: { onOpenProject: (id: string) => void; onNew: () => void; onOpenWorkspace: () => void }) {
  const { t } = useTranslation();
  const PROJECTS = useVisibleProjects();
  const totalSpend = PROJECTS.reduce((a, p) => a + p.cost, 0);
  const totalTokens = PROJECTS.reduce((a, p) => a + p.tokens, 0);
  const active = PROJECTS.filter((p) => p.status === "active").length;
  const top = [...PROJECTS].sort((a, b) => b.cost - a.cost);
  const maxCost = Math.max(...top.map((p) => p.cost), 1);
  const recent = [...PROJECTS].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  const activities: { kind: string; project: string; time: string; icon: any; color: string }[] = [];

  return (
    <div className="h-full overflow-y-auto px-10 py-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('home.welcome', 'Bienvenido')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('home.summary', 'Resumen de tus proyectos y consumo en KOSMO.')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onOpenWorkspace} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Briefcase className="h-4 w-4" /> {t('home.viewWorkspace', 'Ver workspace')}
          </button>
          <button onClick={onNew} className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">
            <Plus className="h-4 w-4" /> {t('common.newProject')}
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <Stat label={t('home.totalSpend', 'Gasto total (MTD)')} value={`$${totalSpend.toFixed(2)}`} trend="+9.6%" />
        <Stat label={t('home.tokensConsumed', 'Tokens consumidos')} value={fmtTokens(totalTokens)} trend="+12.4%" />
        <Stat label={t('home.activeProjects', 'Proyectos activos')} value={`${active} / ${PROJECTS.length}`} trend="+1" />
        <Stat label={t('home.specsInProgress', 'Specs en curso')} value={String(PROJECTS.reduce((a, p) => a + p.specsCount, 0))} trend="+2" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-indigo-500" /><h3 className="font-semibold">{t('home.recentProjects', 'Proyectos recientes')}</h3></div>
            <button onClick={onOpenWorkspace} className="text-xs text-indigo-600 hover:underline">{t('home.viewAll', 'Ver todos →')}</button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {recent.slice(0, 4).map((p) => (
              <button key={p.id} onClick={() => onOpenProject(p.id)} className="group rounded-lg border border-border p-4 text-left hover:border-indigo-300 hover:shadow-sm transition">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-md bg-indigo-50 text-indigo-600"><FolderOpen className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-semibold truncate">{p.name}</div>
                      <StatusBadge status={p.status} />
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">{p.description}</div>
                    <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><FileText className="h-3 w-3" />{p.specsCount} specs</span>
                      <span className="inline-flex items-center gap-1"><Zap className="h-3 w-3" />${p.cost.toFixed(2)}</span>
                      <span className="ml-auto">{timeAgo(p.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title={t('home.topSpend', 'Top por gasto')} icon={Zap} />
          <div className="mt-4 space-y-3">
            {top.map((p) => (
              <button key={p.id} onClick={() => onOpenProject(p.id)} className="w-full text-left">
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span className="font-medium text-slate-800 truncate">{p.name}</span>
                  <span className="tabular-nums text-muted-foreground">${p.cost.toFixed(2)} · {fmtTokens(p.tokens)}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-400" style={{ width: `${(p.cost / maxCost) * 100}%` }} />
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title={t('home.recentActivity', 'Actividad reciente')} icon={Sparkles} />
          <ul className="mt-4 divide-y divide-slate-100">
            {activities.map((a, i) => (
              <li key={i} className="flex items-center gap-3 py-2.5">
                <div className={`grid h-8 w-8 place-items-center rounded-md ${a.color}`}><a.icon className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm"><span className="font-medium">{a.kind}</span> <span className="text-muted-foreground">en {a.project}</span></div>
                </div>
                <div className="text-[11px] text-slate-400">{a.time}</div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title={t('home.shortcuts', 'Atajos')} icon={Zap} />
          <div className="mt-4 space-y-2">
            <button onClick={onNew} className="flex w-full items-center gap-3 rounded-md border border-border px-3 py-2.5 text-sm hover:bg-slate-50">
              <div className="grid h-8 w-8 place-items-center rounded-md bg-indigo-50 text-indigo-600"><Plus className="h-4 w-4" /></div>
              <div className="text-left flex-1">
                <div className="font-medium">Nuevo proyecto</div>
                <div className="text-[11px] text-muted-foreground">Inicia un descubrimiento desde una idea.</div>
              </div>
            </button>
            <button onClick={onOpenWorkspace} className="flex w-full items-center gap-3 rounded-md border border-border px-3 py-2.5 text-sm hover:bg-slate-50">
              <div className="grid h-8 w-8 place-items-center rounded-md bg-violet-50 text-violet-600"><Briefcase className="h-4 w-4" /></div>
              <div className="text-left flex-1">
                <div className="font-medium">My Workspace</div>
                <div className="text-[11px] text-muted-foreground">Explora y filtra todos tus proyectos.</div>
              </div>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

