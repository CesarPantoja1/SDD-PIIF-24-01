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

import { AgentRow } from "@/components/kosmo/agents/AgentRow";
import { AgentPickerInner } from "@/components/kosmo/agents/AgentPicker";
import { PromptEditorModal } from "@/components/kosmo/agents/PromptEditorModal";

export function CodingAgentsTab({ agents, setAgents, scope, scopeId, onOpenApiKeys }: { agents: AgentsConfig; setAgents: (a: AgentsConfig) => void; scope: "project" | "global"; scopeId: string; onOpenApiKeys: () => void }) {
  const { keys } = useApiKeys();
  const promptScope: "global" | string = scope === "global" ? "global" : scopeId;
  const [editing, setEditing] = useState<AgentSlotKey | null>(null);
  const updateClarifier = (patch: Partial<AgentSpec>) => {
    setAgents({ ...agents, clarifier: { ...agents.clarifier, ...patch }, configured: true });
  };
  const updateStage = (stage: StageKey, which: "creator" | "reviewer", patch: Partial<AgentSpec>) => {
    setAgents({
      ...agents,
      [stage]: { ...agents[stage], [which]: { ...agents[stage][which], ...patch } },
      configured: true,
    });
  };
  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold flex items-center gap-2"><Bot className="h-4 w-4 text-indigo-500" /> Arquitectura de agentes</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {scope === "global"
                ? "Preferencias por defecto del workspace. Se aplican como base al crear nuevos proyectos."
                : "Configuración específica de este proyecto. Sobreescribe las preferencias globales."}
            </p>
          </div>
          {agents.configured ? <Badge tone="green">Configurados</Badge> : <Badge tone="amber">Sin configurar</Badge>}
        </div>
      </Card>

      <div>
        <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Transversal</div>
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-violet-50 text-violet-600"><Wand2 className="h-4 w-4" /></div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">Agente Clarificador</div>
              <div className="text-xs text-muted-foreground">Refina el prompt inicial del usuario antes de pasarlo a cada etapa.</div>
            </div>
            <button
              onClick={() => setEditing("clarifier")}
              title="Editar prompt del agente"
              className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
            >
              <FileCode2 className="h-3 w-3" /> Prompt
            </button>
          </div>
          <AgentPickerInner spec={agents.clarifier} keys={keys} onChange={updateClarifier} onOpenApiKeys={onOpenApiKeys} />
        </Card>
      </div>

      {STAGES.map((s, idx) => {
        const c = STAGE_COLORS[s.key];
        return (
          <div key={s.key}>
            <div className={`mb-2 flex items-center gap-2 rounded-lg border ${c.border} ${c.bg} px-3 py-2`}>
              <div className={`grid h-7 w-7 place-items-center rounded-md ${c.iconBg}`}>
                <s.icon className="h-3.5 w-3.5" />
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold tabular-nums rounded-full px-1.5 py-0.5 bg-white/70 ${c.text}`}>Etapa {idx + 1}</span>
                <span className={`text-[12px] font-semibold ${c.text}`}>{s.label}</span>
                <span className="text-[11px] text-muted-foreground">· {s.sub}</span>
              </div>
            </div>
            <Card className={`border-l-4 ${c.border}`}>
              <div className="grid gap-4 md:grid-cols-2">
                <AgentRow label="Creador" desc="Genera el contenido de la etapa." spec={agents[s.key].creator} keys={keys} onChange={(p) => updateStage(s.key, "creator", p)} onOpenApiKeys={onOpenApiKeys} onEditPrompt={() => setEditing(`${s.key}.creator` as AgentSlotKey)} />
                <AgentRow label="Revisor" desc="Valida y refina el output." spec={agents[s.key].reviewer} keys={keys} onChange={(p) => updateStage(s.key, "reviewer", p)} onOpenApiKeys={onOpenApiKeys} onEditPrompt={() => setEditing(`${s.key}.reviewer` as AgentSlotKey)} />
              </div>
            </Card>
          </div>
        );
      })}
      {editing && (
        <PromptEditorModal
          scope={promptScope}
          slot={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

