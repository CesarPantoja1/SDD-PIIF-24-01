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

export function PromptEditorModal({ scope, slot, onClose }: { scope: "global" | string; slot: AgentSlotKey; onClose: () => void }) {
  const [stored, setStored] = usePromptTemplate(scope, slot);
  const editorRef = useRef<HTMLDivElement>(null);
  const seedRef = useRef<string>("");
  const [dirty, setDirty] = useState(false);
  const [focused, setFocused] = useState(false);
  const isDefault = stored === DEFAULT_PROMPTS[slot];

  // Seed editor on slot/scope change
  useEffect(() => {
    if (!editorRef.current) return;
    const html = mdToHtml(stored);
    editorRef.current.innerHTML = html;
    seedRef.current = html;
    setDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slot, scope]);

  const exec = (cmd: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
    setDirty(editorRef.current?.innerHTML !== seedRef.current);
  };
  const onInput = () => {
    setDirty(editorRef.current?.innerHTML !== seedRef.current);
  };
  const onSave = () => {
    if (!editorRef.current) return;
    const md = htmlToMd(editorRef.current);
    setStored(md);
    seedRef.current = editorRef.current.innerHTML;
    setDirty(false);
  };
  const onRestore = () => {
    if (!editorRef.current) return;
    const html = mdToHtml(DEFAULT_PROMPTS[slot]);
    editorRef.current.innerHTML = html;
    seedRef.current = html;
    setStored(DEFAULT_PROMPTS[slot]);
    setDirty(false);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl h-[85vh] rounded-2xl bg-card shadow-2xl border border-border overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-slate-800 truncate">prompt.{slot}.md</span>
            <span className="text-[11px] text-slate-400 truncate">
              · {AGENT_SLOT_LABELS[slot]} · {scope === "global" ? "global" : `project · ${scope}`}
            </span>
            {isDefault ? <Badge tone="slate">Default</Badge> : <Badge tone="indigo">Personalizado</Badge>}
            {dirty && <Badge tone="amber">Sin guardar</Badge>}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={onRestore} title="Restaurar default" className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100">
              <RefreshCw className="h-3.5 w-3.5" /> Restaurar
            </button>
            <div className="mx-1 h-5 w-px bg-slate-200" />
            <IconBtn title="Copiar" onClick={() => navigator.clipboard?.writeText(editorRef.current?.innerText || "")}><Copy className="h-4 w-4" /></IconBtn>
            {dirty && (
              <button onClick={onSave} className="ml-1 inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700">
                <Save className="h-3.5 w-3.5" /> Guardar
              </button>
            )}
            <div className="mx-1 h-5 w-px bg-slate-200" />
            <button onClick={onClose} title="Cerrar" className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-slate-100 hover:text-slate-800">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Toolbar — same as PhaseEditor */}
        <div className="flex items-center gap-0.5 border-b border-border bg-slate-50/60 px-3 py-1.5 overflow-x-auto shrink-0">
          <ToolBtn title="Deshacer" onClick={() => exec("undo")}><Undo2 className="h-4 w-4" /></ToolBtn>
          <ToolBtn title="Rehacer" onClick={() => exec("redo")}><Redo2 className="h-4 w-4" /></ToolBtn>
          <ToolDiv />
          <ToolBtn title="Negrita" onClick={() => exec("bold")}><Bold className="h-4 w-4" /></ToolBtn>
          <ToolBtn title="Itálica" onClick={() => exec("italic")}><Italic className="h-4 w-4" /></ToolBtn>
          <ToolBtn title="Tachado" onClick={() => exec("strikeThrough")}><Strikethrough className="h-4 w-4" /></ToolBtn>
          <ToolBtn title="Código inline" onClick={() => exec("formatBlock", "pre")}><Code className="h-4 w-4" /></ToolBtn>
          <ToolDiv />
          <ToolBtn title="Heading 1" onClick={() => exec("formatBlock", "h1")}><Heading1 className="h-4 w-4" /></ToolBtn>
          <ToolBtn title="Heading 2" onClick={() => exec("formatBlock", "h2")}><Heading2 className="h-4 w-4" /></ToolBtn>
          <ToolDiv />
          <ToolBtn title="Lista" onClick={() => exec("insertUnorderedList")}><List className="h-4 w-4" /></ToolBtn>
          <ToolBtn title="Lista numerada" onClick={() => exec("insertOrderedList")}><ListOrdered className="h-4 w-4" /></ToolBtn>
          <ToolBtn title="Cita" onClick={() => exec("formatBlock", "blockquote")}><Quote className="h-4 w-4" /></ToolBtn>
          <ToolBtn title="Bloque código" onClick={() => exec("formatBlock", "pre")}><Code2 className="h-4 w-4" /></ToolBtn>
          <ToolBtn title="Separador" onClick={() => exec("insertHorizontalRule")}><Minus className="h-4 w-4" /></ToolBtn>
          <ToolBtn title="Enlace" onClick={() => { const url = prompt("URL"); if (url) exec("createLink", url); }}><LinkIcon className="h-4 w-4" /></ToolBtn>
        </div>

        {/* Editor surface — internal scroll keeps header/toolbar fixed */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={onInput}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`prose-kosmo max-w-none px-8 py-7 flex-1 min-h-0 overflow-y-auto kosmo-scroll focus:outline-none ${focused ? "ring-1 ring-indigo-200/60 ring-inset" : ""}`}
        />
      </div>
    </div>
  );
}

