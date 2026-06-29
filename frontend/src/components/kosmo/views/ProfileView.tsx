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

import { useProfile, type ProfileData } from "@/hooks/use-profile";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

export function ProfileView() {
  const { t } = useTranslation();
  const [profile, setProfile] = useProfile();
  const [draft, setDraft] = useState<ProfileData>(profile);
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [tab, setTab] = useState<"general" | "security">("general");
  useEffect(() => { setDraft(profile); }, [profile.name, profile.email, profile.role, profile.bio]);
  const dirty = draft.name !== profile.name || draft.role !== profile.role || draft.bio !== profile.bio;

  const save = () => { setProfile({ ...draft, email: profile.email }); };
  const reset = () => { setDraft(profile); };
  const savePwd = async () => {
    if (!pwd.next || pwd.next.length < 8) { alert(t("profile.passwordMinLength", "La nueva contraseña debe tener al menos 8 caracteres.")); return; }
    if (pwd.next !== pwd.confirm) { alert(t("profile.passwordMismatch", "Las contraseñas no coinciden.")); return; }
    const { error } = await supabase.auth.updateUser({ password: pwd.next });
    if (error) { alert(error.message); return; }
    alert(t("profile.passwordUpdated", "Contraseña actualizada."));
    setPwd({ current: "", next: "", confirm: "" });
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-10 py-8">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-base font-semibold text-white">
            {(draft.name || "U").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t("profile.title", "Mi perfil")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("profile.subtitle", "Configuración personal de tu cuenta KOSMO.")}</p>
          </div>
        </div>

        <div className="mt-6 flex border-b border-border">
          {(["general", "security"] as const).map((tabItem) => (
            <button key={tabItem} onClick={() => setTab(tabItem)} className={`relative px-3 py-2.5 text-sm font-medium ${tab === tabItem ? "text-indigo-700" : "text-muted-foreground hover:text-slate-700"}`}>
              {tabItem === "general" ? t("profile.general", "General") : t("profile.security", "Seguridad")}
              {tab === tabItem && <span className="absolute inset-x-2 -bottom-px h-0.5 bg-indigo-600" />}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          {tab === "general" && (
            <>
              <PField label={t("profile.fullName", "Nombre completo")}>
                <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500" />
              </PField>
              <PField label={t("profile.email", "Email")}>
                <div className="flex items-center justify-between rounded-md border border-border bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  <span>{profile.email}</span>
                  <span className="text-[11px] text-slate-400">{t("profile.notEditable", "No editable")}</span>
                </div>
              </PField>
              <PField label={t("profile.role", "Rol")}>
                <input value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} placeholder="Product Engineer" className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500" />
              </PField>
              <PField label={t("profile.bio", "Bio")}>
                <textarea value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} rows={3} className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500" />
              </PField>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button onClick={reset} disabled={!dirty} className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40">{t("profile.cancel", "Cancelar")}</button>
                <button onClick={save} disabled={!dirty} className="rounded-md bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-40">{t("profile.saveChanges", "Guardar cambios")}</button>
              </div>
            </>
          )}
          {tab === "security" && (
            <>
              <PField label={t("profile.currentPassword", "Contraseña actual")}>
                <input type="password" value={pwd.current} onChange={(e) => setPwd({ ...pwd, current: e.target.value })} className="w-full rounded-md border border-border px-3 py-2 text-sm font-mono" />
              </PField>
              <PField label={t("profile.newPassword", "Nueva contraseña")}>
                <input type="password" value={pwd.next} onChange={(e) => setPwd({ ...pwd, next: e.target.value })} className="w-full rounded-md border border-border px-3 py-2 text-sm font-mono" />
              </PField>
              <PField label={t("profile.confirmPassword", "Confirmar nueva contraseña")}>
                <input type="password" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} className="w-full rounded-md border border-border px-3 py-2 text-sm font-mono" />
              </PField>
              <div className="flex justify-end">
                <button onClick={savePwd} className="rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-700">{t("profile.updatePassword", "Actualizar contraseña")}</button>
              </div>
              <div className="mt-2 rounded-md border border-border bg-slate-50 p-3 text-[11px] text-muted-foreground">
                {t("profile.passwordHint", "Mínimo 8 caracteres. Te recomendamos combinar mayúsculas, números y símbolos.")}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============== GIT PANEL ============== */

