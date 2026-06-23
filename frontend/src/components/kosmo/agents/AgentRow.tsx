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

function buildProviderOptions(keys: ApiKeys, currentProvider: ProviderKey) {
  const all = Object.keys(PROVIDERS) as ProviderKey[];
  const withKeys = all.filter((k) => !!keys[k]?.trim());
  const currentHasKey = !!keys[currentProvider]?.trim();
  const seen = new Set(withKeys);

  const options = withKeys.map((k) => (
    <option key={k} value={k}>{PROVIDERS[k].label}</option>
  ));

  if (!currentHasKey) {
    seen.add(currentProvider);
    options.push(
      <option key={currentProvider} value={currentProvider} disabled>
        {PROVIDERS[currentProvider].label} (sin API Key)
      </option>,
    );
  }

  for (const k of all) {
    if (!seen.has(k)) {
      options.push(
        <option key={k} value={k} disabled>{PROVIDERS[k].label} (sin API Key)</option>,
      );
    }
  }

  return options;
}

export function AgentRow({ label, desc, spec, keys, onChange, onOpenApiKeys, onEditPrompt }: { label: string; desc: string; spec: AgentSpec; keys: ApiKeys; onChange: (p: Partial<AgentSpec>) => void; onOpenApiKeys?: () => void; onEditPrompt?: () => void }) {
  const hasKey = !!keys[spec.provider]?.trim();
  const models = PROVIDERS[spec.provider].models;
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-md bg-indigo-50 text-indigo-600"><Cpu className="h-4 w-4" /></div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">{label}</div>
          <div className="text-xs text-muted-foreground">{desc}</div>
        </div>
        {onEditPrompt && (
          <button
            onClick={onEditPrompt}
            title="Editar prompt del agente"
            className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
          >
            <FileCode2 className="h-3 w-3" /> Prompt
          </button>
        )}
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <label className="text-[11px] font-medium text-muted-foreground">Proveedor</label>
          <select
            value={spec.provider}
            onChange={(e) => {
              const p = e.target.value as ProviderKey;
              onChange({ provider: p, model: PROVIDERS[p].models[0] });
            }}
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
          >
            {buildProviderOptions(keys, spec.provider)}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-medium text-muted-foreground">Modelo</label>
          <select
            value={spec.model}
            onChange={(e) => onChange({ model: e.target.value })}
            disabled={!hasKey}
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm disabled:opacity-60"
          >
            {models.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>
      {!hasKey && <MissingKeyHint provider={spec.provider} onOpenApiKeys={onOpenApiKeys} />}
    </div>
  );
}

