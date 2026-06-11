## Objetivo

Convertir el prototipo (hoy 100% localStorage y datos quemados) en un MVP funcional con backend real para **lo transaccional**: usuarios, proyectos, specs, fases, prompts/agentes por proyecto. El resto (monitoreo, contenido MD de las fases, agentes ejecutándose, git, validación de API keys) sigue siendo **mock visual** desde el front. **No se toca nada visual.**

---

## Alcance: qué es real vs. qué se queda mock

### Real (backend Lovable Cloud + Postgres + Auth)
- **Auth**: registro, login, logout con email/password. Sesión persistente.
- **Proyectos**: CRUD por usuario, límite real de 3, soft-delete, renombrar, status (active/paused/archived).
- **Specs**: CRUD por proyecto, nombre, orden.
- **Fases generadas**: estado `generated` por (proyecto, spec?, doc) — sustituye el mapa de localStorage.
- **Configuración de agentes por proyecto y global** (sólo el JSON de proveedor/modelo elegido, sin validar nada).
- **Prompts personalizados** (global y por proyecto) — sólo guardar el markdown editado.
- **API keys del usuario**: se guardan tal cual (cualquier string vale, no se valida ni se prueba).
- **Marca `agents.configured`** por workspace.

### Mock / quemado (sin cambios funcionales reales)
- Contenido markdown de las fases (Discovery/Requirements/Design/Tasks): plantillas locales que ya existen, se "guardan" en memoria/local.
- "Generación" de fase = animación del `AgentWorkingModal` + marcar `generated=true` en DB.
- Monitoreo de costos/tokens, dashboards de Home, actividad reciente.
- Panel de Git completo (commits, branches, merges).
- VibeChat con el agente.
- Cualquier validación contra DeepSeek/OpenAI/Google/Anthropic.

---

## Estado inicial del usuario nuevo

Un usuario recién registrado tiene **0 proyectos** y **0 datos**. Home, My Workspace y el sidebar se muestran vacíos con sus respectivos estados "crea tu primer proyecto". Los proyectos seed (`pasa-libro`, `kosmo-core`, `internal-docs`) dejan de aparecer por defecto — quedan opcionalmente como botón "Cargar proyectos de ejemplo" en Home (decisión: por defecto NO se cargan).

Al crear un proyecto se autollenan templates: el Discovery (`brief`) queda marcado como generado con la plantilla por defecto del MD, las specs arrancan vacías, y el usuario avanza fase por fase con el botón "Generar" que ya existe.

---

## Modelo de datos (Lovable Cloud / Supabase)

```text
profiles                — id (= auth.users.id), display_name, created_at
projects                — id, owner_id, name, description, status, tags[], created_at, updated_at, deleted_at
specs                   — id, project_id, slug, name, position, created_at
phase_state             — id, project_id, spec_id (nullable, null = brief),
                          doc ('brief'|'requirements'|'design'|'tasks'|'code'),
                          generated (bool), content_md (text, nullable), updated_at
                          UNIQUE(project_id, spec_id, doc)
agent_configs           — id, scope ('global'|'project'), owner_id, project_id (nullable),
                          config jsonb (= AgentsConfig actual)
                          UNIQUE(owner_id, project_id)  -- project_id null = global
agent_prompts           — id, scope ('global'|'project'), owner_id, project_id (nullable),
                          slot text (AgentSlotKey), template_md text
                          UNIQUE(owner_id, project_id, slot)
api_keys                — owner_id, provider ('deepseek'|'google'|'openai'|'anthropic'),
                          key text  -- guardado tal cual, sin validar
                          UNIQUE(owner_id, provider)
```

- RLS estricta: `owner_id = auth.uid()` en todo. Specs / phase_state / agent_configs / agent_prompts se validan vía `project_id → projects.owner_id`.
- Límite de 3 proyectos: trigger `BEFORE INSERT` que cuenta proyectos activos (no soft-deleted) del owner y rechaza el cuarto.
- `phase_state.content_md` se llena con la plantilla por defecto al crear el proyecto / spec; el front sigue editándolo.

---

## Cambios en el front (sin alterar UI)

1. **Auth shell nuevo**:
   - Ruta `/auth` con tabs Login / Register (estética del proyecto, usando los mismos tokens y componentes).
   - Ruta `/` protegida bajo `_authenticated/` (layout integrado de Supabase ya provisto por la integración).
   - Botón "Log out" del sidebar (ya existe) ahora ejecuta `supabase.auth.signOut()`.
   - "Cesar Pantoja" del sidebar se reemplaza por `profiles.display_name` / iniciales reales.

2. **Sustituir hooks de localStorage por server functions + TanStack Query** (manteniendo la firma de los hooks para no tocar componentes):
   - `useVisibleProjects` → query a `projects` (no soft-deleted).
   - `useProjectSpecs(id)` → query a `specs` por proyecto.
   - `useGenerated(id)` → query a `phase_state` materializada al mapa `{ "brief": true, "<spec>.<doc>": true }` que ya consumen los componentes.
   - `useAgentPrefs`, `useProjectAgents(id)` → `agent_configs`.
   - `usePromptTemplate(scope, slot)` → `agent_prompts`.
   - `useApiKeys` → `api_keys`.
   - `useDeletedProjects` → ya no existe como tal; soft-delete vive en `projects.deleted_at`.
   - `useProjectDisplayName` → viene del row `projects.name`.

3. **Mutaciones nuevas (server functions)**:
   - `createProject({name, description})` — respeta límite 3, crea fila + spec_state inicial para `brief` con plantilla MD.
   - `renameProject`, `softDeleteProject`, `setProjectStatus`.
   - `createSpec`, `renameSpec`, `deleteSpec`.
   - `markPhaseGenerated({projectId, specId, doc})` — llamado al cerrar el `AgentWorkingModal`.
   - `savePhaseContent({projectId, specId, doc, contentMd})` — autosave del editor.
   - `saveAgentConfig(scope, projectId?, config)`, `savePromptTemplate(...)`, `saveApiKey(provider, key)`.

4. **Estado en memoria local (sin DB)**:
   - Layout (sidebar expandido, chat abierto, theme).
   - Contenido editado todavía no autosaveado (debounce).
   - Mock de Git, monitoreo, actividad reciente del Home (siguen con datos quemados pero **filtrados al usuario actual** — si no tiene proyectos, ven estado vacío).

5. **Plantillas de fase**: se sacan de `markdown.ts` / componentes existentes y se inyectan como `content_md` por defecto al crear proyecto/spec. Sin agentes reales.

---

## Plan de implementación

1. Activar Lovable Cloud.
2. Migración SQL: enums, tablas, GRANTs, RLS, policies, trigger de límite, trigger `updated_at`, trigger `handle_new_user` que crea `profiles` y `agent_configs` global por defecto.
3. Server functions (`src/lib/*.functions.ts`) para cada operación, con `requireSupabaseAuth`.
4. Rehacer hooks bajo `src/hooks/*` para usar TanStack Query + server functions, conservando la firma exacta que hoy consumen los componentes.
5. Crear `/auth` (login + register) y `_authenticated/route.tsx` (gate gestionado).
6. Reemplazar el seed `PROJECTS` quemado en `HomeView` / `MyWorkspaceView` por la query real; el resto del visual queda intacto.
7. Smoke test: registrar usuario → crear proyecto → crear spec → avanzar Discovery → Requirements → Design → Tasks → Code, verificando que `generated` persiste tras refresh y logout/login.

---

## Lo que sigue quemado (confirmado)

- Validación de API keys (acepta cualquier string).
- Costos, tokens, gráficos de monitoreo.
- Git panel.
- Contenido real generado por agentes (se usa la plantilla MD ya existente).
- Límite de 3 proyectos (real en DB, pero arbitrario por diseño).
