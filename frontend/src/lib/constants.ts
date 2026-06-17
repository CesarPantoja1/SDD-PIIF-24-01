import {
  ClipboardList, Compass, Layers, ListChecks, Terminal,
} from "lucide-react";
import type {
  AgentSlotKey, AgentSpec, AgentsConfig, ApiKeys, DocKey,
  ProjectMeta, ProviderKey, SpecRef, StageAgents, StageKey,
} from "./types";
import { MOCK_PROMPTS, MOCK_SPEC_NAME } from "./mock-data";

export const MAX_PROJECTS = 3;

export const PROVIDERS: Record<ProviderKey, { label: string; models: string[]; keyUrl: string; keyPrefix: string }> = {
  deepseek: { label: "DeepSeek", models: ["deepseek-chat", "deepseek-reasoner"], keyUrl: "https://platform.deepseek.com/api_keys", keyPrefix: "sk-" },
  google: { label: "Google (Gemini)", models: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash"], keyUrl: "https://aistudio.google.com/apikey", keyPrefix: "AIza" },
  openai: { label: "OpenAI", models: ["gpt-4o", "gpt-4o-mini", "o1", "o3-mini"], keyUrl: "https://platform.openai.com/api-keys", keyPrefix: "sk-" },
  anthropic: { label: "Anthropic (Claude)", models: ["claude-opus-4", "claude-sonnet-4", "claude-3.7-sonnet", "claude-3.5-haiku"], keyUrl: "https://console.anthropic.com/keys", keyPrefix: "sk-ant-" },
};

export const STAGES: { key: StageKey; label: string; sub: string; icon: any }[] = [
  { key: "discovery", label: "Descubrimiento", sub: "Brief inicial y contexto.", icon: Compass },
  { key: "requirements", label: "Requerimientos", sub: "User stories y criterios.", icon: ClipboardList },
  { key: "design", label: "Diseño Técnico", sub: "Arquitectura y modelos.", icon: Layers },
  { key: "tasks", label: "Tareas", sub: "Plan de ejecución.", icon: ListChecks },
];

export const STAGE_COLORS: Record<StageKey, { bg: string; text: string; border: string; ring: string; iconBg: string; dot: string }> = {
  discovery:    { bg: "bg-indigo-50",  text: "text-indigo-700",  border: "border-indigo-200",  ring: "ring-indigo-200",  iconBg: "bg-indigo-100 text-indigo-700",  dot: "bg-indigo-500"  },
  requirements: { bg: "bg-sky-50",     text: "text-sky-700",     border: "border-sky-200",     ring: "ring-sky-200",     iconBg: "bg-sky-100 text-sky-700",         dot: "bg-sky-500"     },
  design:       { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", ring: "ring-emerald-200", iconBg: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  tasks:        { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   ring: "ring-amber-200",   iconBg: "bg-amber-100 text-amber-700",     dot: "bg-amber-500"   },
};

const mkStage = (creator: AgentSpec, reviewer: AgentSpec): StageAgents => ({ creator, reviewer });

export const DEFAULT_AGENTS: AgentsConfig = {
  clarifier: { provider: "openai", model: "gpt-4o-mini" },
  discovery: mkStage({ provider: "openai", model: "gpt-4o" }, { provider: "google", model: "gemini-2.5-pro" }),
  requirements: mkStage({ provider: "anthropic", model: "claude-sonnet-4" }, { provider: "google", model: "gemini-2.5-pro" }),
  design: mkStage({ provider: "openai", model: "gpt-4o" }, { provider: "anthropic", model: "claude-opus-4" }),
  tasks: mkStage({ provider: "openai", model: "gpt-4o" }, { provider: "google", model: "gemini-2.5-pro" }),
  configured: false,
};

export const DEFAULT_KEYS: ApiKeys = { deepseek: "", google: "", openai: "", anthropic: "" };

export const AGENT_SLOT_LABELS: Record<AgentSlotKey, string> = {
  clarifier: "Clarificador",
  "discovery.creator": "Discovery · Creador",
  "discovery.reviewer": "Discovery · Revisor",
  "requirements.creator": "Requirements · Creador",
  "requirements.reviewer": "Requirements · Revisor",
  "design.creator": "Design · Creador",
  "design.reviewer": "Design · Revisor",
  "tasks.creator": "Tasks · Creador",
  "tasks.reviewer": "Tasks · Revisor",
};

export const DEFAULT_PROMPTS: Record<AgentSlotKey, string> = {
  clarifier: `# Agente Clarificador\n\nEres el primer agente en la cadena SDD. Tu rol es **refinar el prompt inicial** del usuario antes de pasarlo a las etapas posteriores.\n\n## Responsabilidades\n- Detectar ambigüedades en la idea del proyecto.\n- Formular preguntas concisas cuando falte contexto crítico.\n- Reescribir el prompt en formato estructurado.\n\n## Formato de salida\n\`\`\`md\n## Objetivo\n...\n## Contexto\n...\n## Restricciones\n...\n\`\`\`\n`,
  "discovery.creator": MOCK_PROMPTS["discovery.creator"],
  "discovery.reviewer": MOCK_PROMPTS["discovery.reviewer"],
  "requirements.creator": MOCK_PROMPTS["requirements.creator"],
  "requirements.reviewer": MOCK_PROMPTS["requirements.reviewer"],
  "design.creator": MOCK_PROMPTS["design.creator"],
  "design.reviewer": MOCK_PROMPTS["design.reviewer"],
  "tasks.creator": `# Tasks · Creador\n\nGeneras el **plan de ejecución** a partir del diseño.\n\n## Formato\n\`\`\`md\n## Sprint 1 · {Nombre}\n- [ ] T-01 {Título} — {estimación}\n\`\`\`\n`,
  "tasks.reviewer": `# Tasks · Revisor\n\nRevisas el plan: estimaciones razonables, dependencias claras, sin tareas duplicadas.\n`,
};

export const ALL_AGENT_SLOTS: AgentSlotKey[] = [
  "clarifier",
  "discovery.creator", "discovery.reviewer",
  "requirements.creator", "requirements.reviewer",
  "design.creator", "design.reviewer",
  "tasks.creator", "tasks.reviewer",
];

/** Plantillas base. Cada proyecto recibe N specs según la variante asignada. */
export { MOCK_VARIANTS, pickVariantForNewProject, variantIndexFromSpecNames } from "./mock-data";

import { MOCK_VARIANTS, pickVariantForNewProject } from "./mock-data";

/** Devuelve los nombres de specs a sembrar para un nuevo proyecto, según la variante libre. */
export function pickSeedSpecs(_projectId?: string, usedNames: string[] = []): { name: string }[] {
  const idx = pickVariantForNewProject(usedNames);
  return MOCK_VARIANTS[idx].specNames.map((name) => ({ name }));
}


/** Templates legacy (vacíos, ya no se siembran datos en frontend). */
export const DEFAULT_SPECS: Record<string, SpecRef[]> = {};
export const PROJECTS: ProjectMeta[] = [];

export const DOCS: Record<DocKey, { label: string; sub: string; file: string; icon: any }> = {
  brief: { label: "Discovery", sub: "Descubrimiento", file: "brief.md", icon: Compass },
  requirements: { label: "Requirements", sub: "Requerimientos", file: "requirements.md", icon: ClipboardList },
  design: { label: "Design", sub: "Diseño Técnico", file: "design.md", icon: Layers },
  tasks: { label: "Tasks", sub: "Tareas", file: "tasks.md", icon: ListChecks },
  code: { label: "Code", sub: "Generación de código", file: "src/", icon: Terminal },
};

export const SPEC_DOCS: DocKey[] = ["requirements", "design", "tasks", "code"];
