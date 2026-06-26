import { useEffect, useRef, useState } from "react";
import { Bot, Eye, Sparkles, CheckCircle2, Loader2, X, Check, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/kosmo/common";
import { streamDiscovery, type Evaluation } from "@/lib/api/api";

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
  sseToken,
  sseProjectId,
  sseProvider,
  sseModel,
  sseDocKey,
  sseSpecId,
}: {
  mode: "generate" | "regenerate" | "generate-specs";
  toLabel: string;
  onDone: (content?: string) => void;
  onCancel: () => void;
  sseToken?: string | null;
  sseProjectId?: string;
  sseProvider?: string;
  sseModel?: string;
  sseDocKey?: string;
  sseSpecId?: string | null;
}) {
  const useSSE = !!(sseToken && sseProjectId && sseProvider && sseModel
    && (mode === "generate" || mode === "generate-specs"));
  const isDiscoverySSE = useSSE;

  // debug
  useEffect(() => {
    console.log(
      "[AgentWorkingModal]",
      JSON.stringify({
        hasToken: !!sseToken,
        hasProject: !!sseProjectId,
        hasProvider: !!sseProvider,
        hasModel: !!sseModel,
        mode,
        useSSE,
        isDiscoverySSE,
      }),
    );
  }, [sseToken, sseProjectId, sseProvider, sseModel, mode, useSSE, isDiscoverySSE]);

  // SSE state
  const [sseEvaluations, setSseEvaluations] = useState<Evaluation[]>([]);
  const [sseFinished, setSseFinished] = useState(false);
  const [sseContent, setSseContent] = useState<string | null>(null);
  const [sseError, setSseError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Mock state
  const mockIterations = SCRIPTS[mode];
  const totalMockSteps = mockIterations.length * 2;
  const [mockStep, setMockStep] = useState(0);
  const mockFinished = mockStep >= totalMockSteps;

  const scrollRef = useRef<HTMLDivElement>(null);
  const verb = mode === "regenerate" ? "Regenerando" : "Generando";
  const finished = isDiscoverySSE ? sseFinished : mockFinished;
  const iterationsCount = isDiscoverySSE ? sseEvaluations.length : mockIterations.length;

  // Compute approved/total from last evaluation
  let lastApproved = 0;
  let lastTotal = 0;
  if (isDiscoverySSE && sseEvaluations.length > 0) {
    const last = sseEvaluations[sseEvaluations.length - 1];
    lastApproved = last.criteria?.filter((c) => c.passed).length ?? 0;
    lastTotal = last.criteria?.length ?? 0;
  } else if (!isDiscoverySSE && mockIterations.length > 0) {
    const last = mockIterations[mockIterations.length - 1];
    lastApproved = last.approved;
    lastTotal = last.total;
  }

  // SSE connection
  useEffect(() => {
    if (!isDiscoverySSE || !sseToken || !sseProjectId || !sseProvider || !sseModel) return;

    setSseFinished(false);
    setSseError(null);
    setSseEvaluations([]);
    setSseContent("");

    // Debounce to prevent React 18 StrictMode from firing two concurrent backend agents
    const timer = setTimeout(() => {
      const ctrl = streamDiscovery(
        sseToken,
        sseProjectId,
        sseProvider,
        sseModel!,
        sseDocKey || "brief",
        (evaluation) => {
          setSseEvaluations((prev) => [...prev, evaluation]);
        },
        (data) => {
          if (sseDocKey === "specs") {
            setSseContent(data.specs ? JSON.stringify(data.specs) : "");
          } else {
            setSseContent((data.content as string) || "");
          }
          setSseFinished(true);
        },
        (error) => {
          setSseError(error);
          setSseFinished(true);
        },
        sseSpecId
      );
      abortRef.current = ctrl;
    }, 200);

    return () => {
      clearTimeout(timer);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [isDiscoverySSE, sseToken, sseProjectId, sseProvider, sseModel, sseDocKey, sseSpecId]);

  // Mock timer
  useEffect(() => {
    if (isDiscoverySSE) return;
    if (mockStep < totalMockSteps) {
      const t = setTimeout(() => setMockStep((s) => s + 1), STEP_MS);
      return () => clearTimeout(t);
    }
  }, [mockStep, totalMockSteps, isDiscoverySSE]);

  // Auto scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [mockStep, sseEvaluations]);

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
              {finished ? (sseError ? "Error" : "Propuesta lista") : `${verb}…`}
            </h3>
            <p className="text-xs text-muted-foreground truncate">{toLabel}</p>
          </div>
          {!finished && <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />}
        </div>

        {/* ── Body ── */}
        <div ref={scrollRef} className="max-h-96 overflow-y-auto px-5 py-4 space-y-1 bg-slate-50/50">
          {isDiscoverySSE ? (
            /* ── SSE Stream ── */
            <>
              {sseEvaluations.map((ev, evIdx) => {
                const passed = ev.criteria?.filter((c) => c.passed).length ?? 0;
                const total = ev.criteria?.length ?? 0;
                const isLast = evIdx === sseEvaluations.length - 1;
                const showReviewer = !isLast || sseFinished || ev.result !== "unknown";

                return (
                  <div key={ev.iteration}>
                    <div className="flex items-center gap-2 pt-3 pb-2">
                      <div className="h-px flex-1 bg-slate-200" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Iteración {ev.iteration + 1}
                      </span>
                      <div className="h-px flex-1 bg-slate-200" />
                    </div>

                    {/* Creator */}
                    <div className="flex items-start gap-2.5 py-1.5">
                      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-violet-100 text-violet-700">
                        <Bot className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-violet-600 mb-0.5">Creador</div>
                        <div className="inline-block rounded-lg px-3 py-2 text-xs leading-relaxed shadow-sm border bg-card border-border text-slate-700">
                          {ev.iteration === 0 ? "Generando contenido inicial…" : "Corrigiendo según feedback del revisor…"}
                        </div>
                      </div>
                    </div>

                    {/* Reviewer */}
                    {showReviewer && (
                      <div className="flex items-start gap-2.5 py-1.5">
                        <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-md ${
                          ev.result === "satisfied" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          <Eye className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-[10px] font-semibold uppercase tracking-wider mb-0.5 ${
                            ev.result === "satisfied" ? "text-emerald-600" : "text-amber-600"
                          }`}>Revisor</div>
                          <div className={`inline-block rounded-lg px-3 py-2 text-xs leading-relaxed shadow-sm border ${
                            ev.result === "satisfied"
                              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                              : "bg-amber-50 border-amber-200 text-amber-900"
                          }`}>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span>{ev.explanation}</span>
                              <Badge tone={ev.result === "satisfied" ? "green" : "amber"}>
                                {ev.result === "satisfied" ? <CheckCircle2 className="h-3 w-3 mr-0.5" /> : <AlertTriangle className="h-3 w-3 mr-0.5" />}
                                {passed}/{total} criterios
                              </Badge>
                            </div>
                            {ev.criteria?.filter((c) => !c.passed).length > 0 && (
                              <ul className="mt-1.5 space-y-0.5">
                                {ev.criteria.filter((c) => !c.passed).map((c, j) => (
                                  <li key={j} className="flex items-start gap-1 text-[11px] text-amber-800">
                                    <span className="shrink-0 mt-px">⚠</span>
                                    <span>{c.gap || c.name}</span>
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

              {!sseFinished && (
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground pl-1 pt-2">
                  <span className="inline-flex gap-0.5">
                    <TypingDot delay={0} />
                    <TypingDot delay={150} />
                    <TypingDot delay={300} />
                  </span>
                  {sseEvaluations.length === 0 ? "Creador escribiendo…" : sseEvaluations.length % 2 === 0 ? "Creador escribiendo…" : "Revisor analizando…"}
                </div>
              )}

              {sseError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 mt-2 text-xs text-red-700">
                  {sseError}
                </div>
              )}
            </>
          ) : mode === "generate" && sseToken && sseProjectId ? (
            /* ── Error: Discovery should use SSE but provider/model missing ── */
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-amber-100 text-amber-600 mb-3">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-semibold text-amber-800 mb-1">Agente no configurado</h4>
              <p className="text-xs text-amber-700 max-w-xs leading-relaxed">
                No se encontró la configuración del agente de Discovery (proveedor/modelo).
                Configurá los agentes en Settings → Coding Agents → Discovery.
              </p>
            </div>
          ) : (
            /* ── Mock Script ── */
            <>
              {mockIterations.map((iter, iterIdx) => {
                const creatorStep = iterIdx * 2;
                const reviewerStep = iterIdx * 2 + 1;
                const showCreator = mockStep > creatorStep;
                const showReviewer = mockStep > reviewerStep;

                if (mockStep <= creatorStep) return null;

                return (
                  <div key={iter.iteration}>
                    <div className="flex items-center gap-2 pt-3 pb-2">
                      <div className="h-px flex-1 bg-slate-200" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Iteración {iter.iteration}</span>
                      <div className="h-px flex-1 bg-slate-200" />
                    </div>

                    {showCreator && (
                      <div className="flex items-start gap-2.5 py-1.5">
                        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-violet-100 text-violet-700">
                          <Bot className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-violet-600 mb-0.5">Creador</div>
                          <div className="inline-block rounded-lg px-3 py-2 text-xs leading-relaxed shadow-sm border bg-card border-border text-slate-700">{iter.creator}</div>
                        </div>
                      </div>
                    )}

                    {showReviewer && (
                      <div className="flex items-start gap-2.5 py-1.5">
                        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-emerald-100 text-emerald-700">
                          <Eye className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 mb-0.5">Revisor</div>
                          <div className={`inline-block rounded-lg px-3 py-2 text-xs leading-relaxed shadow-sm border ${
                            iter.passed ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-amber-50 border-amber-200 text-amber-900"
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

              {!mockFinished && (
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground pl-1 pt-2">
                  <span className="inline-flex gap-0.5">
                    <TypingDot delay={0} />
                    <TypingDot delay={150} />
                    <TypingDot delay={300} />
                  </span>
                  {mockStep % 2 === 0 ? "Creador escribiendo…" : "Revisor analizando…"}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-3 border-t border-border bg-card flex items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground">
            {finished
              ? sseError
                ? "Ocurrió un error. Intenta de nuevo."
                : `Completado en ${iterationsCount} ${iterationsCount === 1 ? "iteración" : "iteraciones"}. ${lastApproved}/${lastTotal} criterios aprobados.`
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
              onClick={() => onDone(isDiscoverySSE ? (sseContent ?? undefined) : undefined)}
              disabled={!finished}
              className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="h-3.5 w-3.5" /> Revisar propuesta
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
