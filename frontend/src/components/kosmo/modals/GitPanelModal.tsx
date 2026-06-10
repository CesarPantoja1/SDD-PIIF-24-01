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

export type GitFileChange = { path: string; status: "M" | "A" | "D" };


export type GitCommitEntry = { hash: string; author: string; time: string; message: string };


export function GitPanelModal({ projectId, projectName, onClose }: { projectId: string; projectName: string; onClose: () => void }) {
  const [branch, setBranch] = useLocal<string>(`kosmo.project.${projectId}.git.branch`, "main");
  const [remote] = useLocal<string>(`kosmo.project.${projectId}.git.remote`, `git@github.com:cesar/${projectId}.git`);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<"changes" | "history" | "remote">("changes");
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState<null | "commit" | "push" | "pull">(null);

  // Mock changes & commits — persistidos para que el demo sea coherente.
  const [changes, setChanges] = useLocal<GitFileChange[]>(`kosmo.project.${projectId}.git.changes`, [
    { path: "specs/reservas/requirements.md", status: "M" },
    { path: "specs/reservas/design.md", status: "M" },
    { path: "src/routes/reservations.ts", status: "A" },
  ]);
  const [commits, setCommits] = useLocal<GitCommitEntry[]>(`kosmo.project.${projectId}.git.commits`, [
    { hash: "a3f9c21", author: "Cesar Pantoja", time: "hace 2h", message: "feat(specs): cierra requirements de Reservas" },
    { hash: "9be1042", author: "Cesar Pantoja", time: "hace 1d", message: "chore: regenera design.md con revisor" },
    { hash: "12adf87", author: "Cesar Pantoja", time: "hace 3d", message: "init: brief inicial del proyecto" },
  ]);

  const appendLog = (lines: string[]) => setLog((l) => [...l, ...lines]);

  const doCommit = () => {
    if (!message.trim() || changes.length === 0 || busy) return;
    setBusy("commit");
    appendLog([`$ git add .`, `$ git commit -m "${message.trim()}"`]);
    setTimeout(() => {
      const hash = Math.random().toString(16).slice(2, 9);
      const newCommit: GitCommitEntry = { hash, author: "Cesar Pantoja", time: "hace unos segundos", message: message.trim() };
      setCommits([newCommit, ...commits]);
      setChanges([]);
      appendLog([`[${branch} ${hash}] ${message.trim()}`, ` ${changes.length} file(s) changed`]);
      setMessage("");
      setBusy(null);
    }, 700);
  };

  const doPush = () => {
    if (busy) return;
    setBusy("push");
    appendLog([`$ git push origin ${branch}`, "→ subiendo objetos…", "✓ remoto actualizado"]);
    setTimeout(() => setBusy(null), 800);
  };

  const doPull = () => {
    if (busy) return;
    setBusy("pull");
    appendLog([`$ git pull origin ${branch}`, "→ ya estás al día"]);
    setTimeout(() => setBusy(null), 700);
  };

  const statusTone: Record<GitFileChange["status"], string> = {
    M: "bg-amber-50 text-amber-700 border-amber-200",
    A: "bg-emerald-50 text-emerald-700 border-emerald-200",
    D: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl h-[80vh] rounded-2xl bg-card shadow-2xl border border-border overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-slate-900 text-white">
            <GitBranch className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold flex items-center gap-2">
              Git · {projectName}
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-700">
                <GitBranch className="h-3 w-3" /> {branch}
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground truncate">{remote}</div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={doPull} disabled={!!busy} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
              <ArrowDownToLine className="h-3.5 w-3.5" /> Pull
            </button>
            <button onClick={doPush} disabled={!!busy} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
              <ArrowUpFromLine className="h-3.5 w-3.5" /> Push
            </button>
            <button onClick={onClose} aria-label="Close" className="ml-1 grid h-7 w-7 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-border bg-slate-50/60 px-3">
          {([
            { k: "changes", label: `Cambios (${changes.length})`, icon: GitCommit },
            { k: "history", label: "Commits", icon: GitMerge },
            { k: "remote", label: "Remoto", icon: Github },
          ] as const).map(({ k, label, icon: Icon }) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px ${tab === k ? "border-indigo-500 text-indigo-700" : "border-transparent text-slate-600 hover:text-slate-900"}`}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[1fr_320px]">
          <div className="overflow-y-auto p-5">
            {tab === "changes" && (
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Archivos modificados</h4>
                {changes.length === 0 ? (
                  <div className="rounded-md border border-dashed border-border p-6 text-center text-xs text-slate-400">
                    Sin cambios pendientes. Working tree limpio.
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {changes.map((c) => (
                      <li key={c.path} className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs">
                        <span className={`inline-grid h-5 w-5 place-items-center rounded font-mono font-semibold border ${statusTone[c.status]}`}>{c.status}</span>
                        <span className="font-mono text-slate-700 truncate flex-1">{c.path}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-5">
                  <label className="text-[11px] font-medium text-muted-foreground">Mensaje del commit</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    placeholder="feat(spec): describe brevemente el cambio…"
                    className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  />
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={doCommit}
                      disabled={!message.trim() || changes.length === 0 || !!busy}
                      className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <GitCommit className="h-3.5 w-3.5" /> {busy === "commit" ? "Commiteando…" : `Commit a ${branch}`}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {tab === "history" && (
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Últimos commits</h4>
                <ul className="space-y-1.5">
                  {commits.map((c) => (
                    <li key={c.hash} className="rounded-md border border-border bg-card px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <GitCommit className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                        <span className="font-mono text-[11px] text-muted-foreground">{c.hash}</span>
                        <span className="text-[11px] text-slate-400">· {c.author}</span>
                        <span className="ml-auto text-[11px] text-slate-400">{c.time}</span>
                      </div>
                      <div className="mt-1 text-sm text-slate-800 truncate">{c.message}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {tab === "remote" && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground">Branch activa</label>
                  <select value={branch} onChange={(e) => setBranch(e.target.value)} className="mt-1 w-full max-w-xs rounded-md border border-border bg-card px-3 py-2 text-sm">
                    {["main", "develop", "staging"].map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground">Repositorio remoto</label>
                  <div className="mt-1 rounded-md border border-border bg-slate-50 px-3 py-2 text-xs font-mono text-slate-700 break-all">{remote}</div>
                  <p className="mt-1 text-[11px] text-slate-400">Configura el repositorio desde Project Settings → Repository.</p>
                </div>
              </div>
            )}
          </div>

          {/* Terminal log */}
          <div className="border-l border-border bg-slate-950 text-slate-100 p-4 font-mono text-[11.5px] leading-6 overflow-y-auto">
            <div className="flex items-center gap-1.5 mb-2 text-slate-400 text-[11px]">
              <Terminal className="h-3 w-3" /> git.log
            </div>
            {log.length === 0 ? (
              <div className="text-muted-foreground">// Las operaciones de git se mostrarán aquí.</div>
            ) : (
              log.map((l, i) => (
                <div key={i} className={l.startsWith("✓") ? "text-emerald-400" : l.startsWith("→") ? "text-indigo-300" : l.startsWith("$") ? "text-slate-200" : "text-slate-400"}>
                  {l}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

