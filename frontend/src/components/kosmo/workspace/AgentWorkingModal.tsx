import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export function AgentWorkingModal({ mode, toLabel, onDone }: { mode: "generate" | "regenerate"; toLabel: string; onDone: () => void; onCancel: () => void }) {
  const verb = mode === "regenerate" ? "Regenerando" : "Generando";
  const TOTAL_MS = 3200;

  useEffect(() => {
    const t = setTimeout(() => {
      onDone();
    }, TOTAL_MS);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 backdrop-blur-sm p-4 transition-all">
      <div className="w-full max-w-xs rounded-2xl bg-card shadow-2xl border border-border p-8 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-200">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-500 mb-5" />
        <h3 className="text-lg font-semibold text-slate-800 tracking-tight">{verb}…</h3>
        <p className="mt-1.5 text-sm text-muted-foreground">{toLabel}</p>
      </div>
    </div>
  );
}

/* ============== CODE GENERATION VIEW ============== */

