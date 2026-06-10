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

export type LocalFolder = { name: string; linkedAt: string };


export function CodeGenView({ projectId, specId, specName, onGenerated }: { projectId: string; specId: string | null; specName: string | null; onGenerated?: () => void }) {
  const key = `kosmo.project.${projectId}.code.${specId ?? "root"}.folder`;
  const [folder, setFolder] = useLocal<LocalFolder | null>(key, null);
  const handleRef = useRef<any>(null);
  const [generating, setGenerating] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [files, setFiles] = useState<{ path: string; size: string; status: "new" | "modified" }[]>([]);

  const supportsFS = typeof window !== "undefined" && "showDirectoryPicker" in window;

  const linkFolder = async () => {
    if (!supportsFS) {
      const name = prompt("Tu navegador no soporta el selector de carpetas. Ingresa una ruta local manualmente (ej: /Users/tu/projects/" + projectId + "):");
      if (name && name.trim()) setFolder({ name: name.trim(), linkedAt: new Date().toISOString() });
      return;
    }
    try {
      // @ts-expect-error - File System Access API
      const handle = await window.showDirectoryPicker({ mode: "readwrite" });
      handleRef.current = handle;
      setFolder({ name: handle.name, linkedAt: new Date().toISOString() });
    } catch {
      /* user cancelled */
    }
  };

  const unlink = () => { setFolder(null); handleRef.current = null; setFiles([]); setLog([]); };

  const generate = () => {
    if (!folder) return;
    setGenerating(true);
    setLog([]);
    setFiles([]);
    const steps = [
      `$ kosmo code:generate --spec="${specName ?? "root"}" --target="${folder.name}"`,
      "→ Leyendo design.md y tasks.md",
      "→ Resolviendo stack: Next.js · tRPC · Drizzle · Postgres",
      "→ Agente Creador escribiendo módulos…",
      "  ✓ apps/web/app/page.tsx",
      "  ✓ apps/web/components/Reservation.tsx",
      "  ✓ apps/api/src/routes/reservations.ts",
      "  ✓ packages/db/schema.ts",
      "→ Agente Revisor validando estilo y tipos…",
      "  ✓ ESLint OK · TypeScript strict OK",
      `✓ Código sincronizado con ${folder.name}/`,
    ];
    let i = 0;
    const tick = () => {
      if (i >= steps.length) { setGenerating(false); onGenerated?.(); return; }
      setLog((l) => [...l, steps[i]]);
      i++;
      setTimeout(tick, 380);
    };
    tick();
    setFiles([
      { path: "apps/web/app/page.tsx", size: "2.1 KB", status: "new" },
      { path: "apps/web/components/Reservation.tsx", size: "4.8 KB", status: "new" },
      { path: "apps/api/src/routes/reservations.ts", size: "3.2 KB", status: "new" },
      { path: "packages/db/schema.ts", size: "1.6 KB", status: "modified" },
    ]);
  };

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-slate-800">Generación de código</span>
          {specName && <span className="text-[11px] text-slate-400">· {specName}</span>}
        </div>
        <div className="text-[11px] text-muted-foreground">
          {folder ? <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />Carpeta vinculada</span> : <span className="inline-flex items-center gap-1.5 text-amber-600"><AlertTriangle className="h-3.5 w-3.5" />Sin carpeta local</span>}
        </div>
      </div>

      <div className="px-6 py-6 space-y-5">
        {/* Folder link card */}
        <div className="rounded-xl border border-border bg-gradient-to-br from-slate-50 to-white p-5">
          <div className="flex items-start gap-4">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold">Carpeta local de trabajo</h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-xl">
                El código generado nunca se guarda en la base de datos (sería demasiado pesado). En su lugar, KOSMO escribe los archivos directamente en una carpeta de tu computadora. Vincúlala una sola vez por spec.
              </p>
              {folder ? (
                <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-xs">
                  <Folder className="h-3.5 w-3.5 text-indigo-500" />
                  <span className="font-mono font-medium">{folder.name}/</span>
                  <span className="text-slate-400">· vinculada {new Date(folder.linkedAt).toLocaleDateString()}</span>
                </div>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              {folder && (
                <button onClick={unlink} className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                  Desvincular
                </button>
              )}
              <button onClick={linkFolder} className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700">
                <Folder className="h-3.5 w-3.5" /> {folder ? "Cambiar carpeta" : "Vincular carpeta"}
              </button>
            </div>
          </div>
          {!supportsFS && (
            <div className="mt-3 text-[11px] text-amber-600 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Tu navegador no soporta el File System Access API. Usa Chrome o Edge para vincular carpetas reales.
            </div>
          )}
        </div>

        {/* Generation controls */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Stack detectado</div>
            <div className="mt-2 text-sm font-medium">Next.js · tRPC · Drizzle</div>
            <div className="mt-1 text-[11px] text-muted-foreground">Inferido de design.md</div>
          </Card>
          <Card>
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Tareas mapeadas</div>
            <div className="mt-2 text-sm font-medium">12 tareas</div>
            <div className="mt-1 text-[11px] text-muted-foreground">De tasks.md → archivos</div>
          </Card>
          <Card>
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Última generación</div>
            <div className="mt-2 text-sm font-medium">{files.length ? "Hace unos segundos" : "Nunca"}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">{files.length} archivo(s)</div>
          </Card>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            El agente leerá <span className="font-medium text-slate-700">design.md</span> y <span className="font-medium text-slate-700">tasks.md</span>, y escribirá el código en tu carpeta vinculada.
          </div>
          <button
            onClick={generate}
            disabled={!folder || generating}
            className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Sparkles className="h-4 w-4" /> {generating ? "Generando…" : files.length ? "Regenerar código" : "Generar código"}
          </button>
        </div>

        {/* Terminal output */}
        {(log.length > 0 || generating) && (
          <div className="rounded-xl border border-slate-800 bg-slate-950 text-slate-100 p-4 font-mono text-[12px] leading-6 max-h-72 overflow-y-auto">
            {log.map((l, i) => (
              <div key={i} className={l.startsWith("✓") ? "text-emerald-400" : l.startsWith("→") ? "text-indigo-300" : l.startsWith("$") ? "text-slate-300" : "text-slate-400"}>
                {l}
              </div>
            ))}
            {generating && <div className="text-muted-foreground animate-pulse">▍</div>}
          </div>
        )}

        {/* Files written */}
        {files.length > 0 && (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-border">
              <div className="text-xs font-semibold text-slate-700">Archivos escritos en {folder?.name}/</div>
              <span className="text-[11px] text-muted-foreground">{files.length} archivos</span>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {files.map((f) => (
                  <tr key={f.path} className="hover:bg-slate-50/60">
                    <td className="px-4 py-2 font-mono text-[12.5px] text-slate-700">{f.path}</td>
                    <td className="px-4 py-2 text-right text-[11px] text-muted-foreground tabular-nums">{f.size}</td>
                    <td className="px-4 py-2 w-24 text-right">
                      <Badge tone={f.status === "new" ? "green" : "amber"}>{f.status === "new" ? "nuevo" : "modificado"}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============== PROFILE VIEW ============== */

