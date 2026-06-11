# Cómo está mockeada la "generación" de fases (estado actual)

Esto debe conservarse tal cual aunque luego se cambie y se quiera revertir.

## Flujo

1. El usuario hace click en "Generar" sobre una fase (`brief` o `<specId>.<doc>`) dentro del workspace.
2. `src/components/kosmo/workspace/Workspace.tsx` abre `<AgentWorkingModal />` con `working = { specId, doc }`.
3. `AgentWorkingModal` (`src/components/kosmo/workspace/AgentWorkingModal.tsx`) **no llama a ningún backend / IA**. Solo recorre un array hardcoded de 5 pasos (`Evaluador RAG → Creador → Revisor → Vibe Modeler → Sistema`) con `setTimeout` (~900ms cada uno) y muestra animación.
4. Al terminar, el botón "Continuar" llama `onDone`, que en Workspace.tsx (línea ~243) hace:
   ```ts
   setGenerated({ ...generated, [docKey(working.specId, working.doc)]: true });
   setWorking(null);
   ```
5. `setGenerated` viene de `useGenerated(projectId)` en `src/hooks/use-project.ts`. Persiste en la tabla `phase_state` de Lovable Cloud: inserta `{ project_id, spec_id, doc, generated: true }` (spec_id=null para `brief`). Si ya existe, hace update.
6. El **contenido markdown** de la fase NO se genera ni se guarda — sigue siendo plantilla local en `src/lib/storage.ts` / componentes, y los edits del usuario en `PhaseEditor` se guardan en localStorage (`docKey`). Solo el flag booleano `generated` es real.

## Claves a recordar para revertir

- Mock vive enteramente en `AgentWorkingModal.tsx` (pasos + timers).
- El "efecto" real (marcar fase como generada) está en `Workspace.tsx` en `onDone` del modal.
- Persistencia: tabla `phase_state` vía `useGenerated` hook.
- Para volver a este mock después de cambios: restaurar `AgentWorkingModal` con los 5 pasos hardcoded + `setTimeout`, y dejar `onDone` llamando `setGenerated({...generated, [docKey(...)]: true})`.
