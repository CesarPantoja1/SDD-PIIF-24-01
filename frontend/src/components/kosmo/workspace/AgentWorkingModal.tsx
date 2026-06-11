import { useEffect, useRef, useState } from "react";
import { Bot, Sparkles, CheckCircle2, Loader2, X, Check } from "lucide-react";

type Turn = { who: "creator" | "reviewer"; text: string };

const SCRIPTS: Record<"generate" | "regenerate", Turn[]> = {
  generate: [
    { who: "creator", text: "Analizando el contexto y borrando supuestos…" },
    { who: "creator", text: "Redactando primera versión del documento." },
    { who: "reviewer", text: "Revisando consistencia y cobertura de requisitos." },
    { who: "reviewer", text: "Sugiero precisar el alcance del módulo principal." },
    { who: "creator", text: "Ajustado. Refinando estructura y secciones." },
    { who: "reviewer", text: "Listo: documento validado y aprobado ✅" },
  ],
  regenerate: [
    { who: "creator", text: "Releyendo la versión anterior…" },
    { who: "reviewer", text: "Detecto puntos a mejorar en la sección de alcance." },
    { who: "creator", text: "Reescribiendo con foco en claridad y precisión." },
    { who: "reviewer", text: "Mejor. Validando coherencia final." },
    { who: "creator", text: "Versión regenerada lista." },
    { who: "reviewer", text: "Aprobado ✅" },
  ],
};

const STEP_MS = 850;

export function AgentWorkingModal({
  mode,
  toLabel,
  onDone,
  onCancel,
}: {
  mode: "generate" | "regenerate";
  toLabel: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const script = SCRIPTS[mode];
  const [step, setStep] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (step < script.length) {
      const t = setTimeout(() => setStep((s) => s + 1), STEP_MS);
      return () => clearTimeout(t);
    }
  }, [step, script.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [step]);

  const verb = mode === "regenerate" ? "Regenerando" : "Generando";
  const visible = script.slice(0, step);
  const finished = step >= script.length;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-card shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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

        <div ref={scrollRef} className="max-h-80 overflow-y-auto px-5 py-4 space-y-3 bg-slate-50/50">
          {visible.map((turn, i) => (
            <ChatBubble key={i} turn={turn} />
          ))}
          {!finished && (
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground pl-1">
              <span className="inline-flex gap-0.5">
                <Dot delay={0} />
                <Dot delay={150} />
                <Dot delay={300} />
              </span>
              {script[step]?.who === "reviewer" ? "Revisor escribiendo…" : "Creador escribiendo…"}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-border bg-card flex items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground">
            {finished
              ? "Revisa la propuesta antes de aceptarla."
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

function ChatBubble({ turn }: { turn: Turn }) {
  const isCreator = turn.who === "creator";
  return (
    <div className={`flex items-start gap-2 ${isCreator ? "" : "flex-row-reverse"}`}>
      <div
        className={`grid h-7 w-7 shrink-0 place-items-center rounded-md ${
          isCreator ? "bg-violet-100 text-violet-700" : "bg-emerald-100 text-emerald-700"
        }`}
      >
        <Bot className="h-3.5 w-3.5" />
      </div>
      <div className={`max-w-[78%] ${isCreator ? "" : "text-right"}`}>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-0.5">
          {isCreator ? "Creador" : "Revisor"}
        </div>
        <div
          className={`inline-block rounded-lg px-3 py-2 text-xs leading-relaxed shadow-sm border ${
            isCreator
              ? "bg-card border-border text-slate-700"
              : "bg-emerald-50 border-emerald-200 text-emerald-900"
          }`}
        >
          {turn.text}
        </div>
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="h-1 w-1 rounded-full bg-slate-400 animate-pulse"
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}

/* ============== CODE GENERATION VIEW ============== */
