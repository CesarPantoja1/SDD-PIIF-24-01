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

export type Msg = { from: "user" | "agent"; agent?: string; text: string };


export function VibeChat({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Msg[]>([
    { from: "agent", agent: "Vibe Modeler", text: "Hola Cesar 👋 ¿Qué problema quieres explorar hoy?" },
    { from: "user", text: "Quiero diseñar Pasa Libro, una app para intercambiar libros físicos." },
    { from: "agent", agent: "Evaluador RAG", text: "Encontré 3 documentos relacionados en tu workspace. ¿Quieres que los incorpore al contexto?" },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const send = (text?: string) => {
    const t = (text ?? input).trim();
    if (!t) return;
    setMessages((m) => [...m, { from: "user", text: t }]);
    setInput("");
    setBusy(true);
    setTimeout(() => {
      setMessages((m) => [...m, { from: "agent", agent: "Vibe Modeler", text: "Procesando contexto y refinando el documento…" }]);
      setBusy(false);
    }, 1100);
  };
  return (
    <aside className="flex w-[340px] shrink-0 flex-col bg-slate-50 border-l border-border">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <div className="grid h-7 w-7 place-items-center rounded-md bg-indigo-600 text-white"><Sparkles className="h-4 w-4" /></div>
        <div className="min-w-0">
          <div className="text-sm font-semibold">Vibe Modeling</div>
          <div className="text-[11px] text-muted-foreground">3 agentes activos</div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close chat"
          className="ml-auto grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-white hover:text-slate-800"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={m.from === "user" ? "flex justify-end" : ""}>
            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-[13px] leading-relaxed ${m.from === "user" ? "bg-indigo-600 text-white" : "bg-card border border-border text-slate-800"}`}>
              {m.from === "agent" && (
                <div className="mb-1 inline-flex items-center gap-1 rounded-md bg-indigo-50 text-indigo-700 px-1.5 py-0.5 text-[10px] font-medium">
                  <Bot className="h-3 w-3" />[{m.agent}]
                </div>
              )}
              <div>{m.text}</div>
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex gap-1 px-2"><Dot /><Dot delay="150ms" /><Dot delay="300ms" /></div>
        )}
      </div>
      <div className="px-3 pb-2 flex flex-wrap gap-1.5">
        {["Refinar visión", "Generar historias", "Sugerir arquitectura"].map((q) => (
          <button key={q} onClick={() => send(q)} className="text-[11px] rounded-full border border-border bg-card px-2.5 py-1 text-slate-600 hover:border-indigo-300 hover:text-indigo-700">{q}</button>
        ))}
      </div>
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500/30">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Pregúntale al modelo…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
          <button onClick={() => send()} className="grid h-7 w-7 place-items-center rounded-md bg-indigo-600 text-white hover:bg-indigo-700"><Send className="h-3.5 w-3.5" /></button>
        </div>
      </div>
    </aside>
  );
}

