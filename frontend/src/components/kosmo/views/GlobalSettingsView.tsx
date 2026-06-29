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
import { useTranslation } from "react-i18next";

import { CodingAgentsTab, ProjectMonitoring, AgentRow, AgentPicker, AgentPickerInner, PromptEditorModal, buildUsage } from "@/components/kosmo/agents";
import { ApiKeysTab } from "@/components/kosmo/settings/ApiKeysTab";
import { WorkspaceGeneralTab } from "@/components/kosmo/settings/WorkspaceGeneralTab";
import { StandardsTab } from "@/components/kosmo/settings/StandardsTab";

export function GlobalSettings({ tab, onTab, onOpenApiKeys }: { tab: string; onTab: (t: string) => void; onOpenApiKeys: () => void }) {
  const { t } = useTranslation();
  const tabKeys = ["General", "API Keys", "Coding Agents", "Standards", "Integrations", "Global Monitoring", "Danger Zone"];
  const tabLabels: Record<string, string> = {
    "General": t("globalSettings.tabGeneral", "General"),
    "API Keys": t("globalSettings.tabApiKeys", "API Keys"),
    "Coding Agents": t("globalSettings.tabCodingAgents", "Coding Agents"),
    "Standards": t("globalSettings.tabStandards", "Standards"),
    "Integrations": t("globalSettings.tabIntegrations", "Integrations"),
    "Global Monitoring": t("globalSettings.tabMonitoring", "Global Monitoring"),
    "Danger Zone": t("globalSettings.tabDangerZone", "Danger Zone"),
  };
  const [prefs, setPrefs] = useAgentPrefs();
  return (
    <div className="flex h-full">
      <InnerSidebar title={t("globalSettings.title", "Workspace Settings")} tabs={tabKeys} active={tab} onSelect={onTab} tabLabels={tabLabels} />
      <div className="flex-1 overflow-y-auto px-10 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">{tabLabels[tab] || tab}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("globalSettings.subtitle", "Manage settings across your entire KOSMO workspace.")}</p>
        <div className="mt-8">
          {tab === "Global Monitoring" && <GlobalMonitoring />}
          {tab === "Integrations" && <Integrations />}
          {tab === "API Keys" && <ApiKeysTab />}
          {tab === "Coding Agents" && <CodingAgentsTab agents={prefs} setAgents={setPrefs} scope="global" scopeId="global" onOpenApiKeys={onOpenApiKeys} />}
          {tab === "General" && <WorkspaceGeneralTab />}
          {tab === "Standards" && <StandardsTab />}
          {tab === "Danger Zone" && (
            <div className="rounded-xl border border-red-200 bg-red-50/50 p-6">
              <div className="flex items-center gap-2 text-red-700"><AlertTriangle className="h-4 w-4" /><span className="font-medium">{t("globalSettings.deleteWorkspace", "Delete workspace")}</span></div>
              <p className="mt-2 text-sm text-red-700/80">{t("globalSettings.deleteWorkspaceDesc", "This action is permanent. All projects, specs, and history will be removed.")}</p>
              <button className="mt-4 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700">{t("globalSettings.deleteWorkspaceBtn", "Delete workspace")}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


export function GlobalMonitoring() {
  const { t } = useTranslation();
  const roles = [
    { name: t("globalSettings.creators", "Creadores (4 etapas)"), icon: Wand2, tokens: 1240000, cost: 142.8, pct: 92 },
    { name: t("globalSettings.reviewers", "Revisores (4 etapas)"), icon: CheckCircle2, tokens: 860000, cost: 96.4, pct: 64 },
    { name: t("globalSettings.clarifier", "Clarificador"), icon: Sparkles, tokens: 320000, cost: 18.9, pct: 23 },
  ];
  const providers = [
    { name: "OpenAI", pct: 58, cost: 178.2, color: "from-emerald-500 to-teal-400" },
    { name: "Google", pct: 30, cost: 92.1, color: "from-sky-500 to-indigo-400" },
    { name: "DeepSeek", pct: 12, cost: 27.8, color: "from-violet-500 to-fuchsia-400" },
  ];
  const projectsRaw = useVisibleProjects();
  const projects = projectsRaw.map((p) => ({ ...p, pct: Math.min(100, Math.round((p.cost / 200) * 100)) }));
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader title={t("globalSettings.totalTokens", "Total token consumption")} hint={t("globalSettings.last30days", "Últimos 30 días")} icon={Zap} />
        <div className="mt-4 flex items-end gap-4">
          <div className="text-3xl font-semibold tracking-tight">2.96M</div>
          <div className="text-xs text-emerald-600 mb-1.5">+12.4%</div>
        </div>
        <div className="mt-6 flex items-end gap-1.5 h-32">
          {[40, 65, 30, 80, 55, 90, 70, 95, 60, 78, 88, 100].map((h, i) => (
            <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-indigo-500 to-violet-400" style={{ height: `${h}%` }} />
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title={t("globalSettings.spendByRole", "Gasto agregado por rol")} hint={t("globalSettings.spendByRoleHint", "Detalle por agente en cada proyecto")} icon={Bot} />
        <div className="mt-4 space-y-3">
          {roles.map((r) => (
            <div key={r.name}>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span className="inline-flex items-center gap-1.5"><r.icon className="h-3.5 w-3.5 text-indigo-500" />{r.name}</span>
                <span className="tabular-nums text-muted-foreground">${r.cost.toFixed(2)} · {fmtTokens(r.tokens)}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-indigo-500" style={{ width: `${r.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-slate-400">{t("globalSettings.summaryHint", "Vista resumida. Para tokens, modelo y costo por agente, abre Project Settings → Monitoring.")}</p>
      </Card>

      <Card>
        <CardHeader title={t("globalSettings.distributionByProvider", "Distribución por proveedor")} icon={Cpu} />
        <div className="mt-4 space-y-3">
          {providers.map((p) => (
            <div key={p.name}>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>{p.name}</span><span className="tabular-nums text-muted-foreground">${p.cost.toFixed(2)} · {p.pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className={`h-full rounded-full bg-gradient-to-r ${p.color}`} style={{ width: `${p.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title={t("globalSettings.costByProject", "Costo por proyecto")} icon={Briefcase} />
        <div className="mt-4 space-y-3">
          {projects.map((p) => (
            <div key={p.id}>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>{p.name}</span><span className="tabular-nums text-muted-foreground">${p.cost.toFixed(2)}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400" style={{ width: `${p.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}


export function Integrations() {
  const { t } = useTranslation();
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const handleConnect = () => {
    setLoading(true);
    setTimeout(() => { setConnected(true); setLoading(false); }, 1400);
  };
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-lg bg-slate-900 text-white"><Github className="h-6 w-6" /></div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{t("globalSettings.github", "GitHub")}</h3>
              {connected ? <Badge tone="green">{t("globalSettings.connected", "Connected")}</Badge> : <Badge tone="slate">{t("globalSettings.notConnected", "Not connected")}</Badge>}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{t("globalSettings.githubDesc", "Link your workspace to GitHub to enable repository syncing, PR generation, and CI hooks across all projects.")}</p>
          </div>
          <button
            onClick={handleConnect}
            disabled={connected || loading}
            className="rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            {connected ? t("globalSettings.connected", "Connected") : loading ? t("globalSettings.authorizing", "Authorizing…") : t("globalSettings.connectToGithub", "Connect to GitHub")}
          </button>
        </div>
        {loading && <TerminalLog lines={["$ oauth start github", "→ redirecting to github.com/login/oauth/authorize", "✓ scopes granted: repo, read:user", "✓ workspace linked"]} />}
      </Card>
    </div>
  );
}

/* ============== PROJECT SETTINGS ============== */

