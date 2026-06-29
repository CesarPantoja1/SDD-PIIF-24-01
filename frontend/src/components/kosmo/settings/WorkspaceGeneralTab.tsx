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

import { CodingAgentsTab, ProjectMonitoring, AgentRow, AgentPicker, AgentPickerInner, PromptEditorModal, buildUsage } from "@/components/kosmo/agents";
import { useTranslation } from "react-i18next";

export function WorkspaceGeneralTab() {
  const { t } = useTranslation();
  const [name, setName] = useLocal("kosmo.workspace.name", "Cesar's Workspace");
  const [slug, setSlug] = useLocal("kosmo.workspace.slug", "cesar-workspace");
  const [tz, setTz] = useLocal("kosmo.workspace.tz", "America/Bogota");
  const [lang, setLang] = useLocal("kosmo.workspace.lang", "es");
  const [theme, setTheme] = useLocal("kosmo.workspace.theme", "system");
  const [defaultVisibility, setDefaultVisibility] = useLocal("kosmo.workspace.defaultVisibility", "private");
  return (
    <div className="max-w-3xl space-y-6">
      <Card>
        <h3 className="font-semibold flex items-center gap-2"><Wrench className="h-4 w-4 text-indigo-500" /> {t("globalSettings.workspaceIdentity", "Identidad del workspace")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t("globalSettings.workspaceIdentityDesc", "El nombre y slug se usan en URLs y reportes.")}</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <PField label={t("globalSettings.workspaceName", "Nombre del workspace")}><input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} /></PField>
          <PField label={t("globalSettings.slug", "Slug")}><div className="flex items-center gap-1.5"><span className="text-xs text-slate-400">kosmo.app/</span><input value={slug} onChange={(e) => setSlug(e.target.value.replace(/\s+/g, "-").toLowerCase())} className={inputCls} /></div></PField>
        </div>
      </Card>
      <Card>
        <h3 className="font-semibold flex items-center gap-2"><Globe className="h-4 w-4 text-indigo-500" /> {t("globalSettings.localization", "Localización")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t("globalSettings.localizationDesc", "Se aplican como base a todos los proyectos.")}</p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <PField label={t("globalSettings.timezone", "Zona horaria")}>
            <select value={tz} onChange={(e) => setTz(e.target.value)} className={inputCls}>
              {["America/Bogota", "America/Mexico_City", "America/Lima", "America/Santiago", "America/Argentina/Buenos_Aires", "Europe/Madrid", "UTC"].map((tItem) => <option key={tItem} value={tItem}>{tItem}</option>)}
            </select>
          </PField>
          <PField label={t("globalSettings.language", "Idioma")}><select value={lang} onChange={(e) => setLang(e.target.value)} className={inputCls}><option value="es">{t("common.spanish", "Español")}</option><option value="en">{t("common.english", "English")}</option></select></PField>
          <PField label={t("globalSettings.defaultTheme", "Tema por defecto")}><select value={theme} onChange={(e) => setTheme(e.target.value)} className={inputCls}><option value="system">{t("common.system", "Sistema")}</option><option value="light">{t("common.light", "Claro")}</option><option value="dark">{t("common.dark", "Oscuro")}</option></select></PField>
        </div>
      </Card>

      <div className="flex justify-end gap-2">
        <button className="rounded-md border border-border px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">{t("common.cancel", "Cancelar")}</button>
        <button className="rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-700 inline-flex items-center gap-1.5"><Save className="h-4 w-4" /> {t("common.saveChanges", "Guardar cambios")}</button>
      </div>
    </div>
  );
}

