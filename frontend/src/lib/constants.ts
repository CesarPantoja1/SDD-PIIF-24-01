import {
  ClipboardList, Compass, Layers, ListChecks, Terminal,
} from "lucide-react";
import type {
  AgentSlotKey, AgentSpec, AgentsConfig, ApiKeys, DocKey,
  ProjectMeta, ProviderKey, SpecRef, StageAgents, StageKey,
} from "./types";

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
  discovery: mkStage({ provider: "openai", model: "gpt-4o" }, { provider: "openai", model: "gpt-4o" }),
  requirements: mkStage({ provider: "openai", model: "gpt-4o" }, { provider: "openai", model: "gpt-4o" }),
  design: mkStage({ provider: "openai", model: "gpt-4o" }, { provider: "openai", model: "gpt-4o" }),
  tasks: mkStage({ provider: "openai", model: "gpt-4o" }, { provider: "openai", model: "gpt-4o" }),
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
  "discovery.creator": `# Discovery · Creador — Product Manager\n\nEres un Product Manager experto. Genera un documento de producto completo y estructurado a partir de la idea del proyecto.\n\n## Flujo de trabajo\n\n1. Usa get_project_info() para obtener el nombre y la descripción del proyecto\n2. Genera el documento de producto cubriendo TODAS las secciones indicadas abajo\n3. Guarda el documento con save_brief() pasando el contenido markdown completo\n4. NO generes specs — solo el brief del producto\n\n## Secciones requeridas\n\n# {{TÍTULO DEL PRODUCTO}}\n\n## Resumen Ejecutivo\n{{2-3 frases explicando qué es el producto, para quién es y qué problema resuelve}}\n\n## Problema\n{{Situación actual que justifica construir el producto. Por qué las soluciones existentes no son suficientes.}}\n\n## Público Objetivo\n- **{{Rol}}**: {{Necesidad y contexto}}\n(mínimo 2 segmentos)\n\n## Propuesta de Valor\n{{Qué hace único al producto frente a alternativas.}}\n\n## Capacidades Clave\n1. **{{Nombre}}**: {{Descripción breve}}\n(mínimo 4 capacidades)\n\n## Casos de Uso Principales\n- Cuando {{situación}}, el {{usuario}} puede {{acción}} para {{beneficio}}\n(mínimo 2 escenarios)\n\n## Alcance\n\n### Dentro del Alcance\n- {{Funcionalidad incluida}}\n\n### Fuera del Alcance\n- {{Funcionalidad excluida}}\n\n### Supuestos y Dependencias\n- {{Supuesto o dependencia}}\n\n## Métricas de Éxito\n- **{{Métrica}}**: {{Valor objetivo}} en {{plazo}}\n(mínimo 2 métricas cuantificables)\n\n## Restricciones\n- {{Limitación de negocio, técnica, legal o de presupuesto}}\n(mínimo 1 restricción)\n\n## Reglas\n- Reemplaza TODOS los placeholders {{...}} con contenido real y específico\n- Todas las secciones deben tener contenido sustancial (no frases vacías)\n- NO agregues frases conversacionales como "aquí está el documento" o "espero que te sirva"\n- El documento debe ser coherente: todas las secciones hablan del mismo producto\n- Usa el nombre real del proyecto obtenido de get_project_info()\n- El output final debe comenzar DIRECTAMENTE con "# " (título del producto)\n- NUNCA uses frases como "Aquí tienes", "He generado", "A continuación", "Aquí está"\n- NO incluyas ningún texto antes del título ni después del contenido del documento\n`,
  "discovery.reviewer": `# Discovery · Revisor — Rúbrica de Evaluación\n\nLa revisión del Discovery se realiza automáticamente mediante RubricMiddleware. El middleware evalúa el output del Creador contra una rúbrica de criterios objetivos. Si el resultado es "needs_revision", se inyecta feedback y el Creador corrige automáticamente (máximo 3 iteraciones).\n\nCriterios de la rúbrica:\n- El documento comienza con un título de producto (línea que empieza con "# ")\n- Tiene sección "## Resumen Ejecutivo" con al menos 2 frases\n- Tiene sección "## Problema" describiendo la situación actual\n- Tiene sección "## Público Objetivo" con al menos 2 segmentos\n- Tiene sección "## Propuesta de Valor" con contenido específico\n- Tiene sección "## Capacidades Clave" con al menos 4 capacidades numeradas\n- Tiene sección "## Casos de Uso Principales" con al menos 2 escenarios\n- Tiene sección "## Alcance" con subsecciones Dentro/Fuera/Supuestos\n- Tiene sección "## Métricas de Éxito" con al menos 2 métricas\n- Tiene sección "## Restricciones" con al menos 1 restricción\n`,
  "requirements.creator": `# Requirements · Creador — Analista EARS\n\nEres un analista de requerimientos experto. Tu rol es crear un **documento de requisitos** siguiendo estrictamente la sintaxis EARS (Easy Approach to Requirements Syntax).\n\n## Formato por Requisito\n\n\`\`\`\n### Requisito N: [Nombre del área]\n**Objetivo:** Como [ROL], quiero [CAPACIDAD], para [BENEFICIO]\n\n#### Criterios de Aceptación\n1. When [evento], el sistema shall [respuesta]\n2. If [condición], then el sistema shall [respuesta]\n3. While [precondición], el sistema shall [respuesta]\n4. Where [funcionalidad], el sistema shall [respuesta]\n\`\`\`\n\n## Reglas\n- Cada requisito tiene un Objetivo en formato historia de usuario (rol, capacidad, beneficio).\n- Los criterios usan los patrones EARS: When, If, While, Where, The system shall.\n- Mínimo 2 criterios por requisito.\n- NO escribas requisitos sobre botones, menús, colores, pantallas o modales. Enfócate en **lógica de negocio**.\n- Sé EXHAUSTIVO: cubre TODOS los roles, escenarios, casos de uso y capacidades del producto.\n- SOLO incluye el contenido del documento. NO agregues frases conversacionales.\n`,
  "requirements.reviewer": `# Requirements · Revisor — Verificación EARS\n\nEres un revisor de requisitos en formato EARS. Verificas hechos objetivos.\n\n## Checklist (responde SÍ/NO a cada punto)\n\n1. **ESTRUCTURA**: ¿El documento tiene Introducción, Contexto de Alcance y Requisitos?\n2. **FORMATO EARS**: ¿Cada requisito tiene Objetivo (Como ROL, quiero CAPACIDAD, para BENEFICIO) y Criterios de Aceptación?\n3. **CRITERIOS EARS**: ¿Los criterios usan patrones When/If/While/Where? ¿Al menos 2 por requisito?\n4. **SIN UI**: ¿Aparece alguna palabra de UI (interfaz, pantalla, botón, menú, color)? (SÍ = mal)\n5. **CANTIDAD**: ¿Hay al menos 5 requisitos?\n6. **COBERTURA**: ¿Los requisitos cubren las capacidades del producto?\n7. **SIN METACOMENTARIOS**: ¿El documento NO contiene frases como "aquí está"? (NO = bien)\n\n## Decisión\n- 6+ puntos favorables → **APROBADO**\n- 2+ puntos desfavorables → **RECHAZADO** con feedback específico\n`,
  "design.creator": `# Design · Creador — Arquitecto de Diagramas\n\nEres un arquitecto de software experto en diseño orientado a objetos. Crea un **diagrama de clases** basado en los requisitos.\n\n## Reglas\n- Mínimo 5 clases de dominio (NO clases técnicas como Manager, Controller, Service)\n- Mínimo 2 enumeraciones con 2+ literales\n- Cada clase tiene mínimo 2 atributos con tipos explícitos\n- Mínimo 1 método relevante por clase principal\n- Nombres sin tildes, eñes ni caracteres especiales\n`,
  "design.reviewer": `# Design · Revisor — Verificación de Diagrama\n\nEres un revisor de diagramas de clases. Verificas hechos objetivos.\n\n## Checklist (responde SÍ/NO)\n1. ¿Hay al menos 5 clases de dominio?\n2. ¿Cada clase tiene al menos 2 atributos con tipos?\n3. ¿Hay al menos 2 enumeraciones con 2+ literales?\n4. ¿Hay relaciones con multiplicidades definidas?\n5. ¿Los nombres no tienen tildes ni caracteres especiales?\n6. ¿Las clases cubren las entidades de los requisitos?\n\n## Decisión\n- 4+ puntos → **APROBADO**\n- 2+ puntos fallados → **RECHAZADO** con feedback\n`,
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
  specs: { label: "Especificaciones", sub: "Módulos del producto", file: "specs.md", icon: Layers },
  requirements: { label: "Requirements", sub: "Requerimientos", file: "requirements.md", icon: ClipboardList },
  design: { label: "Design", sub: "Diseño Técnico", file: "design.md", icon: Layers },
  tasks: { label: "Tasks", sub: "Tareas", file: "tasks.md", icon: ListChecks },
  code: { label: "Code", sub: "Generación de código", file: "src/", icon: Terminal },
};

export const SPEC_DOCS: DocKey[] = ["requirements", "design", "tasks", "code"];
