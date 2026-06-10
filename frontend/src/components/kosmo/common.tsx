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

export function SidebarProjectRow({ project, isOpen, onToggle }: { project: ProjectMeta; isOpen: boolean; onToggle: () => void }) {
  const name = useProjectDisplayName(project);
  return (
    <button
      onClick={onToggle}
      className="group flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-slate-700 hover:bg-white hover:shadow-sm"
    >
      {isOpen ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
      {isOpen ? <FolderOpen className="h-4 w-4 text-indigo-500" /> : <Folder className="h-4 w-4 text-slate-400" />}
      <span className="truncate">{name}</span>
    </button>
  );
}

export function SidebarItem({ icon: Icon, label, active, onClick }: { icon: any; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm ${active ? "bg-card text-indigo-700 font-medium shadow-sm" : "text-slate-700 hover:bg-white"}`}>
      <Icon className={`h-4 w-4 ${active ? "text-indigo-600" : "text-muted-foreground"}`} />
      <span>{label}</span>
    </button>
  );
}

export function MenuItem({ icon: Icon, label, onClick }: { icon: any; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span>{label}</span>
    </button>
  );
}

export function KpiCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) {
  return (
    <Card>
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      {sub && <div className="mt-1 text-[11px] text-muted-foreground">{sub}</div>}
    </Card>
  );
}

export function Donut({ size, stroke, segments, centerLabel }: { size: number; stroke: number; segments: { start: number; end: number; color: string }[]; centerLabel?: string }) {
  const r = (size - stroke) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  const toDash = (start: number, end: number) => {
    const len = ((end - start) / 360) * circ;
    return `${len} ${circ - len}`;
  };
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={c} cy={c} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
        {segments.map((s, i) => (
          <circle
            key={i}
            cx={c} cy={c} r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={stroke}
            strokeDasharray={toDash(s.start, s.end)}
            strokeDashoffset={-(s.start / 360) * circ}
            strokeLinecap="butt"
          />
        ))}
      </svg>
      {centerLabel && (
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-sm font-semibold tracking-tight">{centerLabel}</div>
        </div>
      )}
    </div>
  );
}

export function fmtTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function MissingKeyHint({ provider, onOpenApiKeys }: { provider: ProviderKey; onOpenApiKeys?: () => void }) {
  return (
    <div className="mt-2 text-[11px] text-amber-600 flex items-center gap-1 flex-wrap">
      <AlertTriangle className="h-3 w-3" />
      Falta API Key para {PROVIDERS[provider].label}. Agrégala en Workspace Settings →{" "}
      {onOpenApiKeys ? (
        <button
          onClick={onOpenApiKeys}
          className="underline underline-offset-2 font-medium text-amber-700 hover:text-amber-800"
        >
          API Keys
        </button>
      ) : (
        <span className="underline">API Keys</span>
      )}
      .
    </div>
  );
}

export function PromptEditButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="mt-3 flex justify-end">
      <button
        onClick={onClick}
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
      >
        <FileCode2 className="h-3 w-3" /> Editar prompt
      </button>
    </div>
  );
}


export function ProjectTree({ projectId, view, onPick, onSettings }: {
  projectId: string;
  view: View;
  onPick: (specId: string | null, doc: DocKey) => void;
  onSettings: () => void;
}) {
  const [specs] = useProjectSpecs(projectId);
  const [generated, , { isLoaded: generatedLoaded }] = useGenerated(projectId);
  const [openSpecs, setOpenSpecs] = useLocal<Record<string, boolean>>(`kosmo.project.${projectId}.openSpecs`, Object.fromEntries(specs.map((s) => [s.id, true])));
  const isActive = (specId: string | null, doc: DocKey) =>
    view.kind === "workspace" && view.projectId === projectId && view.specId === specId && view.doc === doc;
  const activeSettings = view.kind === "project-settings" && view.projectId === projectId;

  // Una fase solo es navegable si ya está generada. Brief (Discovery) es el punto de entrada.
  const unlocked = (specId: string | null, doc: DocKey) => {
    if (specId === null && doc === "brief") return true;
    return generatedLoaded && !!generated[docKey(specId, doc)];
  };

  return (
    <div className="ml-5 mt-0.5 border-l border-border pl-2">
      {/* Discovery (project-level) */}
      <button
        onClick={() => onPick(null, "brief")}
        className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] ${isActive(null, "brief") ? "bg-indigo-50 text-indigo-700 font-medium" : "text-slate-600 hover:bg-white"}`}
      >
        <Compass className="h-3.5 w-3.5" />
        <span>Discovery</span>
        
        <span className="ml-auto text-[10px] text-slate-400">brief.md</span>
      </button>

      {/* Specs */}
      <div className="mt-2 px-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        <span>Specs · {specs.length}</span>
      </div>
      {specs.length === 0 && (
        <div className="px-2 py-1.5 text-[11px] italic text-slate-400">Genera Discovery para crear specs</div>
      )}
      {specs.map((s) => {
        const open = !!openSpecs[s.id];
        return (
          <div key={s.id} className="mt-0.5">
            <button
              onClick={() => setOpenSpecs({ ...openSpecs, [s.id]: !open })}
              className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-[13px] text-slate-700 hover:bg-white"
            >
              {open ? <ChevronDown className="h-3 w-3 text-slate-400" /> : <ChevronRight className="h-3 w-3 text-slate-400" />}
              <Box className="h-3.5 w-3.5 text-violet-500" />
              <span className="truncate">{s.name}</span>
            </button>
            {open && (
              <div className="ml-4 border-l border-border pl-2">
                {SPEC_DOCS.map((d) => {
                  const D = DOCS[d];
                  const Icon = D.icon;
                  const active = isActive(s.id, d);
                  const isUnlocked = unlocked(s.id, d);
                  const isGen = !!generated[docKey(s.id, d)];
                  return (
                    <button
                      key={d}
                      onClick={() => { if (isUnlocked) onPick(s.id, d); }}
                      disabled={!isUnlocked}
                      title={!isUnlocked ? "Bloqueado: genera la fase anterior primero" : undefined}
                      className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-[12.5px] ${active ? "bg-indigo-50 text-indigo-700 font-medium" : isGen ? "text-slate-600 hover:bg-white" : "text-slate-400"} ${!isUnlocked ? "cursor-not-allowed hover:bg-transparent" : ""}`}
                    >
                      <Icon className={`h-3.5 w-3.5 shrink-0 ${isGen || active ? "" : "text-slate-300"}`} />
                      <span>{D.label}</span>
                      <span className="ml-auto text-[10px] text-slate-400">{D.file}</span>
                    </button>
                  );

                })}
              </div>
            )}
          </div>
        );
      })}

      <button
        onClick={onSettings}
        className={`mt-2 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] ${activeSettings ? "bg-indigo-50 text-indigo-700 font-medium" : "text-muted-foreground hover:bg-white"}`}
      >
        <Settings className="h-3.5 w-3.5" />
        <span>Settings</span>
      </button>
    </div>
  );
}

export function IconBtn({ children, title, onClick }: { children: React.ReactNode; title: string; onClick?: () => void }) {
  return (
    <button title={title} onClick={onClick} className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-slate-100 hover:text-slate-800">
      {children}
    </button>
  );
}
export function ToolBtn({ children, title, onClick }: { children: React.ReactNode; title: string; onClick?: () => void }) {
  return (
    <button type="button" title={title} onMouseDown={(e) => e.preventDefault()} onClick={onClick} className="grid h-7 w-7 place-items-center rounded-md text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm">
      {children}
    </button>
  );
}
export function ToolDiv() { return <span className="mx-1 h-5 w-px bg-slate-200" />; }

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      <div className="mt-2 text-[15px] leading-relaxed text-slate-700">{children}</div>
    </section>
  );
}


export function Tree({ depth, icon, children }: { depth: number; icon: "folder" | "file"; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2" style={{ paddingLeft: depth * 16 }}>
      <span className="text-muted-foreground">{icon === "folder" ? "▸" : "·"}</span>
      <span className={icon === "folder" ? "text-indigo-300" : "text-slate-200"}>{children}</span>
    </div>
  );
}

export function DiagramBox({ title, sub, tone }: { title: string; sub: string; tone: "indigo" | "violet" | "slate" | "emerald" }) {
  const tones: Record<string, string> = {
    indigo: "from-indigo-500/10 to-indigo-500/5 border-indigo-200 text-indigo-900",
    violet: "from-violet-500/10 to-violet-500/5 border-violet-200 text-violet-900",
    slate: "from-slate-500/10 to-slate-500/5 border-border text-foreground",
    emerald: "from-emerald-500/10 to-emerald-500/5 border-emerald-200 text-emerald-900",
  };
  return (
    <button className={`rounded-lg border bg-gradient-to-br ${tones[tone]} p-4 text-left hover:shadow-md transition`}>
      <div className="text-sm font-semibold">{title}</div>
      <div className="text-xs opacity-70">{sub}</div>
    </button>
  );
}

export function Arrow() {
  return (
    <div className="flex items-center justify-center text-slate-300">
      <div className="h-px flex-1 bg-slate-300" />
      <ChevronRight className="h-4 w-4 -ml-1" />
    </div>
  );
}

export function Dot({ delay = "0ms" }: { delay?: string }) {
  return <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: delay }} />;
}

/* ============== PRIMITIVES ============== */
export function InnerSidebar({ title, tabs, active, onSelect }: { title: string; tabs: string[]; active: string; onSelect: (t: string) => void }) {
  return (
    <div className="w-60 shrink-0 border-r border-border bg-slate-50 px-3 py-6">
      <div className="px-2 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</div>
      <nav className="space-y-0.5">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => onSelect(t)}
            className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm ${active === t ? "bg-card text-indigo-700 font-medium shadow-sm border border-border" : "text-slate-600 hover:bg-white"}`}
          >
            {iconFor(t)}
            <span>{t}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export function iconFor(t: string) {
  const map: Record<string, any> = {
    General: Wrench, Standards: Box, Integrations: Github, "Global Monitoring": BarChart3,
    Monitoring: BarChart3, "API Keys": Cpu,
    "Danger Zone": AlertTriangle, Repository: GitBranch, "Coding Agents": Bot,
  };
  const I = map[t] || Settings;
  return <I className="h-4 w-4 text-muted-foreground" />;
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}>{children}</div>;
}

export function CardHeader({ title, hint, icon: Icon }: { title: string; hint?: string; icon?: any }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-indigo-500" />}
        <h3 className="font-semibold">{title}</h3>
      </div>
      {hint && <span className="text-xs text-slate-400">{hint}</span>}
    </div>
  );
}

export function Badge({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "green" | "red" | "amber" | "indigo" }) {
  const tones: Record<string, string> = {
    slate: "bg-slate-100 text-slate-600 border-border",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    red: "bg-red-50 text-red-700 border-red-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
  };
  return <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${tones[tone]}`}>{children}</span>;
}

export function Stat({ label, value, trend }: { label: string; value: string; trend: string }) {
  return (
    <Card>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-2 flex items-end gap-2">
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        <div className="text-xs text-emerald-600 mb-1">{trend}</div>
      </div>
    </Card>
  );
}


export const inputCls = "w-full rounded-md border border-border bg-card px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500";
export function PField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export function PlaceholderCard({ title }: { title: string }) {
  return (
    <Card>
      <div className="text-sm text-slate-600">{title}</div>
      <div className="mt-4 h-32 rounded-lg border border-dashed border-border grid place-items-center text-xs text-slate-400">Coming soon</div>
    </Card>
  );
}

export function TerminalLog({ lines }: { lines: string[] }) {
  const [shown, setShown] = useState<string[]>([]);
  useEffect(() => {
    setShown([]);
    lines.forEach((l, i) => setTimeout(() => setShown((s) => [...s, l]), i * 280));
  }, [lines.join("|")]);
  return (
    <div className="mt-4 rounded-lg bg-slate-900 text-slate-100 p-4 font-mono text-[12px] leading-6">
      <div className="flex items-center gap-1.5 mb-2 text-slate-400 text-[11px]"><Terminal className="h-3 w-3" /> oauth.log</div>
      {shown.map((l, i) => <div key={i} className={l.startsWith("✓") ? "text-emerald-400" : l.startsWith("→") ? "text-indigo-300" : "text-slate-300"}>{l}</div>)}
      <span className="inline-block h-3 w-2 bg-slate-100 animate-pulse align-middle" />
    </div>
  );
}

/* ============== HOME ============== */
export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 60) return `hace ${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.round(h / 24);
  return `hace ${d}d`;
}

export function StatusBadge({ status }: { status: ProjectStatus }) {
  if (status === "active") return <Badge tone="green">Activo</Badge>;
  if (status === "paused") return <Badge tone="amber">En pausa</Badge>;
  return <Badge tone="slate">Archivado</Badge>;
}


