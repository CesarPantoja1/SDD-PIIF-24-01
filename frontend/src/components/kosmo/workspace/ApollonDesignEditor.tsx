import { useState, useEffect, useRef, useCallback } from "react";
import {
  FileText, Sparkles, Copy, Download, Maximize2, Save,
  PanelLeft, MessageSquare, Layers, Loader2,
} from "lucide-react";
import type { DocKey } from "@/lib/types";
import { IconBtn, Badge } from "@/components/kosmo/common";
import { MOCK_VARIANTS, variantIndexFromSpecNames } from "@/lib/mock-data";
import { useProjectSpecs } from "@/hooks/use-project";

/**
 * ApollonDesignEditor — replaces the markdown PhaseEditor for the "design" phase.
 *
 * It dynamically imports @tumaet/apollon (standalone build that bundles its own
 * React 18 internally) and mounts an interactive class-diagram canvas.
 *
 * The diagram model (JSON) is persisted in localStorage per project+scope.
 * When no saved model exists, it loads the hardcoded MOCK_DESIGN_JSON.
 */
export function ApollonDesignEditor({
  projectId,
  scopeKey,
  specName,
  chatOpen,
  onToggleChat,
  outlineOpen,
  onToggleOutline,
  onRegenerate,
  isGenerated,
}: {
  projectId: string;
  scopeKey: string;
  specName: string | null;
  chatOpen: boolean;
  onToggleChat: () => void;
  outlineOpen: boolean;
  onToggleOutline: () => void;
  onRegenerate: () => void;
  isGenerated: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);

  const storageKey = `kosmo.apollon.${projectId}.${scopeKey}`;
  const [allSpecs] = useProjectSpecs(projectId);
  const variantIdx = variantIndexFromSpecNames((allSpecs ?? []).map((s) => s.name));
  const variant = MOCK_VARIANTS[variantIdx] ?? MOCK_VARIANTS[0];
  const perSpecDesign = specName ? variant.designBySpec?.[specName] : undefined;
  const designJson = perSpecDesign ?? variant.designJson;


  // Mount / unmount the Apollon editor
  useEffect(() => {
    if (!containerRef.current) return;
    let destroyed = false;

    setLoading(true);

    // Dynamic import to avoid loading ~2.4 MB upfront
    import("@tumaet/apollon").then((apollon) => {
      if (destroyed || !containerRef.current) return;
      
      if (!isGenerated) {
        setLoading(false);
        return;
      }

      const { ApollonEditor, UMLDiagramType, ApollonMode, Locale } = apollon;

      // Restore previous model from localStorage (if any),
      // falling back to the hardcoded mock design JSON.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let savedModel: any;
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) savedModel = JSON.parse(raw);
      } catch {
        /* ignore corrupt data */
      }
      
      // If there's no model, or if the model is practically empty (no nodes),
      // force the use of the hardcoded design JSON.
      if (!savedModel || !Array.isArray(savedModel.nodes) || savedModel.nodes.length === 0) {
        savedModel = designJson;
      }

      const options: Record<string, unknown> = {
        type: UMLDiagramType.ClassDiagram,
        mode: ApollonMode.Modelling,
        locale: Locale.en,
      };
      if (savedModel) {
        options.model = savedModel;
      }

      const editor = new ApollonEditor(containerRef.current!, options);
      editorRef.current = editor;

      // Auto-save on every model change
      editor.subscribeToModelChange((model: unknown) => {
        try {
          localStorage.setItem(storageKey, JSON.stringify(model));
        } catch {
          /* quota exceeded — silently skip */
        }
        setDirty(true);
      });

      setLoading(false);
    });

    return () => {
      destroyed = true;
      editorRef.current?.destroy();
      editorRef.current = null;
    };
  }, [storageKey, designJson, isGenerated]);

  // Manual save (explicit click — model is already auto-persisted, this is UX feedback)
  const onSave = useCallback(() => {
    if (!editorRef.current) return;
    try {
      const model = editorRef.current.model;
      localStorage.setItem(storageKey, JSON.stringify(model));
    } catch { /* ignore */ }
    setDirty(false);
  }, [storageKey]);

  // Export as SVG
  const onExportSvg = useCallback(async () => {
    if (!editorRef.current) return;
    try {
      const svg = await editorRef.current.exportAsSVG();
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `design-${specName ?? "diagram"}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export SVG:", err);
    }
  }, [specName]);

  // Copy model JSON to clipboard
  const onCopyModel = useCallback(() => {
    if (!editorRef.current) return;
    const json = JSON.stringify(editorRef.current.model, null, 2);
    navigator.clipboard?.writeText(json);
  }, []);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-emerald-600" />
          <span className="text-sm font-semibold text-slate-800">Diagrama de Clases</span>
          {specName && <span className="text-[11px] text-slate-400">· {specName}</span>}
          {dirty && <Badge tone="amber">Sin guardar</Badge>}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleChat}
            title={chatOpen ? "Cerrar chat IA" : "Abrir chat IA"}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium ${chatOpen ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-100"}`}
          >
            <MessageSquare className="h-3.5 w-3.5" /> Chat IA
          </button>
          <div className="mx-1 h-5 w-px bg-slate-200" />
          <IconBtn title="Copiar modelo" onClick={onCopyModel}><Copy className="h-4 w-4" /></IconBtn>
          <IconBtn title="Exportar SVG" onClick={onExportSvg}><Download className="h-4 w-4" /></IconBtn>
          <IconBtn title="Expandir"><Maximize2 className="h-4 w-4" /></IconBtn>
          {dirty && (
            <button
              onClick={onSave}
              className="ml-1 inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              <Save className="h-3.5 w-3.5" /> Guardar
            </button>
          )}
        </div>
      </div>

      {/* Canvas container */}
      <div className="flex-1 min-h-0 relative">
        {loading && isGenerated && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-white/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
              <span className="text-sm text-slate-500 font-medium">Cargando editor de diagramas…</span>
            </div>
          </div>
        )}
        {!isGenerated && !loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-card text-center p-6">
            <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <Layers className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-medium text-slate-800">Diagrama vacío</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-sm">
              Este diagrama aún no ha sido generado. Usa el botón "Generar" en la parte inferior para que la IA proponga la arquitectura inicial.
            </p>
          </div>
        )}
        {isGenerated && (
          <div
            ref={containerRef}
            className="h-full w-full"
            style={{ minHeight: "400px" }}
          />
        )}
      </div>
    </div>
  );
}
