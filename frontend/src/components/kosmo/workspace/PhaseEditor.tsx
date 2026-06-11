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
import { MOCK_BRIEF_HTML, MOCK_REQUIREMENTS_HTML } from "@/lib/mock-data";
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

export function PhaseEditor({ projectId, scopeKey, doc, fileName, specName, chatOpen, onToggleChat, outlineOpen, onToggleOutline, onRegenerate }: { projectId: string; scopeKey: string; doc: DocKey; fileName: string; specName: string | null; chatOpen: boolean; onToggleChat: () => void; outlineOpen: boolean; onToggleOutline: () => void; onRegenerate: () => void }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const seedRef = useRef<string>("");
  const [dirty, setDirty] = useState(false);
  const [focused, setFocused] = useState(false);
  const storageKey = `kosmo.phase.${projectId}.${scopeKey}`;

  // Re-seed editor whenever the active doc/scope changes. Load saved content
  // from localStorage (per project + scope) if any, else use the template.
  useEffect(() => {
    if (!editorRef.current) return;
    let html = "";
    try { html = localStorage.getItem(storageKey) ?? ""; } catch {}
    if (!html) html = phaseInitialHtml(doc, specName);
    editorRef.current.innerHTML = html;
    seedRef.current = html;
    setDirty(false);
  }, [storageKey, doc, specName]);

  const exec = (cmd: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
    setDirty(editorRef.current?.innerHTML !== seedRef.current);
  };

  const onInput = () => {
    setDirty(editorRef.current?.innerHTML !== seedRef.current);
  };

  const onSave = () => {
    const html = editorRef.current?.innerHTML ?? "";
    try { localStorage.setItem(storageKey, html); } catch {}
    seedRef.current = html;
    setDirty(false);
  };




  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-slate-800">{fileName}</span>
          {specName && <span className="text-[11px] text-slate-400">· {specName}</span>}
          {dirty && <Badge tone="amber">Sin guardar</Badge>}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onToggleOutline} title={outlineOpen ? "Cerrar contenidos" : "Abrir contenidos"} className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium ${outlineOpen ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-100"}`}>
            <PanelLeft className="h-3.5 w-3.5" /> Contenidos
          </button>
          <button onClick={onToggleChat} title={chatOpen ? "Cerrar chat IA" : "Abrir chat IA"} className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium ${chatOpen ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-100"}`}>
            <MessageSquare className="h-3.5 w-3.5" /> Chat IA
          </button>
          <div className="mx-1 h-5 w-px bg-slate-200" />
          <IconBtn title="Copiar" onClick={() => navigator.clipboard?.writeText(editorRef.current?.innerText || "")}><Copy className="h-4 w-4" /></IconBtn>
          <IconBtn title="Descargar"><Download className="h-4 w-4" /></IconBtn>
          <IconBtn title="Expandir"><Maximize2 className="h-4 w-4" /></IconBtn>
          {dirty && (
            <button onClick={onSave} className="ml-1 inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700">
              <Save className="h-3.5 w-3.5" /> Guardar
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
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
        <ToolBtn title="Tabla"><TableIcon className="h-4 w-4" /></ToolBtn>
        <ToolBtn title="Enlace" onClick={() => { const url = prompt("URL"); if (url) exec("createLink", url); }}><LinkIcon className="h-4 w-4" /></ToolBtn>
      </div>

      {/* Editor surface */}
      <div
        ref={editorRef}
        data-editor-scope={scopeKey}
        contentEditable
        suppressContentEditableWarning
        onInput={onInput}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`prose-kosmo max-w-none px-8 py-7 flex-1 min-h-0 overflow-y-auto kosmo-scroll focus:outline-none ${focused ? "ring-1 ring-indigo-200/60 ring-inset" : ""}`}
      />
    </div>
  );
}


export function phaseInitialHtml(doc: DocKey, specName?: string | null) {
  if (doc === "brief") {
    return MOCK_BRIEF_HTML;
  }
  const spec = specName ?? "Spec";
  if (doc === "requirements") {
    return MOCK_REQUIREMENTS_HTML;
  }
  if (doc === "design") {
    return `
      <h1>Design · ${spec}</h1>
      <p><em>Contenido pendiente de generación.</em></p>
    `;
  }
  return `
    <h1>Tasks · ${spec}</h1>
    <p><em>Contenido pendiente de generación.</em></p>
  `;
}


export function phaseDocName(p: string) {
  return { overview: "Documento de Visión", specs: "Requerimientos & Historias", design: "Diseño Técnico", tasks: "Plan de Ejecución" }[p] || "";
}


export function rawMarkdown(p: string) {
  if (p === "overview") return "# Documento de Visión\n\n## Problema\n...\n\n## Usuarios objetivo\n- Lectores...\n";
  if (p === "specs") return "## US-01\nComo usuario quiero...\n\n### Criterios\n- [ ] CA-1\n- [ ] CA-2\n";
  if (p === "design") return "## Arquitectura\n- Frontend: Next.js\n- Backend: Node + Postgres\n";
  return "## Sprint 1\n- [ ] Setup repo\n- [ ] Auth\n";
}


export function PhaseDocument({ phase }: { phase: string }) {
  if (phase === "overview") {
    return (
      <article className="prose-kosmo max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight">Documento de Visión</h1>
        <p className="mt-2 text-muted-foreground">Versión 1.2 · Actualizado hace 2 horas</p>
        <Section title="Problema">
          <p>Los lectores intercambian libros físicos sin un sistema centralizado de descubrimiento, lo que genera fricción al encontrar títulos disponibles cerca y coordinar el intercambio de forma segura.</p>
        </Section>
        <Section title="Usuarios objetivo">
          <ul className="list-disc pl-6 space-y-1 text-slate-700">
            <li>Lectores recurrentes que prefieren formato físico.</li>
            <li>Clubes de lectura urbanos.</li>
            <li>Bibliotecas comunitarias informales.</li>
          </ul>
        </Section>
        <Section title="Métricas de éxito">
          <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr><th className="px-3 py-2">Métrica</th><th className="px-3 py-2">Meta Q1</th><th className="px-3 py-2">Meta Q4</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr><td className="px-3 py-2">Intercambios completados</td><td className="px-3 py-2">200</td><td className="px-3 py-2">5,000</td></tr>
              <tr><td className="px-3 py-2">Usuarios activos / sem</td><td className="px-3 py-2">120</td><td className="px-3 py-2">3,200</td></tr>
            </tbody>
          </table>
        </Section>
      </article>
    );
  }
  if (phase === "specs") return <SpecsView />;
  if (phase === "design") return <DesignView />;
  return <TasksView />;
}


export function SpecsView() {
  const stories = [
    { id: "US-01", title: "Registro de libro", priority: "Alta", status: "Listo" },
    { id: "US-02", title: "Buscar libros cerca", priority: "Alta", status: "En review" },
    { id: "US-03", title: "Coordinar intercambio", priority: "Media", status: "Draft" },
    { id: "US-04", title: "Calificar lector", priority: "Baja", status: "Backlog" },
  ];
  const [criteria, setCriteria] = useState([true, true, false, false, false]);
  const labels = [
    "El usuario puede crear una ficha con ISBN.",
    "El sistema valida el ISBN contra Open Library.",
    "Se muestran libros en un radio de 5 km.",
    "El intercambio queda confirmado por ambas partes.",
    "El usuario puede dejar una reseña post-intercambio.",
  ];
  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-semibold tracking-tight">Historias de Usuario</h1>
      <p className="mt-2 text-muted-foreground">12 historias · 4 en sprint actual</p>
      <div className="mt-6 overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr><th className="px-4 py-2.5 font-medium">ID</th><th className="px-4 py-2.5 font-medium">Historia</th><th className="px-4 py-2.5 font-medium">Prioridad</th><th className="px-4 py-2.5 font-medium">Estado</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {stories.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/60">
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{s.id}</td>
                <td className="px-4 py-2.5 font-medium">{s.title}</td>
                <td className="px-4 py-2.5"><Badge tone={s.priority === "Alta" ? "red" : s.priority === "Media" ? "amber" : "slate"}>{s.priority}</Badge></td>
                <td className="px-4 py-2.5"><Badge tone={s.status === "Listo" ? "green" : s.status === "En review" ? "indigo" : "slate"}>{s.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 text-lg font-semibold">Criterios de Aceptación · US-02</h2>
      <div className="mt-3 space-y-2">
        {labels.map((l, i) => (
          <label key={i} className="flex items-start gap-3 rounded-md border border-border p-3 hover:bg-slate-50 cursor-pointer">
            <button
              onClick={() => setCriteria((c) => c.map((v, idx) => (idx === i ? !v : v)))}
              className={`mt-0.5 grid h-4 w-4 place-items-center rounded border ${criteria[i] ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-300 bg-card"}`}
            >
              {criteria[i] && <CheckCircle2 className="h-3 w-3" />}
            </button>
            <span className={`text-sm ${criteria[i] ? "text-muted-foreground line-through" : "text-slate-800"}`}>{l}</span>
          </label>
        ))}
      </div>
    </div>
  );
}


export function DesignView() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-semibold tracking-tight">Diseño Técnico</h1>
      <p className="mt-2 text-muted-foreground">Arquitectura, modelos de datos y estructura del repo.</p>

      <h2 className="mt-8 text-lg font-semibold">Diagrama de componentes</h2>
      <div className="mt-3 rounded-xl border border-border bg-gradient-to-br from-slate-50 to-white p-6">
        <div className="grid grid-cols-3 gap-4 items-center">
          <DiagramBox title="Web Client" sub="Next.js" tone="indigo" />
          <Arrow />
          <DiagramBox title="API Gateway" sub="tRPC" tone="violet" />
        </div>
        <div className="grid grid-cols-3 gap-4 items-center mt-4">
          <DiagramBox title="Auth Service" sub="Lucia" tone="slate" />
          <Arrow />
          <DiagramBox title="Postgres" sub="Drizzle ORM" tone="emerald" />
        </div>
      </div>

      <h2 className="mt-8 text-lg font-semibold">Estructura del repositorio</h2>
      <div className="mt-3 rounded-xl border border-border bg-slate-900 text-slate-100 p-5 font-mono text-[13px] leading-6">
        <div className="text-slate-400">pasa-libro/</div>
        <Tree depth={1} icon="folder">apps/</Tree>
        <Tree depth={2} icon="folder">web/</Tree>
        <Tree depth={2} icon="folder">api/</Tree>
        <Tree depth={1} icon="folder">packages/</Tree>
        <Tree depth={2} icon="folder">db/</Tree>
        <Tree depth={2} icon="folder">ui/</Tree>
        <Tree depth={1} icon="file">package.json</Tree>
        <Tree depth={1} icon="file">turbo.json</Tree>
      </div>
    </div>
  );
}


export function TasksView() {
  const columns = [
    { name: "Backlog", tone: "slate", tasks: [{ t: "Configurar CI", p: "Media", m: "Infra" }, { t: "Diseño de logo", p: "Baja", m: "Brand" }] },
    { name: "In Progress", tone: "indigo", tasks: [{ t: "Endpoint /books", p: "Alta", m: "API" }, { t: "Pantalla de búsqueda", p: "Alta", m: "Web" }] },
    { name: "Review", tone: "amber", tasks: [{ t: "Auth con magic link", p: "Alta", m: "Auth" }] },
    { name: "Done", tone: "emerald", tasks: [{ t: "Schema DB inicial", p: "Alta", m: "DB" }, { t: "Bootstrap monorepo", p: "Media", m: "Infra" }] },
  ];
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Tareas</h1>
      <p className="mt-2 text-muted-foreground">Sprint 1 · 6 tareas activas</p>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((c) => (
          <div key={c.name} className="rounded-xl bg-slate-50 border border-border p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-semibold"><span className={`h-2 w-2 rounded-full bg-${c.tone}-500`} />{c.name}</div>
              <span className="text-xs text-slate-400">{c.tasks.length}</span>
            </div>
            <div className="space-y-2">
              {c.tasks.map((t, i) => (
                <div key={i} className="rounded-lg bg-card border border-border p-3 shadow-sm hover:shadow-md transition">
                  <div className="text-sm font-medium">{t.t}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <Badge tone="slate">{t.m}</Badge>
                    <Badge tone={t.p === "Alta" ? "red" : t.p === "Media" ? "amber" : "slate"}>{t.p}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============== CHAT ============== */

