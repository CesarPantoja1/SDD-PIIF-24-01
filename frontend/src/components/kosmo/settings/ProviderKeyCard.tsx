import { useState, useEffect, useRef } from "react";
import { Cpu, Trash2, RefreshCw, CheckCircle2, XCircle, ExternalLink, Copy, CopyCheck } from "lucide-react";
import type { ProviderKey } from "@/lib/types";
import { PROVIDERS } from "@/lib/constants";
import { Badge } from "@/components/kosmo/common";

type TestResult = { ok: boolean; error?: string | null };

type Props = {
  provider: ProviderKey;
  savedKey: string;
  onSave: (key: string) => Promise<unknown>;
  onDelete: () => Promise<unknown>;
  onTest: (key?: string) => Promise<TestResult>;
  onReveal: () => Promise<{ key: string }>;
};

export function ProviderKeyCard({ provider, savedKey, onSave, onDelete, onTest, onReveal }: Props) {
  const info = PROVIDERS[provider];
  const hasSavedKey = !!savedKey?.trim();

  const [mode, setMode] = useState<"view" | "edit">("view");
  const [draft, setDraft] = useState(savedKey);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDraft(savedKey);
  }, [savedKey]);

  useEffect(() => {
    return () => {
      if (revealTimer.current) clearTimeout(revealTimer.current);
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      setMode("view");
      setTestResult(null);
    } catch (err: any) {
      setTestResult({ ok: false, error: err?.message ?? "Error al guardar" });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const key = mode === "edit" ? draft : undefined;
      const result = await onTest(key);
      setTestResult(result);
    } catch (err: any) {
      setTestResult({ ok: false, error: err?.message ?? "Error al probar conexión" });
    } finally {
      setTesting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete();
      setShowDeleteConfirm(false);
      setMode("view");
      setTestResult(null);
    } catch (err: any) {
      setTestResult({ ok: false, error: err?.message ?? "Error al eliminar" });
    } finally {
      setDeleting(false);
    }
  };

  const handleReveal = async () => {
    if (revealedKey) {
      hideRevealed();
      return;
    }
    setRevealing(true);
    try {
      const res = await onReveal();
      setRevealedKey(res.key);
      if (revealTimer.current) clearTimeout(revealTimer.current);
      revealTimer.current = setTimeout(() => setRevealedKey(null), 30000);
    } catch {
      /* handled by hook */
    } finally {
      setRevealing(false);
    }
  };

  const hideRevealed = () => {
    if (revealTimer.current) clearTimeout(revealTimer.current);
    setRevealedKey(null);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(revealedKey ?? draft);
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard denied */
    }
  };

  const dirty = draft !== savedKey;
  const canSave = draft.trim().length > 0 && dirty;
  const canTest = mode === "view" || draft.trim().length > 0;

  const maskedKey =
    savedKey.length > 8 ? `${savedKey.slice(0, 4)}...${savedKey.slice(-4)}` : "••••••••";

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-indigo-500" />
          <span className="text-sm font-semibold">{info.label}</span>
        </div>
        {hasSavedKey && !testResult?.ok ? (
          <Badge tone="green">Guardada</Badge>
        ) : testResult?.ok ? (
          <Badge tone="green">Key válida</Badge>
        ) : testResult && !testResult.ok ? (
          <Badge tone="red">Key no válida</Badge>
        ) : (
          <Badge tone="slate">Sin configurar</Badge>
        )}
      </div>

      {/* Key display / input */}
      {mode === "view" && hasSavedKey ? (
        <div className="flex items-center gap-2 mb-2">
          <code className="flex-1 rounded-md bg-slate-50 border border-border px-3 py-2 text-sm font-mono text-slate-600 select-all">
            {revealedKey ?? maskedKey}
          </code>
          {revealedKey && (
            <button
              onClick={handleCopy}
              className="grid h-9 w-9 place-items-center rounded-md border border-border hover:bg-slate-50 text-slate-500"
              title="Copiar al portapapeles"
            >
              {copied ? <CopyCheck className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 mb-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setTestResult(null);
            }}
            placeholder={`${info.label} API Key`}
            className="flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            autoComplete="off"
            spellCheck={false}
          />
          {draft.trim().length > 0 && (
            <button
              onClick={handleCopy}
              className="grid h-9 w-9 place-items-center rounded-md border border-border hover:bg-slate-50 text-slate-500"
              title="Copiar al portapapeles"
            >
              {copied ? <CopyCheck className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            </button>
          )}
        </div>
      )}

      {/* Format hint */}
      <p className="text-[11px] text-slate-400 mb-2">
        Formato esperado: <code className="text-slate-500">{info.keyPrefix}...</code>
      </p>

      {/* Test result */}
      {testResult && (
        <div className={`mb-3 rounded-md p-3 text-sm flex items-start gap-2 ${testResult.ok ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-red-200 bg-red-50 text-red-700"}`}>
          {testResult.ok ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" /> : <XCircle className="h-4 w-4 shrink-0 mt-0.5" />}
          <div className="min-w-0">
            <p className="font-medium">{testResult.ok ? "Conexión exitosa" : "Error de conexión"}</p>
            {testResult.error && <p className="text-xs mt-0.5 break-words">{testResult.error}</p>}
          </div>
          <button onClick={() => setTestResult(null)} className="shrink-0 opacity-60 hover:opacity-100">
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Link to provider */}
      <a
        href={info.keyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-700 mb-3"
      >
        Obtener key <ExternalLink className="h-3 w-3" />
      </a>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={handleTest}
          disabled={!canTest || testing}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
        >
          {testing ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              Verificando...
            </>
          ) : (
            <>
              <RefreshCw className="h-3.5 w-3.5" />
              Probar conexión
            </>
          )}
        </button>

        {mode === "view" && hasSavedKey ? (
          <>
            <button
              onClick={() => { setMode("edit"); setTestResult(null); hideRevealed(); }}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Reemplazar
            </button>
            <button
              onClick={handleReveal}
              disabled={revealing}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              {revealing ? "..." : revealedKey ? "Ocultar" : "Revelar"}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Eliminar
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleSave}
              disabled={!canSave || saving}
              className="rounded-md bg-indigo-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
            {mode === "edit" && (
              <button
                onClick={() => { setMode("view"); setDraft(savedKey); setTestResult(null); }}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
            )}
          </>
        )}
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 flex items-start gap-2">
          <div className="flex-1">
            <p className="text-xs font-medium text-red-700">
              ¿Eliminar API Key de {info.label}?
            </p>
            <p className="text-[11px] text-red-600 mt-0.5">
              Los agentes configurados con este proveedor dejarán de funcionar hasta que agregues una nueva key.
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="rounded-md border border-red-200 px-2.5 py-1 text-[11px] font-medium text-red-600 hover:bg-red-100"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-md bg-red-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-red-700 disabled:opacity-40"
            >
              {deleting ? "..." : "Eliminar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
