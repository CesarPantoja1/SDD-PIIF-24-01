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
  useProjectSpecs, useVisibleProjects, useProjectById,
} from "@/hooks/use-project";

import {
  Card, CardHeader, Badge, Stat, KpiCard, Donut, fmtTokens, MissingKeyHint,
  PromptEditButton, IconBtn, ToolBtn, ToolDiv, Section, Tree, DiagramBox,
  Arrow, Dot, InnerSidebar, iconFor, TerminalLog, timeAgo, PField,
  PlaceholderCard, StatusBadge, inputCls, SidebarProjectRow, SidebarItem,
  MenuItem, ProjectTree,
} from "@/components/kosmo/common";

import { DocOutline } from "@/components/kosmo/workspace/DocOutline";
import { PhaseEditor, phaseInitialHtml } from "@/components/kosmo/workspace/PhaseEditor";
import { VibeChat } from "@/components/kosmo/workspace/VibeChat";
import { AgentWorkingModal } from "@/components/kosmo/workspace/AgentWorkingModal";
import { ApollonDesignEditor } from "@/components/kosmo/workspace/ApollonDesignEditor";
import { CodeGenView } from "@/components/kosmo/workspace/CodeGenView";
import { GitPanelModal } from "@/components/kosmo/modals/GitPanelModal";

export type DocSlot = { specId: string | null; specName: string | null; doc: DocKey };


export function buildSequence(specs: SpecRef[]): DocSlot[] {
  const seq: DocSlot[] = [{ specId: null, specName: null, doc: "brief" }];
  for (const s of specs) for (const d of SPEC_DOCS) seq.push({ specId: s.id, specName: s.name, doc: d });
  return seq;
}


export function Workspace({ projectId, specId, doc, autoStartBrief = false, onNav, onHome, chatOpen, onToggleChat, onCloseChat, gitOpen, onToggleGit }: { projectId: string; specId: string | null; doc: DocKey; autoStartBrief?: boolean; onNav: (specId: string | null, doc: DocKey) => void; onHome: () => void; chatOpen: boolean; onToggleChat: () => void; onCloseChat: () => void; gitOpen: boolean; onToggleGit: () => void }) {
  const project = useProjectById(projectId);
  const [specs] = useProjectSpecs(projectId);
  const [generated, setGenerated, { isLoaded: generatedLoaded }] = useGenerated(projectId);
  const [working, setWorking] = useState<null | { specId: string | null; doc: DocKey; mode: "generate" | "regenerate"; toLabel: string; navigateOnDone?: boolean }>(null);
  const [outlineOpen, setOutlineOpen] = useState<boolean>(true);
  const autoStartedRef = useRef<string | null>(null);

  // Auto-arrancar el modal de Descubrimiento SOLO cuando el padre lo indica
  // explícitamente (al venir desde "Crear proyecto"). Navegar por la sidebar
  // NUNCA dispara una nueva generación.
  useEffect(() => {
    if (!projectId) return;
    if (!autoStartBrief) return;
    if (!generatedLoaded) return;
    if (autoStartedRef.current === projectId) return;
    if (generated["brief"]) { autoStartedRef.current = projectId; return; }
    if (working) return;
    if (doc !== "brief" || specId !== null) return;
    autoStartedRef.current = projectId;
    setWorking({
      specId: null,
      doc: "brief",
      mode: "generate",
      toLabel: `${DOCS["brief"].sub}`,
    });
  }, [projectId, autoStartBrief, generated, generatedLoaded, working, doc, specId]);


  const seq = buildSequence(specs);
  const idx = seq.findIndex((x) => x.specId === specId && x.doc === doc);
  const slot = seq[idx] ?? seq[0];
  const prev = idx > 0 ? seq[idx - 1] : null;
  const next = idx >= 0 && idx < seq.length - 1 ? seq[idx + 1] : null;

  const currentKey = docKey(slot.specId, slot.doc);
  const isGenerated = generatedLoaded && !!generated[currentKey];
  const nextGenerated = generatedLoaded && next ? !!generated[docKey(next.specId, next.doc)] : false;

  const startGenerate = (target: DocSlot, mode: "generate" | "regenerate", navigateOnDone = false) => {
    const label = `${DOCS[target.doc].sub}${target.specName ? ` · ${target.specName}` : ""}`;
    setWorking({ specId: target.specId, doc: target.doc, mode, toLabel: label, navigateOnDone });
  };

  // Stepper context: 5 steps (Discovery + req/design/tasks/code of current spec)
  const stepDocs: DocKey[] = ["brief", "requirements", "design", "tasks", "code"];
  const contextSpec = slot.specId
    ? specs.find((s) => s.id === slot.specId) ?? null
    : null;
  const canOpenContextSpec = contextSpec ? generatedLoaded && !!generated[docKey(contextSpec.id, "requirements")] : false;
  const stepActiveIdx = slot.doc === "brief" ? 0 : stepDocs.indexOf(slot.doc);

  return (
    <div className="flex h-full flex-col">
      {/* Header + stepper */}
      <div className="border-b border-border px-8 pt-6 pb-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <button onClick={onHome} className="hover:text-indigo-600 hover:underline">Projects</button>
          <ChevronRight className="h-3 w-3" />
          <button onClick={() => onNav(null, "brief")} className="hover:text-indigo-600 hover:underline">{project.name}</button>
          {contextSpec && (
            <>
              <ChevronRight className="h-3 w-3" />
              <button
                onClick={() => { if (canOpenContextSpec) onNav(contextSpec.id, "requirements"); }}
                disabled={!canOpenContextSpec}
                className="hover:text-indigo-600 hover:underline disabled:hover:no-underline disabled:cursor-not-allowed disabled:text-slate-400"
              >
                {contextSpec.name}
              </button>
            </>
          )}
          <ChevronRight className="h-3 w-3" /><span className="text-foreground font-medium">{DOCS[slot.doc].label}</span>
        </div>
        <div className="mt-2 flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">
            {project.name}
            {contextSpec && <span className="ml-2 text-slate-400 font-normal text-lg">/ {contextSpec.name}</span>}
          </h1>
          <button
            onClick={onToggleGit}
            title="Abrir panel de Git"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 shrink-0"
          >
            <GitBranch className="h-3.5 w-3.5 text-indigo-500" />
            Git
          </button>
        </div>

        <div className="mt-5 flex items-center">
          {stepDocs.map((dk, i) => {
            const D = DOCS[dk];
            const Icon = D.icon;
            const active = i === stepActiveIdx;
            const done = i < stepActiveIdx;
            const targetSpecId = dk === "brief" ? null : slot.specId;
            const stepKey = docKey(targetSpecId, dk);
            const isGen = generatedLoaded && !!generated[stepKey];
            // Desde el stepper/sidebar solo se puede entrar a fases ya generadas.
            // La fase siguiente se abre únicamente desde el botón inferior de generación.
            const baseDisabled = dk !== "brief" && !contextSpec;
            const locked = dk !== "brief" && (!generatedLoaded || !isGen);
            const disabled = baseDisabled || locked;
            const onClick = () => {
              if (disabled) return;
              onNav(targetSpecId, dk);
            };
            return (
              <div key={dk} className="flex items-center flex-1">
                <button onClick={onClick} disabled={disabled} title={locked ? "Bloqueado: genera la fase anterior primero" : undefined} className="flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed">
                  <div className={`relative grid h-9 w-9 place-items-center rounded-xl border transition ${done ? "bg-emerald-500 border-emerald-500 text-white shadow-sm" : active ? "bg-indigo-600 border-indigo-600 text-white shadow-sm" : isGen ? "bg-card border-slate-300 text-muted-foreground group-hover:border-slate-400 group-hover:text-slate-700" : "bg-card border-border text-slate-300 group-hover:border-slate-300"}`}>
                    {done ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <>
                        <Icon className={`h-4 w-4 ${locked ? "group-hover:opacity-0 transition-opacity" : ""}`} />
                        {locked && <Lock className="h-4 w-4 absolute opacity-0 group-hover:opacity-100 transition-opacity" />}
                      </>
                    )}
                  </div>

                  <div className="text-left">
                    <div className={`text-sm font-medium ${active ? "text-foreground" : "text-slate-600"}`}>{D.label}</div>
                    <div className="text-[11px] text-slate-400">{D.sub}</div>
                  </div>

                </button>
                {i < stepDocs.length - 1 && <div className={`mx-3 flex-1 h-px ${i < stepActiveIdx ? "bg-emerald-500" : "bg-slate-200"}`} />}
              </div>
            );
          })}
        </div>

      </div>

      {/* Split: outline | editor | chat */}
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 min-w-0 flex flex-col border-r border-border">
          <div className="flex-1 min-h-0 flex px-4 py-6 gap-5 overflow-hidden">
            {outlineOpen && slot.doc !== "code" && <DocOutline editorScope={currentKey} />}
            <div className="flex-1 min-w-0 min-h-0">
              {slot.doc === "code" ? (
                <CodeGenView
                  projectId={projectId}
                  specId={slot.specId}
                  specName={slot.specName}
                  onGenerated={() => setGenerated({ [docKey(slot.specId, "code")]: true })}
                />
              ) : slot.doc === "design" ? (
                <ApollonDesignEditor
                  projectId={projectId}
                  scopeKey={currentKey}
                  specName={slot.specName}
                  chatOpen={chatOpen}
                  onToggleChat={onToggleChat}
                  outlineOpen={outlineOpen}
                  onToggleOutline={() => setOutlineOpen((v) => !v)}
                  onRegenerate={() => startGenerate(slot, "regenerate")}
                />
              ) : (
                <PhaseEditor
                  projectId={projectId}
                  scopeKey={currentKey}
                  doc={slot.doc}
                  fileName={DOCS[slot.doc].file}
                  specName={slot.specName}
                  chatOpen={chatOpen}
                  onToggleChat={onToggleChat}
                  outlineOpen={outlineOpen}
                  onToggleOutline={() => setOutlineOpen((v) => !v)}
                  onRegenerate={() => startGenerate(slot, "regenerate")}
                />
              )}
            </div>
          </div>

          {/* Phase advance bar */}
          <div className="border-t border-border bg-white/80 backdrop-blur px-8 py-3 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Paso {idx + 1} de {seq.length} · <span className="text-slate-700 font-medium">{DOCS[slot.doc].sub}{slot.specName ? ` · ${slot.specName}` : ""}</span>
            </div>
            <div className="flex items-center gap-2">
              {prev && (
                <button
                  onClick={() => onNav(prev.specId, prev.doc)}
                  className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Anterior
                </button>
              )}
              {!generatedLoaded ? (
                <button disabled className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-slate-400 cursor-not-allowed">
                  Cargando estado…
                </button>
              ) : slot.doc !== "code" && !isGenerated ? (
                <button
                  onClick={() => startGenerate(slot, "generate")}
                  className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Generar {DOCS[slot.doc].sub}
                </button>
              ) : next ? (
                nextGenerated ? (
                  <button
                    onClick={() => onNav(next.specId, next.doc)}
                    className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
                  >
                    Siguiente <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                ) : next.doc === "code" ? (
                  <button
                    onClick={() => onNav(next.specId, next.doc)}
                    className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
                  >
                    Ir a {DOCS[next.doc].sub}{next.specName ? ` · ${next.specName}` : ""} <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => startGenerate(next, "generate", true)}
                    className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Generar {DOCS[next.doc].sub}{next.specName ? ` · ${next.specName}` : ""}
                  </button>
                )
              ) : null}
            </div>
          </div>
        </div>

        {/* Chatbot */}
        {chatOpen && <VibeChat onClose={onCloseChat} />}
      </div>
      {working && (
        <AgentWorkingModal
          mode={working.mode}
          toLabel={working.toLabel}
          onDone={async () => {
            await setGenerated({ [docKey(working.specId, working.doc)]: true });
            if (working.navigateOnDone) onNav(working.specId, working.doc);
            setWorking(null);
          }}
          onCancel={() => setWorking(null)}
        />
      )}
      {gitOpen && <GitPanelModal projectId={projectId} projectName={project.name} onClose={onToggleGit} />}
    </div>
  );
}

