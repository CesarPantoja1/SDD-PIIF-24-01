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

export function DocOutline({ editorScope }: { editorScope: string }) {
  const [items, setItems] = useState<{ level: number; text: string; id: string }[]>([]);

  useEffect(() => {
    const compute = () => {
      const editor = document.querySelector<HTMLDivElement>(`[data-editor-scope="${editorScope}"]`);
      if (!editor) { setItems([]); return; }
      const headings = Array.from(editor.querySelectorAll("h1, h2, h3, h4")) as HTMLElement[];
      const out = headings.map((h, i) => {
        const level = Number(h.tagName.substring(1));
        const text = h.textContent?.trim() || "";
        let id = h.id;
        if (!id) { id = `h-${editorScope}-${i}`; h.id = id; }
        return { level, text, id };
      });
      setItems(out);
    };
    // initial + observe
    compute();
    const editor = document.querySelector(`[data-editor-scope="${editorScope}"]`);
    if (!editor) return;
    const obs = new MutationObserver(() => compute());
    obs.observe(editor, { childList: true, subtree: true, characterData: true });
    return () => obs.disconnect();
  }, [editorScope]);

  return (
    <aside className="hidden lg:flex flex-col shrink-0 self-stretch min-h-0 pr-3 max-w-xs">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-2 mb-2">Contenido</div>
      <nav className="space-y-0.5 text-[12.5px] border-l border-border overflow-y-auto kosmo-scroll min-h-0 pr-1">
        {items.length === 0 && <div className="pl-3 pr-3 text-[11px] italic text-slate-400 whitespace-nowrap">Sin encabezados</div>}
        {items.map((it) => (
          <a
            key={it.id}
            href={`#${it.id}`}
            onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById(it.id);
              el?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className={`block whitespace-nowrap py-1 pr-3 text-muted-foreground hover:text-indigo-700 border-l-2 border-transparent hover:border-indigo-400 -ml-px ${
              it.level === 1 ? "pl-3 font-medium text-slate-700" :
              it.level === 2 ? "pl-5" :
              it.level === 3 ? "pl-7 text-[12px]" : "pl-9 text-[11.5px]"
            }`}
          >
            {it.text}
          </a>
        ))}
      </nav>
    </aside>
  );
}



/* ============== PHASE EDITOR (inline WYSIWYG md) ============== */

