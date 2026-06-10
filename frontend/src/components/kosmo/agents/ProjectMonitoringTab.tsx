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

export type AgentUsage = {
  role: string;
  stage: string;
  provider: ProviderKey;
  model: string;
  inputTokens: number;
  outputTokens: number;
  inputCost: number;
  outputCost: number;
};


export function buildUsage(agents: AgentsConfig, seed: number): AgentUsage[] {
  // Deterministic pseudo-data driven by project seed so each project differs.
  const rng = (i: number) => {
    const x = Math.sin(seed * 9301 + i * 49297) * 233280;
    return Math.abs(x - Math.floor(x));
  };
  const priceIn: Record<ProviderKey, number> = { openai: 2.5, google: 1.25, deepseek: 0.27, anthropic: 3.0 };  // $ / 1M
  const priceOut: Record<ProviderKey, number> = { openai: 10, google: 5, deepseek: 1.1, anthropic: 15 };
  const rows: AgentUsage[] = [];
  const push = (role: string, stage: string, spec: AgentSpec, i: number) => {
    const inT = Math.round(40000 + rng(i) * 220000);
    const outT = Math.round(20000 + rng(i + 99) * 140000);
    rows.push({
      role, stage,
      provider: spec.provider,
      model: spec.model,
      inputTokens: inT,
      outputTokens: outT,
      inputCost: (inT / 1_000_000) * priceIn[spec.provider],
      outputCost: (outT / 1_000_000) * priceOut[spec.provider],
    });
  };
  push("Clarificador", "Transversal", agents.clarifier, 1);
  STAGES.forEach((s, idx) => {
    push("Creador", s.label, agents[s.key].creator, 10 + idx * 2);
    push("Revisor", s.label, agents[s.key].reviewer, 11 + idx * 2);
  });
  return rows;
}


export function ProjectMonitoring({ projectId, agents }: { projectId: string; agents: AgentsConfig }) {
  const seed = projectId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const usage = buildUsage(agents, seed);
  const totalIn = usage.reduce((a, r) => a + r.inputTokens, 0);
  const totalOut = usage.reduce((a, r) => a + r.outputTokens, 0);
  const totalCost = usage.reduce((a, r) => a + r.inputCost + r.outputCost, 0);
  const totalCostIn = usage.reduce((a, r) => a + r.inputCost, 0);
  const totalCostOut = usage.reduce((a, r) => a + r.outputCost, 0);
  const maxRowCost = Math.max(...usage.map((r) => r.inputCost + r.outputCost));

  // Sparkline-style 14-day pseudo trend
  const trend = Array.from({ length: 14 }, (_, i) => {
    const v = 0.4 + 0.6 * Math.abs(Math.sin((seed + i * 3) * 0.7));
    return v * (totalCost / 6);
  });
  const maxTrend = Math.max(...trend, 0.0001);

  // Donut: cost share by stage
  const stageGroups = ["Transversal", ...STAGES.map((s) => s.label)];
  const stageColors = ["#a78bfa", "#6366f1", "#0ea5e9", "#10b981", "#f59e0b"];
  const stageCosts = stageGroups.map((g) => usage.filter((r) => r.stage === g).reduce((a, r) => a + r.inputCost + r.outputCost, 0));
  const donutTotal = stageCosts.reduce((a, b) => a + b, 0) || 1;
  let cumulative = 0;
  const segments = stageCosts.map((c, i) => {
    const start = (cumulative / donutTotal) * 360;
    cumulative += c;
    const end = (cumulative / donutTotal) * 360;
    return { start, end, color: stageColors[i % stageColors.length], label: stageGroups[i], cost: c };
  });

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard icon={Zap} label="Tokens totales" value={fmtTokens(totalIn + totalOut)} sub={`${fmtTokens(totalIn)} in · ${fmtTokens(totalOut)} out`} />
        <KpiCard icon={BarChart3} label="Costo total" value={`$${totalCost.toFixed(2)}`} sub={`$${totalCostIn.toFixed(2)} in · $${totalCostOut.toFixed(2)} out`} />
        <KpiCard icon={Bot} label="Agentes activos" value={String(usage.length)} sub="1 clarificador + 8 por etapa" />
        <KpiCard icon={Cpu} label="Modelos en uso" value={String(new Set(usage.map((u) => u.model)).size)} sub={`${new Set(usage.map((u) => u.provider)).size} proveedores`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Trend chart */}
        <Card className="lg:col-span-2">
          <CardHeader title="Costo por día" hint="Últimos 14 días" icon={BarChart3} />
          <div className="mt-4 flex items-end gap-1.5 h-40">
            {trend.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t bg-gradient-to-t from-indigo-500 to-violet-400" style={{ height: `${(v / maxTrend) * 100}%` }} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-slate-400 px-1">
            <span>-14d</span><span>hoy</span>
          </div>
        </Card>

        {/* Donut by stage */}
        <Card>
          <CardHeader title="Costo por etapa" icon={Layers} />
          <div className="mt-4 flex items-center gap-4">
            <Donut size={120} stroke={18} segments={segments} centerLabel={`$${donutTotal.toFixed(2)}`} />
            <div className="flex-1 space-y-1.5">
              {segments.map((s) => (
                <div key={s.label} className="flex items-center gap-2 text-xs">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
                  <span className="flex-1 truncate text-slate-600">{s.label}</span>
                  <span className="tabular-nums text-muted-foreground">${s.cost.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Per-agent breakdown */}
      <Card>
        <CardHeader title="Detalle por agente" hint="Tokens y costos por rol" icon={Bot} />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-border">
                <th className="py-2 pr-3 font-medium">Agente</th>
                <th className="py-2 pr-3 font-medium">Etapa</th>
                <th className="py-2 pr-3 font-medium">Modelo</th>
                <th className="py-2 pr-3 font-medium text-right">Tokens in</th>
                <th className="py-2 pr-3 font-medium text-right">Tokens out</th>
                <th className="py-2 pr-3 font-medium text-right">$ in</th>
                <th className="py-2 pr-3 font-medium text-right">$ out</th>
                <th className="py-2 pr-3 font-medium text-right">$ total</th>
                <th className="py-2 font-medium w-32">Share</th>
              </tr>
            </thead>
            <tbody>
              {usage.map((r, i) => {
                const total = r.inputCost + r.outputCost;
                const pct = (total / maxRowCost) * 100;
                return (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/60">
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="grid h-7 w-7 place-items-center rounded-md bg-indigo-50 text-indigo-600"><Bot className="h-3.5 w-3.5" /></div>
                        <span className="font-medium">{r.role}</span>
                      </div>
                    </td>
                    <td className="py-2 pr-3 text-slate-600">{r.stage}</td>
                    <td className="py-2 pr-3">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                        {PROVIDERS[r.provider].label} · {r.model}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums text-slate-700">{fmtTokens(r.inputTokens)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums text-slate-700">{fmtTokens(r.outputTokens)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums text-muted-foreground">${r.inputCost.toFixed(2)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums text-muted-foreground">${r.outputCost.toFixed(2)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums font-semibold text-foreground">${total.toFixed(2)}</td>
                    <td className="py-2">
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-400" style={{ width: `${pct}%` }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] text-slate-400">Los datos son simulados mientras no se conecten los proveedores. Una vez conectados, se mostrará el consumo real por llamada.</p>
      </Card>
    </div>
  );
}

