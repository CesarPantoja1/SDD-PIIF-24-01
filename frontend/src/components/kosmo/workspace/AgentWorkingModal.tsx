import { useEffect, useRef, useState } from "react";
import { Bot, Eye, Sparkles, CheckCircle2, Loader2, X, Check, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/kosmo/common";

/* ── Data model ── */

type IterationStep = {
  iteration: number;
  creator: string;
  reviewer: string;
  approved: number;
  total: number;
  passed: boolean;
  issues?: string[];
};

/* Each "visual step" maps to a render phase:
   0 → creator row of iteration 1
   1 → reviewer row of iteration 1
   2 → creator row of iteration 2
   … and so on. Total visual steps = iterations.length * 2 */

const SCRIPTS: Record<"generate" | "regenerate" | "generate-specs", IterationStep[]> = {
  generate: [
    {
      iteration: 1,
      creator: "Generando contenido inicial a partir del contexto del proyecto…",
      reviewer: "Revisión parcial: faltan restricciones y precisión en el alcance.",
      approved: 3,
      total: 5,
      passed: false,
      issues: ["Precisar el alcance del módulo principal", "Agregar restricciones técnicas"],
    },
    {
      iteration: 2,
      creator: "Corrigiendo según feedback: ampliando alcance y restricciones…",
      reviewer: "Mejora sustancial. Falta un criterio de aceptación menor.",
      approved: 4,
      total: 5,
      passed: false,
      issues: ["Incluir criterio de rendimiento esperado"],
    },
    {
      iteration: 3,
      creator: "Ajuste final: criterio de rendimiento incorporado.",
      reviewer: "Todos los criterios validados. Documento aprobado.",
      approved: 5,
      total: 5,
      passed: true,
    },
  ],
  "generate-specs": [
    {
      iteration: 1,
      creator: "Analizando documento de Discovery para extraer módulos funcionales…",
      reviewer: "Análisis completo. Se detectaron solapamientos entre las entidades propuestas.",
      approved: 2,
      total: 3,
      passed: false,
      issues: ["Definir fronteras claras entre módulos", "Consolidar funcionalidades redundantes"],
    },
    {
      iteration: 2,
      creator: "Refinando arquitectura de módulos y eliminando redundancias…",
      reviewer: "Módulos bien delimitados. Arquitectura validada con los requisitos de Discovery.",
      approved: 3,
      total: 3,
      passed: true,
    },
  ],
  regenerate: [
    {
      iteration: 1,
      creator: "Releyendo la versión anterior y detectando áreas de mejora…",
      reviewer: "Estructura correcta. Precisar sección de dependencias.",
      approved: 4,
      total: 5,
      passed: false,
      issues: ["Detallar dependencias entre módulos"],
    },
    {
      iteration: 2,
      creator: "Dependencias detalladas. Versión regenerada lista.",
      reviewer: "Todos los criterios aprobados. Documento validado.",
      approved: 5,
      total: 5,
      passed: true,
    },
  ],
};

const STEP_MS = 850;

export function AgentWorkingModal({
  mode,
  toLabel,
  onDone,
  onCancel,
}: {
  mode: "generate" | "regenerate" | "generate-specs";
  toLabel: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const iterations = SCRIPTS[mode];
  const totalVisualSteps = iterations.length * 2;
  const [step, setStep] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (step < totalVisualSteps) {
      const t = setTimeout(() => setStep((s) => s + 1), STEP_MS);
      return () => clearTimeout(t);
    }
  }, [step, totalVisualSteps]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [step]);

  const verb = mode === "regenerate" ? "Regenerando" : "Generando";
  const finished = step >= totalVisualSteps;
  const lastIteration = iterations[iterations.length - 1];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-card shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* ── Header ── */}
        <div className="px-5 py-4 border-b border-border flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-indigo-50 text-indigo-600">
            {finished ? <CheckCircle2 className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-slate-800 tracking-tight">
              {finished ? "Propuesta lista" : `${verb}…`}
            </h3>
            <p className="text-xs text-muted-foreground truncate">{toLabel}</p>
          </div>
          {!finished && <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />}
        </div>

        {/* ── Iteration timeline ── */}
        <div ref={scrollRef} className="max-h-96 overflow-y-auto px-5 py-4 space-y-1 bg-slate-50/50">
          {iterations.map((iter, iterIdx) => {
            const creatorStep = iterIdx * 2;
            const reviewerStep = iterIdx * 2 + 1;
            const showCreator = step > creatorStep;
            const showReviewer = step > reviewerStep;

            if (step <= creatorStep) return null;

            return (
              <div key={iter.iteration}>
                {/* Iteration divider */}
                <div className="flex items-center gap-2 pt-3 pb-2">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Iteración {iter.iteration}
                  </span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                {/* Creator row */}
                {showCreator && (
                  <div className="flex items-start gap-2.5 py-1.5">
                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-violet-100 text-violet-700">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-violet-600 mb-0.5">Creador</div>
                      <div className="inline-block rounded-lg px-3 py-2 text-xs leading-relaxed shadow-sm border bg-card border-border text-slate-700">
                        {iter.creator}
                      </div>
                    </div>
                  </div>
                )}

                {/* Reviewer row */}
                {showReviewer && (
                  <div className="flex items-start gap-2.5 py-1.5">
                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-emerald-100 text-emerald-700">
                      <Eye className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 mb-0.5">Revisor</div>
                      <div className={`inline-block rounded-lg px-3 py-2 text-xs leading-relaxed shadow-sm border ${
                        iter.passed
                          ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                          : "bg-amber-50 border-amber-200 text-amber-900"
                      }`}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span>{iter.reviewer}</span>
                          <Badge tone={iter.passed ? "green" : "amber"}>
                            {iter.passed ? <CheckCircle2 className="h-3 w-3 mr-0.5" /> : <AlertTriangle className="h-3 w-3 mr-0.5" />}
                            {iter.approved}/{iter.total} criterios
                          </Badge>
                        </div>
                        {iter.issues && iter.issues.length > 0 && (
                          <ul className="mt-1.5 space-y-0.5">
                            {iter.issues.map((issue, j) => (
                              <li key={j} className="flex items-start gap-1 text-[11px] text-amber-800">
                                <span className="shrink-0 mt-px">⚠</span>
                                <span>{issue}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing indicator */}
          {!finished && (
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground pl-1 pt-2">
              <span className="inline-flex gap-0.5">
                <TypingDot delay={0} />
                <TypingDot delay={150} />
                <TypingDot delay={300} />
              </span>
              {step % 2 === 0 ? "Creador escribiendo…" : "Revisor analizando…"}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-3 border-t border-border bg-card flex items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground">
            {finished
              ? `Completado en ${iterations.length} ${iterations.length === 1 ? "iteración" : "iteraciones"}. ${lastIteration.approved}/${lastIteration.total} criterios aprobados.`
              : "Puedes cancelar en cualquier momento."}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <X className="h-3.5 w-3.5" /> Cancelar
            </button>
            <button
              onClick={onDone}
              disabled={!finished}
              className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="h-3.5 w-3.5" /> Aceptar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TypingDot({ delay }: { delay: number }) {
  return (
    <span
      className="h-1 w-1 rounded-full bg-slate-400 animate-pulse"
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}

/* ============== CODE GENERATION VIEW ============== */
