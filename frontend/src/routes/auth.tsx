import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "KOSMO — Acceso" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [user, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pwd });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email, password: pwd,
          options: { data: { display_name: name || email.split("@")[0] } },
        });
        if (error) throw error;
      }
      navigate({ to: "/" });
    } catch (e: any) {
      setErr(e.message ?? "Error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid place-items-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-semibold tracking-tight text-lg">KOSMO</span>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex border-b border-border mb-5">
            {(["login", "register"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} className={`relative flex-1 px-3 py-2.5 text-sm font-medium ${mode === m ? "text-indigo-700" : "text-muted-foreground hover:text-slate-700"}`}>
                {m === "login" ? "Iniciar sesión" : "Crear cuenta"}
                {mode === m && <span className="absolute inset-x-3 -bottom-px h-0.5 bg-indigo-600" />}
              </button>
            ))}
          </div>
          <form onSubmit={submit} className="space-y-3">
            {mode === "register" && (
              <div>
                <label className="text-xs font-medium text-slate-600">Nombre</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500" />
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-slate-600">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Contraseña</label>
              <input type="password" required minLength={6} value={pwd} onChange={(e) => setPwd(e.target.value)} className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500" />
            </div>
            {err && <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{err}</div>}
            <button type="submit" disabled={busy} className="w-full rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50">
              {busy ? "Procesando…" : mode === "login" ? "Entrar" : "Crear cuenta"}
            </button>
          </form>
        </div>
        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          Prototipo · datos persistidos en Lovable Cloud
        </p>
      </div>
    </div>
  );
}
