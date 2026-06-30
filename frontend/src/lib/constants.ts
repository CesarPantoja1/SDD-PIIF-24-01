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
  { key: "specs", label: "Especificaciones", sub: "Módulos funcionales del producto.", icon: Layers },
  { key: "requirements", label: "Requerimientos", sub: "Requisitos", icon: ClipboardList },
  { key: "design", label: "Diseño", sub: "Arquitectura y modelos.", icon: Layers },
  { key: "tasks", label: "Tareas", sub: "Plan de ejecución", icon: ListChecks },
];

export const STAGE_COLORS: Record<StageKey, { bg: string; text: string; border: string; ring: string; iconBg: string; dot: string }> = {
  discovery:    { bg: "bg-indigo-50",  text: "text-indigo-700",  border: "border-indigo-200",  ring: "ring-indigo-200",  iconBg: "bg-indigo-100 text-indigo-700",  dot: "bg-indigo-500"  },
  specs:        { bg: "bg-violet-50",  text: "text-violet-700",  border: "border-violet-200",  ring: "ring-violet-200",  iconBg: "bg-violet-100 text-violet-700",  dot: "bg-violet-500"  },
  requirements: { bg: "bg-sky-50",     text: "text-sky-700",     border: "border-sky-200",     ring: "ring-sky-200",     iconBg: "bg-sky-100 text-sky-700",         dot: "bg-sky-500"     },
  design:       { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", ring: "ring-emerald-200", iconBg: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  tasks:        { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   ring: "ring-amber-200",   iconBg: "bg-amber-100 text-amber-700",     dot: "bg-amber-500"   },
};

const mkStage = (creator: AgentSpec, reviewer: AgentSpec): StageAgents => ({ creator, reviewer });

export const DEFAULT_AGENTS: AgentsConfig = {
  clarifier: { provider: "" as ProviderKey, model: "" },
  discovery: mkStage({ provider: "" as ProviderKey, model: "" }, { provider: "" as ProviderKey, model: "" }),
  specs: mkStage({ provider: "" as ProviderKey, model: "" }, { provider: "" as ProviderKey, model: "" }),
  requirements: mkStage({ provider: "" as ProviderKey, model: "" }, { provider: "" as ProviderKey, model: "" }),
  design: mkStage({ provider: "" as ProviderKey, model: "" }, { provider: "" as ProviderKey, model: "" }),
  tasks: mkStage({ provider: "" as ProviderKey, model: "" }, { provider: "" as ProviderKey, model: "" }),
  configured: false,
};

export const DEFAULT_KEYS: ApiKeys = { deepseek: "", google: "", openai: "", anthropic: "" };

export const AGENT_SLOT_LABELS: Record<AgentSlotKey, string> = {
  clarifier: "Clarificador",
  "specs.creator": "Specs · Creador",
  "specs.reviewer": "Specs · Revisor",
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
  "specs.creator": `# Especificaciones · Creador — Arquitecto de Producto\n\nEres un arquitecto de producto. Tu tarea es analizar el documento de Discovery y extraer los módulos funcionales independientes (specs) del producto.\n\n## Flujo de trabajo\n1. Usa read_full_brief() para leer el documento de Discovery completo\n2. Identifica las áreas funcionales independientes del producto\n3. Para cada área, define un nombre corto y una descripción\n4. Guarda las specs con create_specs() pasando un JSON array\n\n## Reglas para las specs\n- Mínimo 1 spec, máximo las que el producto necesite naturalmente\n- Cada spec debe representar un módulo funcional independiente (no una tarea técnica)\n- Cada spec debe ser lo suficientemente grande para justificar ~100 líneas de código\n- El nombre debe ser descriptivo (3-5 palabras, ej: "Gestión de Inventario")\n- La descripción debe enfocarse en LA INTERACCIÓN DEL USUARIO con el sistema\n- La descripción debe responder: ¿qué hace el usuario en este módulo?\n- La descripción no debe exceder 10 líneas\n- Las descripciones NO deben mencionar tecnologías, APIs, bases de datos ni detalles de implementación\n\n## Ejemplo de buena descripción\n"Los dueños y empleados registran productos con nombre, SKU, categoría y precio. El sistema muestra el stock disponible en tiempo real y alerta cuando un producto está por debajo del mínimo. Los usuarios pueden buscar por nombre o código de barras, filtrar por categoría, y exportar el inventario a Excel."\n\n## Ejemplo de mala descripción\n"CRUD de productos con validación de datos y API REST usando FastAPI."\n(Describe implementación técnica, no interacción del usuario)\n`,
  "specs.reviewer": `# Especificaciones · Revisor — Rúbrica de Evaluación\n\nLa revisión de las Especificaciones se realiza automáticamente mediante RubricMiddleware. El middleware evalúa el output del Creador contra una rúbrica de criterios objetivos.\n\nCriterios de la rúbrica:\n- Se generó al menos 1 spec (mínimo requerido)\n- Cada spec tiene un nombre descriptivo de 3-5 palabras\n- Cada spec tiene una descripción de 1-10 líneas enfocada en la interacción del usuario\n- Las descripciones NO mencionan tecnologías, APIs, bases de datos ni detalles de implementación\n- Las specs no se solapan entre sí (son funcionalmente independientes)\n- Las specs cubren las capacidades clave mencionadas en el documento de Discovery\n`,
  "requirements.creator": `# Requirements · Creador — Analista EARS\n\nEres un analista de requerimientos experto. Tu rol es crear un **documento de requisitos** para un módulo específico siguiendo estrictamente la sintaxis EARS (Easy Approach to Requirements Syntax).\n\n## Flujo de Trabajo\n1. Usa read_spec_info() para leer el nombre y la descripción del módulo actual. **Tus requisitos deben limitarse EXCLUSIVAMENTE a la interacción descrita en ese módulo.** No inventes funcionalidades de otros módulos.\n2. Genera el documento de requisitos usando el formato EARS.\n3. Guarda el documento con save_requirements() pasando el contenido markdown completo.\n\n## Formato del Documento\n\n# Requisitos: {{Nombre del Módulo}}\n\n## Requisitos\n\n### Requisito 1: {{Área del requisito}}\n**Objetivo:** Como {{Rol}}, quiero {{Capacidad}}, para {{Beneficio}}\n\n#### Criterios de Aceptación\n1. When [evento], the [system] shall [respuesta]\n2. If [condición/error], the [system] shall [respuesta]\n3. While [precondición], the [system] shall [respuesta]\n4. Where [funcionalidad opcional], the [system] shall [respuesta]\n5. The [system] shall [respuesta general]\n\n## Reglas Críticas\n- **Scope**: Límítate estrictamente a la descripción obtenida por read_spec_info(). No añadas alcances de otros módulos.\n- **EARS**: Todos los criterios de aceptación deben comenzar con las palabras clave en inglés: "When", "If", "While", "Where", "The [system] shall".\n- **Sin UI**: Los requisitos describen lógica de negocio, no colores, pantallas ni botones específicos.\n- **Formato**: Los títulos de los requisitos DEBEN usar un identificador numérico (ej: "Requisito 1", "Requisito 2").\n- Solo genera el contenido en Markdown, sin frases conversacionales ("Aquí tienes", "He generado").\n`,
  "requirements.reviewer": `# Requirements · Revisor — Rúbrica de Evaluación\n\nLa revisión de los Requisitos se realiza automáticamente mediante RubricMiddleware. El middleware evalúa el output del Creador contra una rúbrica de criterios objetivos.\n\nCriterios de la rúbrica:\n- El documento contiene requisitos basados exclusivamente en la descripción del módulo actual.\n- Los títulos de los requisitos usan identificadores numéricos (ej. "Requisito 1", no "Requisito A").\n- Cada requisito incluye un Objetivo en formato de historia de usuario (Como [Rol] quiero [Capacidad] para [Beneficio]).\n- Cada requisito tiene Criterios de Aceptación que siguen estrictamente el formato EARS (iniciando con When, If, While, Where, o The [system] shall).\n- Hay al menos 2 criterios de aceptación por requisito.\n- Los requisitos no describen detalles de UI como botones, modales, colores o menús, sino lógica de negocio y comportamiento observable.\n- No hay frases conversacionales ni texto fuera del formato del documento.\n`,
  "design.creator": `# Design · Creador — Arquitecto de Diagramas\n\nActúa como un Arquitecto de Software Senior. Tu tarea es diseñar el Diagrama de Clases UML completo basándote en los Requisitos y el Discovery proporcionados.\nDebes generar tu respuesta ESTRICTAMENTE usando la herramienta 'save_design' con la siguiente estructura JSON semántica:\n\n{\n  "classes": [\n    {\n      "name": "NombreClase",\n      "stereotype": "", // Valores válidos: "", "Abstract", "Interface", "Enumeration"\n      "attributes": ["+ id: String", "- nombre: String"],\n      "methods": ["+ operacion(): Void"]\n    }\n  ],\n  "relationships": [\n    {\n      "source": "NombreOrigen",\n      "target": "NombreDestino",\n      "type": "ClassUnidirectional" // Opciones: ClassInheritance, ClassRealization, ClassDependency, ClassAggregation, ClassComposition, ClassUnidirectional, ClassBidirectional\n    }\n  ]\n}\n\n## Reglas\n- Mínimo 5 clases de dominio (NO clases técnicas como Manager, Controller, Service)\n- Si aplica, usa enumeraciones con 2+ literales\n- Nombres sin tildes, eñes ni caracteres especiales\n`,
  "design.reviewer": `# Design · Revisor — Verificación de Diagrama\n\nLa revisión de las Especificaciones se realiza automáticamente mediante RubricMiddleware. El middleware evalúa el output del Creador contra una rúbrica de criterios objetivos.\n\nCriterios de la rúbrica:\n- ¿Hay al menos 5 clases de dominio?\n- ¿Cada clase tiene atributos relevantes para los requisitos?\n- ¿Los tipos de relaciones (ClassInheritance, ClassComposition, etc.) son válidos y lógicos?\n- ¿Los nombres de clases no tienen tildes ni caracteres especiales?\n- ¿El diseño cubre exhaustivamente las entidades mencionadas en los requisitos del módulo?\n`,
  "tasks.creator": `# Tasks · Creador\n\nGeneras el **plan de ejecución** a partir del diseño.\n\n## Formato\n\`\`\`md\n## Sprint 1 · {Nombre}\n- [ ] T-01 {Título} — {estimación}\n\`\`\`\n`,
  "tasks.reviewer": `# Tasks · Revisor\n\nRevisas el plan: estimaciones razonables, dependencias claras, sin tareas duplicadas.\n`,
};

export const ALL_AGENT_SLOTS: AgentSlotKey[] = [
  "clarifier",
  "discovery.creator", "discovery.reviewer",
  "specs.creator", "specs.reviewer",
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
  specs: { label: "Especificaciones", sub: "Especificaciones del producto", file: "specs.md", icon: Layers },
  requirements: { label: "Requirements", sub: "Requerimientos", file: "requirements.md", icon: ClipboardList },
  design: { label: "Design", sub: "Diseño", file: "design.md", icon: Layers },
  tasks: { label: "Tasks", sub: "Tareas", file: "tasks.md", icon: ListChecks },
  code: { label: "Code", sub: "Generación de código", file: "src/", icon: Terminal },
};

export const SPEC_DOCS: DocKey[] = ["requirements", "design", "tasks", "code"];
