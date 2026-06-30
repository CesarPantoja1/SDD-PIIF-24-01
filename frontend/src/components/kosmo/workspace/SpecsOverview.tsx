import { useState } from "react";
import {
  Layers, Sparkles, ArrowRight, CheckCircle2, Circle,
  ClipboardList, Terminal, Compass,
} from "lucide-react";
import type { DocKey, SpecRef } from "@/lib/types";
import { DOCS, SPEC_DOCS } from "@/lib/constants";
import { docKey } from "@/lib/storage";
import { Badge } from "@/components/kosmo/common";

import { useTranslation } from "react-i18next";

/* ── Helpers ── */

const PHASE_INDICATORS: { key: DocKey; label: string; color: string }[] = [
  { key: "requirements", label: "R", color: "indigo" },
  { key: "design",       label: "D", color: "emerald" },
  { key: "tasks",        label: "T", color: "amber" },
  { key: "code",         label: "C", color: "violet" },
];

/* ── Main Component ── */

export function SpecsOverview({
  projectId,
  specs,
  generated,
  generatedLoaded,
  onNavigateSpec,
  onGenerateSpecs,
}: {
  projectId: string;
  specs: SpecRef[];
  generated: Record<string, boolean>;
  generatedLoaded: boolean;
  onNavigateSpec: (specId: string, doc: DocKey) => void;
  onGenerateSpecs: () => void;
}) {
  const { t } = useTranslation();
  const hasSpecs = specs.length > 0;

  /* ── Empty State ── */
  if (!hasSpecs) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 py-16">
        {/* Decorative icon */}
        <div className="relative mb-6">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 grid place-items-center shadow-sm">
            <Layers className="h-10 w-10 text-indigo-500" />
          </div>
          <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-lg bg-emerald-100 grid place-items-center shadow-sm border-2 border-white">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
          </div>
        </div>

        <h2 className="text-xl font-semibold text-slate-800 tracking-tight">
          {t('workspace.specsTitle')}
        </h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
          {t('workspace.specsDesc')}
        </p>

        <p className="mt-8 text-xs text-slate-400">
          {t('workspace.specsFooter')}
        </p>
      </div>
    );
  }

  /* ── Cards Grid ── */
  return (
    <div className="h-full overflow-y-auto kosmo-scroll px-2 py-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 px-2">
          <h2 className="text-lg font-semibold text-slate-800 tracking-tight">
            {t('workspace.productSpecs')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('workspace.modulesIdentified', { count: specs.length })}
          </p>
        </div>

        {/* List Layout (Rows) */}
        <div className="flex flex-col space-y-4 px-2">
          {specs.map((spec) => {
            const completedPhases = SPEC_DOCS.filter(
              (dk) => generatedLoaded && !!generated[docKey(spec.id, dk)]
            ).length;
            const totalPhases = SPEC_DOCS.length;
            const allDone = completedPhases === totalPhases;
            const progressPercent = Math.round((completedPhases / totalPhases) * 100);

            const handleSpecClick = () => {
              // Expand the spec folder in the sidebar
              const storageKey = `kosmo.project.${projectId}.openSpecs`;
              try {
                const current = JSON.parse(localStorage.getItem(storageKey) || "{}");
                const next = { ...current, [spec.id]: true };
                localStorage.setItem(storageKey, JSON.stringify(next));
                window.dispatchEvent(new CustomEvent("kosmo:local", { detail: { key: storageKey, value: next } }));
              } catch (err) {
                console.error("Failed to update openSpecs", err);
              }
              // Navigate to requirements
              onNavigateSpec(spec.id, "requirements");
            };

            return (
              <button
                key={spec.id}
                onClick={handleSpecClick}
                className="group relative flex flex-col sm:flex-row sm:items-center justify-between text-left rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md hover:border-indigo-200 hover:ring-1 hover:ring-indigo-100 transition-all duration-200 active:scale-[0.99] gap-6"
              >
                {/* Left side: Icon + Title + Description */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl transition ${
                    allDone
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100"
                  }`}>
                    {allDone
                      ? <CheckCircle2 className="h-6 w-6" />
                      : <ClipboardList className="h-6 w-6" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors">
                      {spec.name}
                    </h3>
                    {spec.description && (
                      <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                        {spec.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right side: Progress + Indicators */}
                <div className="flex flex-col sm:items-end shrink-0 w-full sm:w-64 gap-3 border-t sm:border-t-0 sm:border-l border-border pt-4 sm:pt-0 sm:pl-6 mt-2 sm:mt-0">
                  {/* Progress bar */}
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                        {t('workspace.progress', 'Progreso')}
                      </span>
                      <span className={`text-[11px] font-bold ${
                        allDone ? "text-emerald-600" : "text-slate-600"
                      }`}>
                        {completedPhases}/{totalPhases} {t('workspace.phases', 'Fases')}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          allDone ? "bg-emerald-500" : "bg-indigo-500"
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Phase indicators */}
                  <div className="flex items-center gap-1.5 justify-end">
                    {PHASE_INDICATORS.map(({ key, label, color }) => {
                      const isGen = generatedLoaded && !!generated[docKey(spec.id, key)];
                      return (
                        <div
                          key={key}
                          title={`${DOCS[key].label}: ${isGen ? t('workspace.generated', 'Generado') : t('workspace.pending', 'Pendiente')}`}
                          className={`grid h-7 w-7 place-items-center rounded-lg text-xs font-bold transition ${
                            isGen
                              ? `bg-${color}-100 text-${color}-700 ring-1 ring-${color}-200`
                              : "bg-slate-50 text-slate-300 border border-slate-100"
                          }`}
                        >
                          {label}
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Arrow indicator on hover */}
                <div className="absolute right-5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200 hidden sm:block pointer-events-none">
                   <ArrowRight className="h-5 w-5 text-indigo-400" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
