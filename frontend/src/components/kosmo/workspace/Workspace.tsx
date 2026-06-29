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
import { useAuth } from "@/hooks/use-auth";
import { MOCK_VARIANTS } from "@/lib/mock-data";
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
import { SpecsOverview } from "@/components/kosmo/workspace/SpecsOverview";
import { GitPanelModal } from "@/components/kosmo/modals/GitPanelModal";

export type DocSlot = { specId: string | null; specName: string | null; doc: DocKey };


export function buildSequence(specs: SpecRef[]): DocSlot[] {
  const seq: DocSlot[] = [
    { specId: null, specName: null, doc: "brief" },
    { specId: null, specName: null, doc: "specs" },
  ];
  for (const s of specs) for (const d of SPEC_DOCS) seq.push({ specId: s.id, specName: s.name, doc: d });
  return seq;
}


export function Workspace({ projectId, specId, doc, autoStartBrief = false, onNav, onHome, chatOpen, onToggleChat, onCloseChat, gitOpen, onToggleGit }: { projectId: string; specId: string | null; doc: DocKey; autoStartBrief?: boolean; onNav: (specId: string | null, doc: DocKey) => void; onHome: () => void; chatOpen: boolean; onToggleChat: () => void; onCloseChat: () => void; gitOpen: boolean; onToggleGit: () => void }) {
  const { session } = useAuth();
  const token = session?.access_token ?? null;
  const [agents] = useProjectAgents(projectId);
  const project = useProjectById(projectId);
  const [specs] = useProjectSpecs(projectId);
  const [generated, setGenerated, { isLoaded: generatedLoaded }] = useGenerated(projectId);
  const [working, setWorking] = useState<null | { specId: string | null; doc: DocKey; mode: "generate" | "regenerate" | "generate-specs"; toLabel: string; navigateOnDone?: boolean }>(null);
  const [outlineOpen, setOutlineOpen] = useState<boolean>(true);
  const [editorKey, setEditorKey] = useState(0);
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
    console.log(
      "[Workspace] startGenerate",
      JSON.stringify({ doc: target.doc, mode, hasToken: !!token, projectId, provider: agents.discovery.creator.provider, model: agents.discovery.creator.model }),
    );
    const label = `${DOCS[target.doc].sub}${target.specName ? ` · ${target.specName}` : ""}`;
    setWorking({ specId: target.specId, doc: target.doc, mode, toLabel: label, navigateOnDone });
  };

  // Semantic flags
  const isDiscovery = specId === null && doc === "brief";
  const isSpecsView = specId === null && doc === "specs";
  const isSpecPhase = specId !== null;

  // Stepper context: 4 spec-level steps (Requirements → Design → Tasks → Code)
  const specStepDocs: DocKey[] = ["requirements", "design", "tasks", "code"];
  const contextSpec = slot.specId
    ? specs.find((s) => s.id === slot.specId) ?? null
    : null;
  const specStepActiveIdx = isSpecPhase ? specStepDocs.indexOf(slot.doc) : -1;
  const discoveryGenerated = generatedLoaded && !!generated["brief"];

  return (
    <div className="flex h-full flex-col">
      {/* Header: breadcrumb + title + Discovery banner + Spec stepper */}
      <div className="border-b border-border px-6 pt-4 pb-3">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <button onClick={onHome} className="hover:text-indigo-600 hover:underline">Projects</button>
          <ChevronRight className="h-3 w-3" />
          <button onClick={() => onNav(null, "brief")} className="hover:text-indigo-600 hover:underline">{project.name}</button>
          {contextSpec && (
            <>
              <ChevronRight className="h-3 w-3" />
              <button
                onClick={() => onNav(contextSpec.id, "requirements")}
                className="hover:text-indigo-600 hover:underline"
              >
                {contextSpec.name}
              </button>
            </>
          )}
          <ChevronRight className="h-3 w-3" /><span className="text-foreground font-medium">{DOCS[slot.doc].label}</span>
        </div>
        {/* Title + Git button */}
        <div className="mt-2 flex items-start justify-between gap-4">
          <h1 className="text-xl font-semibold tracking-tight">
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

        {/* ── Discovery Banner (project-level, only visible in Discovery) ── */}
        {isDiscovery && (
          <>
            <button
              onClick={() => onNav(null, "brief")}
              className="mt-3 flex w-full items-center gap-3 rounded-xl border px-4 py-2.5 transition-all bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200 shadow-sm"
            >
              <div className="grid h-8 w-8 place-items-center rounded-lg transition bg-indigo-600 text-white shadow-sm">
                <Compass className="h-4 w-4" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <div className="text-sm font-medium text-indigo-900">Discovery</div>
                <div className="text-[11px] text-slate-400">Descubrimiento · Brief del producto</div>
              </div>
              {discoveryGenerated
                ? <Badge tone="green"><CheckCircle2 className="h-3 w-3 mr-1" /> Generado</Badge>
                : <Badge tone="slate"><Circle className="h-3 w-3 mr-1" /> Pendiente</Badge>
              }
            </button>
          </>
        )}

        {/* ── Specs Banner (global, only visible in Specs view) ── */}
        {isSpecsView && (
          <button
            onClick={() => onNav(null, "specs")}
            className="mt-3 flex w-full items-center gap-3 rounded-xl border px-4 py-2.5 transition-all bg-violet-50 border-violet-200 ring-1 ring-violet-200 shadow-sm"
          >
            <div className="grid h-8 w-8 place-items-center rounded-lg transition bg-violet-600 text-white shadow-sm">
              <Layers className="h-4 w-4" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <div className="text-sm font-medium text-violet-900">Especificaciones</div>
              <div className="text-[11px] text-slate-400">Especificaciones del producto</div>
            </div>
            {specs.length > 0
              ? <Badge tone="green"><CheckCircle2 className="h-3 w-3 mr-1" /> {specs.length} módulos</Badge>
              : <Badge tone="slate"><Circle className="h-3 w-3 mr-1" /> Pendiente</Badge>
            }
          </button>
        )}

        {/* ── Spec Stepper (4 phases, only when viewing a spec) ── */}
        {isSpecPhase && contextSpec && (
          <div className="mt-4">
            <div className="flex items-center">
            {specStepDocs.map((dk, i) => {
              const D = DOCS[dk];
              const Icon = D.icon;
              const active = i === specStepActiveIdx;
              const stepKey = docKey(slot.specId, dk);
              const isGen = generatedLoaded && !!generated[stepKey];
              const done = isGen && !active;
              return (
                <div key={dk} className="flex items-center flex-1">
                  <button
                    onClick={() => onNav(slot.specId, dk)}
                    className="flex items-center gap-2 group"
                  >
                    <div className={`grid h-9 w-9 place-items-center rounded-xl border transition ${
                      active
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                        : done
                          ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                          : "bg-card border-border text-slate-400 group-hover:border-slate-400 group-hover:text-slate-600"
                    }`}>
                      {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <div className="text-left">
                      <div className={`text-sm font-medium ${active ? "text-foreground" : "text-slate-600"}`}>{D.label}</div>
                      <div className="text-[11px] text-slate-400">{D.sub}</div>
                    </div>
                  </button>
                  {i < specStepDocs.length - 1 && (
                    <div className={`mx-3 flex-1 h-px ${
                      isGen && (generatedLoaded && !!generated[docKey(slot.specId, specStepDocs[i + 1])])
                        ? "bg-emerald-500"
                        : "bg-slate-200"
                    }`} />
                  )}
                </div>
              );
            })}
            </div>
          </div>
        )}

      </div>

      {/* Split: outline | editor | chat */}
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 min-w-0 flex flex-col border-r border-border">
          <div className="flex-1 min-h-0 flex px-4 py-6 gap-5 overflow-hidden">
            {outlineOpen && slot.doc !== "code" && slot.doc !== "design" && slot.doc !== "specs" && <DocOutline key={`${currentKey}-${editorKey}`} editorScope={currentKey} />}
            <div className="flex-1 min-w-0 min-h-0">
              {slot.doc === "specs" ? (
                <SpecsOverview
                  projectId={projectId}
                  specs={specs}
                  generated={generated}
                  generatedLoaded={generatedLoaded}
                  onNavigateSpec={(sId, dk) => onNav(sId, dk)}
                  onGenerateSpecs={() => setWorking({ specId: null, doc: "brief", mode: "generate-specs", toLabel: "Especificaciones del Producto" })}
                />
              ) : slot.doc === "code" ? (
                <CodeGenView
                  projectId={projectId}
                  specId={slot.specId}
                  specName={slot.specName}
                  onGenerated={() => setGenerated({ [docKey(slot.specId, "code")]: true })}
                />
              ) : slot.doc === "design" ? (
                <ApollonDesignEditor
                  projectId={projectId}
                  specId={slot.specId}
                  specName={slot.specName}
                  chatOpen={chatOpen}
                  onToggleChat={onToggleChat}
                  outlineOpen={outlineOpen}
                  onToggleOutline={() => setOutlineOpen((v) => !v)}
                  onRegenerate={() => startGenerate(slot, "regenerate")}
                  isGenerated={isGenerated}
                />
              ) : (
                <PhaseEditor
                  key={isDiscovery ? editorKey : undefined}
                  projectId={projectId}
                  specId={slot.specId}
                  scopeKey={currentKey}
                  doc={slot.doc}
                  fileName={DOCS[slot.doc].file}
                  specName={slot.specName}
                  chatOpen={chatOpen}
                  onToggleChat={onToggleChat}
                  outlineOpen={outlineOpen}
                  onToggleOutline={() => setOutlineOpen((v) => !v)}
                  onRegenerate={() => startGenerate(slot, "regenerate")}
                  isGenerated={isGenerated}
                />
              )}
            </div>
          </div>

          {/* Phase advance bar */}
          <div className="border-t border-border bg-white/80 backdrop-blur px-8 py-3 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              <span className="text-slate-700 font-medium">{DOCS[slot.doc].sub}{slot.specName ? ` · ${slot.specName}` : ""}</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Contextual actions: Chat for Specs */}
              {isSpecsView && (
                <button
                  onClick={onToggleChat}
                  className={`inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium transition-colors ${chatOpen ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-card text-slate-600 hover:bg-slate-50 hover:border-slate-300"}`}
                >
                  <MessageSquare className="h-3.5 w-3.5" /> Chat IA
                </button>
              )}
              
              {/* Generate / Next buttons */}
              {!generatedLoaded ? (
                <button disabled className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-slate-400 cursor-not-allowed">
                  Cargando estado…
                </button>
              ) : !agents.configured ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-md font-medium">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                    Configura agentes globales o locales
                  </div>
                  <button disabled className="inline-flex items-center gap-1.5 rounded-md bg-indigo-300 px-3.5 py-1.5 text-xs font-semibold text-white cursor-not-allowed">
                    <Sparkles className="h-3.5 w-3.5" /> Generar con IA
                  </button>
                </div>
              ) : isDiscovery ? (
                /* Discovery: Generar brief → Ir a Specs */
                !discoveryGenerated ? (
                  <button
                    onClick={() => startGenerate(slot, "generate")}
                    className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Generar Discovery
                  </button>
                ) : (
                  <button
                    onClick={() => onNav(null, "specs")}
                    className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                  >
                    Ir a Especificaciones <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )
              ) : isSpecsView ? (
                /* Specs view: Generar specs → Ir al primer módulo */
                specs.length === 0 ? (
                  <button
                    onClick={() => setWorking({ specId: null, doc: "brief", mode: "generate-specs", toLabel: "Especificaciones del Producto" })}
                    className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Generar Specs con IA
                  </button>
                ) : (
                  <button
                    onClick={() => onNav(specs[0].id, "requirements")}
                    className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                  >
                    Ir al primer módulo <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )
              ) : (
                /* Spec phases */
                !isGenerated ? (
                  <button
                    onClick={() => startGenerate(slot, "generate")}
                    className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Generar {DOCS[slot.doc].sub}
                  </button>
                ) : (
                  <>
                    <span className="text-xs text-slate-400 italic mr-2">Usa el chat IA para modificaciones</span>
                    {next && (
                      <button
                        onClick={() => onNav(next.specId, next.doc)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                      >
                        Siguiente: {DOCS[next.doc].label} <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </>
                )
              )}
            </div>
          </div>
        </div>

        {/* Chatbot */}
        {chatOpen && <VibeChat onClose={onCloseChat} />}
      </div>
      {working && (() => {
        let isSSE = false;
        let sseProvider;
        let sseModel;
        let sseDocKey;

        if (working.mode === "generate-specs") {
          isSSE = true;
          sseProvider = agents.specs.creator.provider;
          sseModel = agents.specs.creator.model;
          sseDocKey = "specs";
        } else if (working.doc === "brief") {
          isSSE = true;
          sseProvider = agents.discovery.creator.provider;
          sseModel = agents.discovery.creator.model;
          sseDocKey = "brief";
        } else if (working.doc === "requirements") {
          isSSE = true;
          sseProvider = agents.requirements.creator.provider;
          sseModel = agents.requirements.creator.model;
          sseDocKey = "requirements";
        } else if (working.doc === "design") {
          isSSE = true;
          sseProvider = agents.design.creator.provider;
          sseModel = agents.design.creator.model;
          sseDocKey = "design";
        }

        return (
          <AgentWorkingModal
            mode={working.mode}
            toLabel={working.toLabel}
            sseToken={isSSE ? token : null}
            sseProjectId={isSSE ? projectId : undefined}
            sseProvider={isSSE ? sseProvider : undefined}
            sseModel={isSSE ? sseModel : undefined}
            sseDocKey={isSSE ? sseDocKey : undefined}
            sseSpecId={working.specId}
            onDone={async (content?: string) => {
              const variantIdx = (() => {
                let hash = 0;
                for (let i = 0; i < projectId.length; i++) {
                  hash = ((hash << 5) - hash + projectId.charCodeAt(i)) | 0;
                }
                return Math.abs(hash) % MOCK_VARIANTS.length;
              })();
              const variant = MOCK_VARIANTS[variantIdx];

              if (working.mode === "generate-specs") {
                if (content) {
                  // Real SSE data: parse specs list
                  try {
                    const specsList = JSON.parse(content);
                    if (Array.isArray(specsList)) {
                      const specsWithIds = specsList.map((s, i) => ({
                        id: s.id || `spec-${projectId}-${Date.now()}-${i}`,
                        name: s.name || s.titulo || "Módulo Sin Nombre",
                        description: s.description || s.descripcion || "",
                      }));
                      const key = `kosmo.mock.specs.${projectId}`;
                      localStorage.setItem(key, JSON.stringify(specsWithIds));
                      window.dispatchEvent(new CustomEvent("kosmo:local", { detail: { key, value: specsWithIds } }));
                      
                      // Mark specs as generated
                      const genKey = `kosmo.mock.generated.${projectId}`;
                      const nextGen = { ...generated, specs: true };
                      localStorage.setItem(genKey, JSON.stringify(nextGen));
                      window.dispatchEvent(new CustomEvent("kosmo:local", { detail: { key: genKey, value: nextGen } }));

                      setEditorKey(k => k + 1);
                    }
                  } catch {}
                } else {
                  // Mock fallback
                  const newSpecs = variant.specNames.map((name, i) => ({
                    id: `mock-spec-${projectId}-${i}`,
                    name,
                    description: variant.specDescriptions?.[i],
                  }));
                  window.dispatchEvent(new CustomEvent("kosmo:local", { detail: { key: `kosmo.mock.specs.${projectId}`, value: newSpecs } }));
                  localStorage.setItem(`kosmo.mock.specs.${projectId}`, JSON.stringify(newSpecs));
                }
              } else {
                const generatedKey = docKey(working.specId, working.doc);
                localStorage.setItem(`kosmo.mock.generated.${projectId}`, JSON.stringify({ ...generated, [generatedKey]: true }));
                window.dispatchEvent(new CustomEvent("kosmo:local", { detail: { key: `kosmo.mock.generated.${projectId}`, value: { ...generated, [generatedKey]: true } } }));

                // Save real content from SSE, or fall back to mock
                if (content && (working.doc === "brief" || working.doc === "requirements")) {
                  const phaseStorageKey = `kosmo.phase.${projectId}.${generatedKey}`;
                  localStorage.setItem(phaseStorageKey, mdToHtml(content));
                  setEditorKey(k => k + 1);
                } else if (working.doc === "design") {
                  const storageKey = `kosmo.apollon.${projectId}.${generatedKey}`;
                  if (content) {
                    try {
                      const { parseApollonDesign } = await import("@/lib/apollon-parser");
                      const parsed = parseApollonDesign(content);
                      const parsedStr = JSON.stringify(parsed);
                      localStorage.setItem(storageKey, parsedStr);
                      // Overwrite the semantic JSON in the DB with the actual Apollon JSON
                      import("@/lib/api/client").then(({ apiClient }) => {
                        apiClient.put(
                          `/projects/${projectId}/documents/design`,
                          { content: parsedStr, spec_id: working.specId || null },
                          token
                        ).catch(console.error);
                      });
                    } catch (err) {
                      console.error("Failed to parse AI design JSON", err);
                      const specName = specs.find(s => s.id === working.specId)?.name;
                      const perSpecDesign = specName ? variant.designBySpec?.[specName] : undefined;
                      localStorage.setItem(storageKey, JSON.stringify(perSpecDesign ?? Object.values(variant.designBySpec ?? {})[0] ?? {}));
                    }
                  } else {
                    const specName = specs.find(s => s.id === working.specId)?.name;
                    const perSpecDesign = specName ? variant.designBySpec?.[specName] : undefined;
                    localStorage.setItem(storageKey, JSON.stringify(perSpecDesign ?? Object.values(variant.designBySpec ?? {})[0] ?? {}));
                  }
                  setEditorKey(k => k + 1);
                } else if (working.doc !== "code") {
                  const phaseStorageKey = `kosmo.phase.${projectId}.${generatedKey}`;
                  const specName = specs.find(s => s.id === working.specId)?.name;
                  localStorage.setItem(phaseStorageKey, phaseInitialHtml(working.doc, specName, variantIdx));
                }
              }

              if (working.navigateOnDone) onNav(working.specId, working.doc);
              setWorking(null);
            }}
            onCancel={() => setWorking(null)}
          />
        );
      })()}
      {gitOpen && <GitPanelModal projectId={projectId} projectName={project.name} onClose={onToggleGit} />}
    </div>
  );
}

