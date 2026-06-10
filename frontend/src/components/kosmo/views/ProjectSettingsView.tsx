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
  useProjectSpecs, useVisibleProjects, useProjectById,
} from "@/hooks/use-project";

import {
  Card, CardHeader, Badge, Stat, KpiCard, Donut, fmtTokens, MissingKeyHint,
  PromptEditButton, IconBtn, ToolBtn, ToolDiv, Section, Tree, DiagramBox,
  Arrow, Dot, InnerSidebar, iconFor, TerminalLog, timeAgo, PField,
  PlaceholderCard, StatusBadge, inputCls, SidebarProjectRow, SidebarItem,
  MenuItem, ProjectTree,
} from "@/components/kosmo/common";

import { CodingAgentsTab, ProjectMonitoring, AgentRow, AgentPicker, AgentPickerInner, PromptEditorModal, buildUsage } from "@/components/kosmo/agents";
import { ProjectGeneralTab } from "@/components/kosmo/settings/ProjectGeneralTab";
import { ProjectDangerZone } from "@/components/kosmo/modals/ProjectDangerZone";

export function ProjectSettings({ projectId, tab, onTab, onOpenApiKeys, onDeleted }: { projectId: string; tab: string; onTab: (t: string) => void; onOpenApiKeys: () => void; onDeleted: () => void }) {
  const tabs = ["General", "Repository", "Coding Agents", "Monitoring", "Danger Zone"];
  const project = useProjectById(projectId);
  const [agents, setAgents] = useProjectAgents(projectId);
  return (
    <div className="flex h-full">
      <InnerSidebar title={`${project.name} · Settings`} tabs={tabs} active={tab} onSelect={onTab} />
      <div className="flex-1 overflow-y-auto px-10 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">{tab}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Project-scoped configuration for {project.name}.</p>
        <div className="mt-8">
          {tab === "General" && <ProjectGeneralTab projectId={projectId} />}
          {tab === "Repository" && <RepositoryTab />}
          {tab === "Coding Agents" && <CodingAgentsTab agents={agents} setAgents={setAgents} scope="project" scopeId={projectId} onOpenApiKeys={onOpenApiKeys} />}
          {tab === "Monitoring" && <ProjectMonitoring projectId={projectId} agents={agents} />}
          {tab === "Danger Zone" && <ProjectDangerZone projectId={projectId} onDeleted={onDeleted} />}
        </div>
      </div>
    </div>
  );
}


export function RepositoryTab() {
  const [repo, setRepo] = useState("");
  const [branch, setBranch] = useState("main");
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">Linked repository</h3>
        </div>
        <Badge tone="slate">Not connected</Badge>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">Link this project to a GitHub repository so KOSMO can read and write code.</p>
      <div className="mt-5 grid gap-4 md:grid-cols-[2fr_1fr]">
        <div>
          <label className="text-xs font-medium text-slate-600">Repository <span className="text-slate-400 font-normal">(optional)</span></label>
          <input
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            placeholder="org/repository"
            className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Default branch</label>
          <select value={branch} onChange={(e) => setBranch(e.target.value)} className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm bg-card">
            <option>main</option><option>develop</option><option>staging</option>
          </select>
        </div>
      </div>
      <div className="mt-5 flex justify-end">
        <button className="rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-700">Link repository</button>
      </div>
    </Card>
  );
}

