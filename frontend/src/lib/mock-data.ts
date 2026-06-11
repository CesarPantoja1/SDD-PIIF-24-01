/**
 * Datos quemados (hardcoded) para la demo del prototipo frontend.
 *
 * Estos datos se cargan SIEMPRE, sin importar lo que el usuario escriba
 * en los campos de creación de proyecto. El objetivo es que el interesado
 * pueda recorrer el flujo completo de la aplicación y ver cómo sería la
 * experiencia real con el backend conectado.
 */

/* ================================================================
 * PROYECTO
 * ================================================================ */

export const MOCK_PROJECT_NAME = "App de citas médicas";

export const MOCK_PROJECT_DESCRIPTION =
  "Aplicación para gestionar las citas médicas de un hospital";

export const MOCK_SPEC_NAME = "Gestión citas médicas";

/* ================================================================
 * BRIEF (Discovery) — basado en producto.md
 * ================================================================ */

export const MOCK_BRIEF_HTML = `
<h1>MediSchedule</h1>

<h2>Resumen Ejecutivo</h2>
<p>MediSchedule es una aplicación diseñada para facilitar la gestión de citas médicas tanto para pacientes como para profesionales de la salud. Resuelve el problema de las largas esperas y la falta de organización en la programación de citas, mejorando la eficiencia y la comunicación entre usuarios y médicos.</p>

<h2>Problema</h2>
<p>En la actualidad, la gestión de citas médicas es un proceso que frecuentemente causa frustración tanto a pacientes como a médicos. Las llamadas telefónicas, los correos electrónicos y las agendas físicas a menudo resultan en errores de programación, cancelaciones de última hora y dificultad para encontrar horarios disponibles. Las soluciones actuales no son suficientes, ya que la mayoría carecen de una interfaz intuitiva y de funciones integradas que aborden la comunicación efectiva entre los usuarios.</p>

<h2>Público Objetivo</h2>
<ul>
  <li><strong>Pacientes</strong>: Personas que buscan simplificar el proceso de agendar citas médicas y recibir recordatorios, en un entorno que prioriza su salud.</li>
  <li><strong>Médicos</strong>: Profesionales de la salud que desean optimizar su tiempo y organizar de manera eficiente sus agendas y la atención a los pacientes.</li>
  <li><strong>Administradores de clínicas</strong>: Personas encargadas de la gestión operativa de un centro médico, que buscan herramientas para mejorar la eficiencia en la programación de citas y la administración de pacientes.</li>
</ul>

<h2>Propuesta de Valor</h2>
<p>MediSchedule se destaca por su interfaz amigable y su integración de calendarios en tiempo real, permitiendo a los usuarios seleccionar citas de manera eficiente y recibir recordatorios automáticos. Además, ofrece la posibilidad de reprogramar citas con facilidad y mantiene un registro histórico de las interacciones de los pacientes.</p>

<h2>Capacidades Clave</h2>
<ol>
  <li><strong>Gestión de Citas</strong>: Permite a los usuarios agendar, reprogramar y cancelar citas fácilmente desde la aplicación, optimizando el tiempo del médico y del paciente.</li>
  <li><strong>Recordatorios Automáticos</strong>: Envía notificaciones a los pacientes y médicos antes de las citas, reduciendo la tasa de ausencias y mejorando el flujo de atención.</li>
  <li><strong>Interfaz Intuitiva</strong>: Proporciona una experiencia de usuario sencilla y efectiva, facilitando el proceso de agendamiento para todos los usuarios.</li>
  <li><strong>Historial de Citas</strong>: Ofrece la capacidad de consultar citas pasadas y próximas, así como un registro de tratamientos realizados.</li>
</ol>

<h2>Casos de Uso Principales</h2>
<ul>
  <li>Cuando un <strong>paciente</strong> necesita ver a un médico, puede usar MediSchedule para agendar una cita rápida y acceder a la disponibilidad del doctor para recibir atención oportuna.</li>
  <li>Cuando un <strong>médico</strong> tiene un cambio en su agenda, puede ajustar fácilmente sus disponibilidades en la aplicación para mantener a sus pacientes informados.</li>
</ul>

<h2>Alcance</h2>

<h3>Dentro del Alcance</h3>
<ul>
  <li>Agendamiento y reprogramación de citas médicas.</li>
  <li>Envío de recordatorios a usuarios.</li>
  <li>Consulta de historial de citas y tratamientos.</li>
  <li>Integración de calendarios con otros servicios.</li>
</ul>

<h3>Fuera del Alcance</h3>
<ul>
  <li>Funcionalidades de telemedicina (consultas en línea).</li>
  <li>Gestión de pagos y seguros médicos.</li>
</ul>

<h3>Supuestos y Dependencias</h3>
<ul>
  <li>Se asume que los usuarios tienen acceso a dispositivos móviles o computadoras con conexión a internet.</li>
  <li>Dependencia de sistemas de calendario externos para integrar las disponibilidades médicas.</li>
</ul>

<h2>Métricas de Éxito</h2>
<ul>
  <li><strong>Reducción de ausencias</strong>: Disminuir la tasa de ausencias de los pacientes a menos del 10% en los primeros seis meses de uso.</li>
  <li><strong>Adopción de usuarios</strong>: Alcanzar 5,000 usuarios registrados dentro del primer año de lanzamiento.</li>
</ul>

<h2>Restricciones</h2>
<ul>
  <li>Limitaciones técnicas debido a la integración de sistemas de terceros.</li>
  <li>Presupuesto limitado que podría restringir la publicidad y promoción de la aplicación.</li>
</ul>
`;

/* ================================================================
 * REQUIREMENTS — basado en requisitos.md
 * ================================================================ */

export const MOCK_REQUIREMENTS_HTML = `
<h1>Documento de Requisitos</h1>

<h2>Introducción</h2>
<p>MediSchedule es una aplicación destinada a mejorar la gestión de citas médicas para pacientes, médicos y administradores de clínicas. Proporciona funcionalidades para simplificar el agendamiento, enviar recordatorios automáticos y mantener un historial de citas, optimizando así la comunicación y organización entre usuarios.</p>

<h2>Contexto de Alcance</h2>
<ul>
  <li><strong>Dentro del alcance</strong>: Agendamiento y reprogramación de citas médicas, envío de recordatorios, consulta de historial de citas y tratamientos, integración de calendarios.</li>
  <li><strong>Fuera del alcance</strong>: Funcionalidades de telemedicina, gestión de pagos y seguros médicos.</li>
</ul>

<h2>Requisitos</h2>

<h3>Requisito 1: Gestión de Citas</h3>
<p><strong>Objetivo:</strong> Como paciente, quiero agendar una cita médica, para recibir atención oportuna.</p>

<h4>Criterios de Aceptación</h4>
<ol>
  <li>When el paciente solicita agendar una cita, el sistema shall mostrar la disponibilidad de horarios del médico.</li>
  <li>If el paciente selecciona un horario, then el sistema shall registrar la cita en la base de datos y notificar al médico.</li>
  <li>While el paciente tiene una cita programada, el sistema shall permitirle reprogramar o cancelar la cita hasta 24 horas antes de la misma.</li>
  <li>Where el paciente accede a su historial de citas, el sistema shall mostrar todas las citas pasadas y futuras programadas.</li>
</ol>

<h3>Requisito 2: Recordatorios Automáticos</h3>
<p><strong>Objetivo:</strong> Como médico, quiero enviar recordatorios automáticos a mis pacientes, para reducir la tasa de ausencias.</p>

<h4>Criterios de Aceptación</h4>
<ol>
  <li>When se aproxima la fecha de la cita, el sistema shall enviar un recordatorio al paciente y al médico por medio de notificaciones.</li>
  <li>If el paciente cancela una cita, then el sistema shall dejar de enviar recordatorios para esa cita específica.</li>
  <li>While un recordatorio ha sido enviado, el sistema shall permitir al médico modificar el horario de la cita y enviar un nuevo recordatorio.</li>
</ol>

<h3>Requisito 3: Interfaz Intuitiva</h3>
<p><strong>Objetivo:</strong> Como administrador de clínica, quiero una interfaz sencilla, para gestionar eficientemente la programación de citas.</p>

<h4>Criterios de Aceptación</h4>
<ol>
  <li>When el administrador accede a la aplicación, el sistema shall presentar una interfaz clara que permita seleccionar funciones clave con facilidad.</li>
  <li>If el administrador necesita ajustar la disponibilidad de un médico, then el sistema shall permitir realizar estos cambios con unos pocos clics.</li>
  <li>While el administrador está utilizando el sistema, el sistema shall ofrecer ayuda contextual sobre las funcionalidades disponibles.</li>
</ol>

<h3>Requisito 4: Historial de Citas</h3>
<p><strong>Objetivo:</strong> Como paciente, quiero consultar mi historial de citas, para tener un registro de mis tratamientos y consultas.</p>

<h4>Criterios de Aceptación</h4>
<ol>
  <li>When el paciente accede a la sección de historial de citas, el sistema shall mostrar un registro detallado de todas las citas pasadas.</li>
  <li>If el paciente tiene citas futuras, then el sistema shall proporcionarle la opción de ver esas citas junto con la información del médico.</li>
  <li>While el paciente revisa su historial, el sistema shall permitirle filtrar las citas por fechas y tipos de consulta.</li>
</ol>

<h3>Requisito 5: Integración de Calendarios</h3>
<p><strong>Objetivo:</strong> Como médico, quiero integrar mi calendario personal con el sistema, para mantener actualizada mi disponibilidad de citas.</p>

<h4>Criterios de Aceptación</h4>
<ol>
  <li>When el médico conecta su calendario externo, el sistema shall sincronizar automáticamente su disponibilidad con la aplicación.</li>
  <li>If el médico actualiza su calendario externo, then el sistema shall reflejar los cambios de disponibilidad en tiempo real.</li>
  <li>While el médico tiene citas programadas, el sistema shall no permitir que se agenden citas en horarios ya ocupados.</li>
</ol>

<h3>Requisito 6: Gestión de Pacientes</h3>
<p><strong>Objetivo:</strong> Como administrador de clínica, quiero gestionar la información de pacientes, para mantener un registro organizado de los mismos.</p>

<h4>Criterios de Aceptación</h4>
<ol>
  <li>When el administrador agrega un nuevo paciente, el sistema shall almacenar toda la información relevante, como nombre, contacto y detalles médicos.</li>
  <li>If un paciente solicita actualizar su información, then el sistema shall permitir al administrador realizar modificaciones de forma sencilla.</li>
  <li>While un paciente es parte del sistema, el sistema shall permitir al administrador consultar su información completa y su historial de citas.</li>
</ol>

<h3>Requisito 7: Notificaciones de Cambios</h3>
<p><strong>Objetivo:</strong> Como paciente, quiero ser notificado sobre cualquier cambio en mi cita, para estar siempre informado.</p>

<h4>Criterios de Aceptación</h4>
<ol>
  <li>When un médico reprograma una cita, el sistema shall notificar al paciente del cambio a través de la aplicación y/o correo electrónico.</li>
  <li>If la cancelación de una cita es solicitada por el médico, then el sistema shall enviar una notificación al paciente informándole de la cancelación.</li>
  <li>While el paciente tiene citas programadas, el sistema shall permitirle elegir el método preferido de notificación (push, email).</li>
</ol>

<h3>Requisito 8: Seguridad y Privacidad</h3>
<p><strong>Objetivo:</strong> Como usuario, quiero que la información de mis citas esté segura, para proteger mis datos personales.</p>

<h4>Criterios de Aceptación</h4>
<ol>
  <li>When un usuario se registra en la aplicación, el sistema shall asegurar que toda la información se almacena en una base de datos cifrada.</li>
  <li>If un usuario olvida su contraseña, then el sistema shall permitirle recuperar su acceso mediante un proceso seguro de restablecimiento de contraseña.</li>
  <li>While un usuario esté autenticado, el sistema shall asegurar que solo tenga acceso a su información y no a la de otros usuarios.</li>
</ol>

<h3>Requisito 9: Reporting y Métricas</h3>
<p><strong>Objetivo:</strong> Como administrador de clínica, quiero generar reportes sobre las citas, para evaluar el desempeño del sistema.</p>

<h4>Criterios de Aceptación</h4>
<ol>
  <li>When el administrador solicita un reporte, el sistema shall compilar datos sobre citas agendadas, ausencias y atendidos.</li>
  <li>If el administrador elige un rango de fechas, then el sistema shall incluir solo las citas que correspondan a ese intervalo.</li>
  <li>While se genera un reporte, el sistema shall permitir al administrador exportar los datos a formatos comunes, como CSV o PDF.</li>
</ol>

<h3>Requisito 10: Soporte Técnico</h3>
<p><strong>Objetivo:</strong> Como usuario, quiero contar con un soporte técnico accesible, para resolver mis dudas sobre el uso de la aplicación.</p>

<h4>Criterios de Aceptación</h4>
<ol>
  <li>When un usuario requiere asistencia, el sistema shall proporcionar un canal de comunicación para contacto directo con soporte técnico.</li>
  <li>If un usuario reporta un problema, then el sistema shall registrar el ticket y proporcionar un número de seguimiento.</li>
  <li>While el usuario está en la aplicación, el sistema shall ofrecerse la opción de acceder a una sección de preguntas frecuentes.</li>
</ol>

<h3>Requisito 11: Accesibilidad</h3>
<p><strong>Objetivo:</strong> Como paciente, quiero poder utilizar la aplicación desde diferentes dispositivos, para facilitar el acceso a la gestión de mis citas.</p>

<h4>Criterios de Aceptación</h4>
<ol>
  <li>When un paciente accede a la aplicación desde un dispositivo móvil, el sistema shall asegurar que todas las funcionalidades estén disponibles.</li>
  <li>If un paciente intenta acceder desde un navegador de computadora, then el sistema shall proporcionar la misma funcionalidad y experiencia de uso.</li>
  <li>While un paciente navega en la aplicación, el sistema shall adaptarse a diferentes resoluciones de pantalla para ofrecer una experiencia óptima.</li>
</ol>

<h2>Conclusión</h2>
<p>Este documento establece todos los requisitos necesarios para el desarrollo de MediSchedule, asegurando que cubre las necesidades de pacientes, médicos y administradores de clínicas, maximizando la eficiencia y la satisfacción del usuario.</p>
`;

/* ================================================================
 * PROMPTS DE AGENTES — sintetizados del proyecto Flujo
 * ================================================================ */

export const MOCK_PROMPTS = {
  "discovery.creator": `# Discovery · Creador — Product Manager

Eres un Product Manager experto. Tu rol es crear un **documento de producto** completo y estructurado a partir de la idea del usuario.

## Instrucciones

Genera un documento que cubra TODAS las siguientes secciones de forma sustancial:

1. **Título**: Nombre descriptivo del producto.
2. **Resumen Ejecutivo**: Qué es, para quién y qué problema resuelve (2-3 frases).
3. **Problema**: Situación actual que justifica construir el producto. Por qué las soluciones existentes no son suficientes.
4. **Público Objetivo**: Segmentos de usuarios (rol, necesidad, contexto). Mínimo 2 segmentos.
5. **Propuesta de Valor**: Qué hace único al producto frente a alternativas.
6. **Capacidades Clave**: Lista de funcionalidades principales, priorizadas por impacto. Formato: "N. **[Nombre]**: [descripción]".
7. **Casos de Uso Principales**: Escenarios representativos. Formato: "Cuando [situación], el [usuario] puede [acción] para [beneficio]."
8. **Alcance**: Dentro del alcance / Fuera del alcance / Supuestos y dependencias.
9. **Métricas de Éxito**: Métricas cuantificables con valores objetivo y plazos.
10. **Restricciones**: Limitaciones de negocio, técnicas, legales o de presupuesto.

## Reglas
- SOLO incluye el contenido del documento. NO agregues frases conversacionales.
- Todas las secciones deben tener contenido sustancial (no vacías).
- No dejes placeholders sin reemplazar como [descripción] o [rol].
- El documento debe ser coherente en todas las secciones.
`,

  "discovery.reviewer": `# Discovery · Revisor — Verificación de Producto

Eres un revisor de documentos de producto. Tu tarea es verificar la calidad del documento generado.

## Checklist de Verificación (responde SÍ/NO a cada punto)

1. **TEMA CORRECTO**: ¿El documento habla del mismo tema que pidió el usuario?
2. **SIN PLACEHOLDERS**: ¿Hay texto entre corchetes como [descripción], [rol] sin reemplazar? (NO = bien)
3. **COMPLETO**: ¿El documento tiene al menos 3 secciones con contenido sustancial?
4. **COHERENCIA**: ¿Todas las secciones hablan del mismo producto?
5. **SIN METACOMENTARIOS**: ¿El documento NO contiene frases como "aquí está", "espero que te sirva"? (NO = bien)

## Decisión
- Si los 5 puntos son favorables → **APROBADO**
- Si algún punto falla → **RECHAZADO** con feedback específico indicando qué corregir
`,

  "requirements.creator": `# Requirements · Creador — Analista EARS

Eres un analista de requerimientos experto. Tu rol es crear un **documento de requisitos** siguiendo estrictamente la sintaxis EARS (Easy Approach to Requirements Syntax).

## Formato por Requisito

\`\`\`
### Requisito N: [Nombre del área]
**Objetivo:** Como [ROL], quiero [CAPACIDAD], para [BENEFICIO]

#### Criterios de Aceptación
1. When [evento], el sistema shall [respuesta]
2. If [condición], then el sistema shall [respuesta]
3. While [precondición], el sistema shall [respuesta]
4. Where [funcionalidad], el sistema shall [respuesta]
\`\`\`

## Reglas
- Cada requisito tiene un Objetivo en formato historia de usuario (rol, capacidad, beneficio).
- Los criterios usan los patrones EARS: When, If, While, Where, The system shall.
- Mínimo 2 criterios por requisito.
- NO escribas requisitos sobre botones, menús, colores, pantallas o modales. Enfócate en **lógica de negocio**.
- Sé EXHAUSTIVO: cubre TODOS los roles, escenarios, casos de uso y capacidades del producto.
- Cada funcionalidad del producto debe tener al menos un requisito que la cubra.
- Agrupa requisitos por áreas funcionales.
- SOLO incluye el contenido del documento. NO agregues frases conversacionales.

## Estructura del Documento
1. **Introducción**: Descripción breve de la funcionalidad y para quién.
2. **Contexto de Alcance**: Dentro/fuera del alcance.
3. **Requisitos**: Todos los requisitos con formato EARS.
`,

  "requirements.reviewer": `# Requirements · Revisor — Verificación EARS

Eres un revisor de requisitos en formato EARS. Verificas hechos objetivos.

## Checklist (responde SÍ/NO a cada punto)

1. **ESTRUCTURA**: ¿El documento tiene Introducción, Contexto de Alcance y Requisitos con formato "### Requisito N: [nombre]"?
2. **FORMATO EARS**: ¿Cada requisito tiene Objetivo (Como ROL, quiero CAPACIDAD, para BENEFICIO) y Criterios de Aceptación?
3. **CRITERIOS EARS**: ¿Los criterios usan patrones When/If/While/Where? ¿Al menos 2 por requisito?
4. **SIN UI**: ¿Aparece alguna palabra de UI (interfaz, pantalla, botón, menú, color, layout, modal, CSS, HTML)? (SÍ = mal)
5. **CANTIDAD**: ¿Hay al menos 5 requisitos en total?
6. **OBJETIVOS CLAROS**: ¿Los objetivos son historias de usuario con ROL, CAPACIDAD y BENEFICIO?
7. **CRITERIOS VERIFICABLES**: ¿Los criterios describen comportamientos concretos y comprobables?
8. **NO DUPLICADOS**: ¿Hay dos requisitos que describan esencialmente lo mismo? (SÍ = mal)
9. **COBERTURA**: ¿Los requisitos cubren las capacidades y casos de uso del producto?
10. **SIN METACOMENTARIOS**: ¿El documento NO contiene frases como "aquí está", "ahora voy a"? (NO = bien)

## Decisión
- 8+ puntos favorables → **APROBADO**
- 3+ puntos desfavorables → **RECHAZADO** con feedback específico
`,

  "design.creator": `# Design · Creador — Arquitecto de Diagramas de Clases (Apollon JSON)

Eres un arquitecto de software experto en diseño orientado a objetos. Tu rol es crear un **diagrama de clases** en formato JSON compatible con el editor Apollon, basándote en los requisitos del producto.

## Estructura del JSON

El JSON debe seguir esta estructura exacta:

\`\`\`json
{
  "id": "<uuid>",
  "version": "4.0.0",
  "title": "Class Diagram",
  "type": "ClassDiagram",
  "nodes": [ ... ],
  "edges": [ ... ],
  "assessments": {}
}
\`\`\`

### Nodos (Clases)
Cada clase es un nodo con:
- \`id\`: UUID único
- \`type\`: "class"
- \`width\` / \`height\`: dimensiones del nodo
- \`position\`: { x, y } para ubicación en el canvas
- \`data.name\`: nombre de la clase (PascalCase, sin tildes ni eñes)
- \`data.attributes\`: array de { id: UUID, name: "+ atributo: tipo" }
- \`data.methods\`: array de { id: UUID, name: "+ metodo(params): tipo" }
- Para enumeraciones: agregar \`data.stereotype\`: "Enumeration"

### Edges (Relaciones)
Cada relación es un edge con:
- \`id\`: UUID único
- \`source\` / \`target\`: IDs de los nodos conectados
- \`type\`: "ClassBidirectional" para asociaciones
- \`sourceHandle\` / \`targetHandle\`: puntos de conexión (top, bottom, left, right, etc.)
- \`data.sourceMultiplicity\` / \`data.targetMultiplicity\`: ej. "1 .. 1", "0 .. *"

## Reglas
- Mínimo 5 clases de dominio (NO clases técnicas como Manager, Controller, Service).
- Mínimo 2 enumeraciones con 2+ literales.
- Cada clase tiene mínimo 2 atributos con tipos explícitos.
- Mínimo 1 método relevante por clase principal.
- Nombres sin tildes, eñes ni caracteres especiales.
- Los UUIDs deben ser válidos (formato xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx).
- Distribuir los nodos en el canvas para que no se solapen.
- SOLO devuelve el JSON. Sin markdown, sin explicaciones.
`,

  "design.reviewer": `# Design · Revisor — Verificación de Diagrama Apollon

Eres un revisor de diagramas de clases en formato Apollon JSON. Verificas hechos objetivos.

## Checklist (responde SÍ/NO a cada punto)

1. **JSON VÁLIDO**: ¿El contenido es un JSON válido con estructura { id, version, type, nodes, edges }?
2. **CLASES**: ¿Hay al menos 5 nodos con type "class"? ¿Ninguno se llama Manager, Controller, Service, Repository?
3. **ATRIBUTOS**: ¿Cada clase tiene al menos 2 atributos con tipos explícitos?
4. **ENUMS**: ¿Hay al menos 2 nodos con stereotype "Enumeration" con 2+ literales?
5. **RELACIONES**: ¿Hay edges conectando las clases con multiplicidades definidas?
6. **MULTIPLICIDADES**: ¿Todos los edges tienen sourceMultiplicity y targetMultiplicity?
7. **UUIDS**: ¿Todos los IDs de nodos y edges son UUIDs válidos?
8. **POSICIONES**: ¿Los nodos tienen posiciones variadas (no todos en 0,0)?
9. **NOMBRES LIMPIOS**: ¿Los nombres de clases y atributos no tienen tildes, eñes ni caracteres especiales?
10. **COBERTURA**: ¿Las clases cubren las entidades principales de los requisitos?

## Decisión
- 8+ puntos SI → **APROBADO**
- 3+ puntos NO → **RECHAZADO** con feedback específico
`,
} as const;

/* ================================================================
 * DESIGN — Diagrama de clases Apollon (JSON)
 * ================================================================ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MOCK_DESIGN_JSON: Record<string, any> = {
  "id": "df6e2d57-8603-456b-977a-6e4a2a5023ff",
  "version": "4.0.0",
  "title": "Class Diagram",
  "type": "ClassDiagram",
  "nodes": [
    {
      "id": "c91f791f-8670-49a7-b3e6-b1c267812c82",
      "width": 340,
      "height": 130,
      "type": "class",
      "position": { "x": -600, "y": 40 },
      "data": {
        "name": "Administrador",
        "methods": [
          { "id": "4b12947f-679e-4fa1-a151-e71cf91bd6ec", "name": "+ gestionarPaciente(paciente: Paciente): bool" }
        ],
        "attributes": [
          { "id": "95ec1475-273c-4b8c-9e58-bf1e64f0b3fd", "name": "+ contacto: str" },
          { "id": "99f2f8eb-59d5-4608-8c3b-db45606fe009", "name": "+ nombre: str" }
        ]
      },
      "measured": { "width": 340, "height": 130 }
    },
    {
      "id": "56dc934b-20ff-41a5-a9ad-05faf0a0df0b",
      "width": 290,
      "height": 130,
      "type": "class",
      "position": { "x": -390, "y": 365 },
      "data": {
        "name": "Paciente",
        "methods": [
          { "id": "119bdf8a-e691-4ae7-bbd9-9ea9fa223a03", "name": "+ agendarCita(cita: CitaMedica): bool" }
        ],
        "attributes": [
          { "id": "277d71c1-8a28-48c9-9ecb-cd33ebd44c40", "name": "+ contacto: str" },
          { "id": "264cfc6e-f7a1-4ce3-9f65-9a9a361449aa", "name": "+ nombre: str" }
        ]
      },
      "measured": { "width": 290, "height": 130 }
    },
    {
      "id": "1817c31d-efc8-48af-9cf0-51c52abe1ef0",
      "width": 190,
      "height": 70,
      "type": "class",
      "position": { "x": -715, "y": 395 },
      "data": {
        "name": "HistorialCitas",
        "methods": [],
        "attributes": [
          { "id": "a98983d0-c221-4727-8f10-209908bd094c", "name": "+ listaCitas: CitaMedica" }
        ]
      },
      "measured": { "width": 190, "height": 70 }
    },
    {
      "id": "36b2b73e-99b7-4c03-9667-c3c6f7027a8a",
      "width": 390,
      "height": 160,
      "type": "class",
      "position": { "x": -235, "y": -45 },
      "data": {
        "name": "CitaMedica",
        "methods": [
          { "id": "51c1fba3-350f-42ee-a118-0eef2ff134e4", "name": "notificarCambio(metodo: MetodoNotificacion): bool" }
        ],
        "attributes": [
          { "id": "5a5b3deb-5116-49f5-80bb-53562ed417a4", "name": "+ estado: EstadoCita" },
          { "id": "9650142b-c295-4082-b140-0b58fe79da47", "name": "+ fecha: datetime" },
          { "id": "08924100-10b2-44f5-a2f7-d2102fd2660f", "name": "+ medico: Medico" }
        ]
      },
      "measured": { "width": 390, "height": 160 }
    },
    {
      "id": "299d5950-adad-4422-be9d-9a5e94c5af40",
      "width": 320,
      "height": 160,
      "type": "class",
      "position": { "x": -45, "y": 340 },
      "data": {
        "name": "Medico",
        "methods": [
          { "id": "6da05a91-27bb-4d2d-ae82-c4049afd48e4", "name": "enviarRecordatorio(cita: CitaMedica): bool" }
        ],
        "attributes": [
          { "id": "f409f7d6-fc7e-4aed-941d-e5dcd1fd3df1", "name": "+ disponibilidad: str" },
          { "id": "faf37418-c5c6-4826-a1c4-1723c9e0a910", "name": "+ email: str" },
          { "id": "f0c36ed9-1bbc-44bd-be97-1cbcc5d356c2", "name": "+ nombre: str" }
        ]
      },
      "measured": { "width": 320, "height": 160 }
    },
    {
      "id": "4b976fba-671b-47c8-b793-5a5f8e91e13b",
      "width": 160,
      "height": 140,
      "type": "class",
      "position": { "x": 290, "y": -45 },
      "data": {
        "name": "EstadoCita",
        "stereotype": "Enumeration",
        "methods": [],
        "attributes": [
          { "id": "6f86fbf7-ecb4-454a-9bae-a539a0bbbb18", "name": "AGENDADA" },
          { "id": "86bb0146-dc21-42d8-aa1d-4aa9af821ad2", "name": "CANCELADA" },
          { "id": "05872067-ccf6-45ec-b801-1ba367ee34cd", "name": "COMPLETADA " }
        ]
      },
      "measured": { "width": 160, "height": 140 }
    },
    {
      "id": "bf9ced3c-e955-4c5e-9c4e-f861800afc93",
      "width": 170,
      "height": 110,
      "type": "class",
      "position": { "x": 295, "y": 155 },
      "data": {
        "name": "MetodoNotificacion",
        "stereotype": "Enumeration",
        "methods": [],
        "attributes": [
          { "id": "4d43ffd3-9d40-463c-9e78-2a4ca861f3c1", "name": "EMAIL" },
          { "id": "8c4f0240-122e-495d-8411-2597e91a144f", "name": "PUSH" }
        ]
      },
      "measured": { "width": 170, "height": 110 }
    }
  ],
  "edges": [
    {
      "id": "43c48bed-7042-4165-8769-a47412bdf200",
      "source": "56dc934b-20ff-41a5-a9ad-05faf0a0df0b",
      "target": "36b2b73e-99b7-4c03-9667-c3c6f7027a8a",
      "type": "ClassBidirectional",
      "sourceHandle": "top-mid-right",
      "targetHandle": "bottom-left",
      "data": { "sourceMultiplicity": "1 .. 1", "targetMultiplicity": "0 .. *", "points": [] }
    },
    {
      "id": "497db6f9-1bfc-48a7-b664-99260c9547af",
      "source": "299d5950-adad-4422-be9d-9a5e94c5af40",
      "target": "36b2b73e-99b7-4c03-9667-c3c6f7027a8a",
      "type": "ClassBidirectional",
      "sourceHandle": "top",
      "targetHandle": "bottom-right",
      "data": {
        "points": [
          { "x": 115, "y": 339 },
          { "x": 115, "y": 228 },
          { "x": 75, "y": 228 },
          { "x": 75, "y": 116 }
        ],
        "targetMultiplicity": "0 .. *",
        "sourceMultiplicity": "1 .. 1"
      }
    },
    {
      "id": "48da5d7f-250e-441e-9801-bc9b5519884d",
      "source": "1817c31d-efc8-48af-9cf0-51c52abe1ef0",
      "target": "56dc934b-20ff-41a5-a9ad-05faf0a0df0b",
      "type": "ClassBidirectional",
      "sourceHandle": "right",
      "targetHandle": "left-between-mid-bottom-center",
      "data": { "sourceMultiplicity": "1 .. 1", "targetRole": "", "targetMultiplicity": "0 .. *", "points": [] }
    },
    {
      "id": "4f67452d-bc77-432c-b98f-a5286c3d294c",
      "source": "c91f791f-8670-49a7-b3e6-b1c267812c82",
      "target": "56dc934b-20ff-41a5-a9ad-05faf0a0df0b",
      "type": "ClassBidirectional",
      "sourceHandle": "bottom-right",
      "targetHandle": "top-left",
      "data": { "sourceMultiplicity": "1 .. 1", "targetMultiplicity": "0 .. *", "points": [] }
    }
  ],
  "assessments": {}
};
