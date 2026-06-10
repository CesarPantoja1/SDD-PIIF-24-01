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

export function AgentWorkingModal({ mode, toLabel, onDone, onCancel }: { mode: "generate" | "regenerate"; toLabel: string; onDone: () => void; onCancel: () => void }) {
  const verb = mode === "regenerate" ? "Regenerando" : "Generando";
  const steps = [
    { agent: "Evaluador RAG", text: `Recuperando contexto relevante para "${toLabel}"…` },
    { agent: "Agente Creador", text: `Sintetizando ${mode === "regenerate" ? "nueva versión" : "borrador"} de "${toLabel}"…` },
    { agent: "Agente Revisor", text: "Validando consistencia y criterios SDD…" },
    { agent: "Vibe Modeler", text: "Aplicando estilo y consolidando documento…" },
    { agent: "Sistema", text: `✓ "${toLabel}" ${mode === "regenerate" ? "regenerado" : "generado"} correctamente.` },
  ];
  const [idx, setIdx] = useState(0);
  const done = idx >= steps.length;

  useEffect(() => {
    if (done) return;
    const t = setTimeout(() => setIdx((i) => i + 1), idx === steps.length - 1 ? 700 : 900);
    return () => clearTimeout(t);
  }, [idx, done, steps.length]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-card shadow-2xl border border-border overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold">{verb}: {toLabel}</div>
            <div className="text-[11px] text-muted-foreground">Los agentes están trabajando en segundo plano.</div>
          </div>
          <button onClick={onCancel} aria-label="Close" className="grid h-7 w-7 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-2.5 max-h-[55vh] overflow-y-auto">
          {steps.slice(0, idx + (done ? 0 : 1)).map((s, i) => {
            const isCurrent = !done && i === idx;
            const isDone = i < idx || done;
            return (
              <div key={i} className="flex items-start gap-3">
                <div className={`mt-0.5 grid h-5 w-5 place-items-center rounded-full ${isDone ? "bg-emerald-500 text-white" : "bg-indigo-100 text-indigo-700"}`}>
                  {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] inline-flex items-center gap-1 rounded-md bg-indigo-50 text-indigo-700 px-1.5 py-0.5 font-medium">
                      <Bot className="h-3 w-3" />{s.agent}
                    </span>
                    {isCurrent && <span className="text-[10px] text-slate-400">trabajando…</span>}
                  </div>
                  <div className={`mt-0.5 text-sm ${isDone ? "text-muted-foreground" : "text-slate-800"}`}>{s.text}</div>
                </div>
              </div>
            );
          })}
          {!done && (
            <div className="pt-1 flex gap-1 pl-8"><Dot /><Dot delay="150ms" /><Dot delay="300ms" /></div>
          )}
        </div>

        <div className="border-t border-border bg-slate-50 px-5 py-3 flex items-center justify-between">
          <div className="text-[11px] text-muted-foreground">{done ? "Listo" : `Paso ${Math.min(idx + 1, steps.length)} de ${steps.length}`}</div>
          <div className="flex items-center gap-2">
            <button onClick={onCancel} className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button
              onClick={onDone}
              disabled={!done}
              className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continuar <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


/* ============== CODE GENERATION VIEW ============== */

