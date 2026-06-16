import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, Eye, EyeOff, FileText, Layers, Bot, ShieldCheck, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api/client";
import type { AuthSessionResponse } from "@/lib/api/api";

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
  const [showPwd, setShowPwd] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [user, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setInfo(null); setBusy(true);
    try {
      let session: AuthSessionResponse;
      if (mode === "login") {
        // Route through FastAPI backend — it validates credentials and returns tokens
        session = await apiClient.post<AuthSessionResponse>("/auth/login", {
          email,
          password: pwd,
        });
      } else {
        // Route through FastAPI backend — it creates the user + profile row
        session = await apiClient.post<AuthSessionResponse>("/auth/register", {
          email,
          password: pwd,
          display_name: name.trim() || email.split("@")[0],
        });
      }

      // Sync the session into the Supabase client so useAuth() sees the user
      if (session.access_token && session.refresh_token) {
        await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });
      }

      navigate({ to: "/" });
    } catch (e: any) {
      setErr(e.message ?? "Error desconocido");
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    setErr(null); setInfo(null);
    if (!email) { setErr("Ingresa tu correo para recuperar la contraseña."); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) setErr(error.message);
    else setInfo("Te enviamos un enlace para restablecer tu contraseña.");
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-white text-slate-900 font-sans antialiased">
      {/* Left brand pane */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 text-white p-10">
        {/* dotted pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        {/* glow */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-fuchsia-400/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 backdrop-blur border border-white/20 shadow-lg">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-semibold tracking-tight">KOSMO</div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/70">Spec-Driven Development</div>
          </div>
        </div>

        <div className="relative flex-1 flex items-center justify-center">
          <div className="max-w-md text-center">
            <h1 className="text-5xl font-semibold leading-[1.05] tracking-tight">
              De una <span className="italic font-light">idea</span> al <span className="italic font-light"> código</span>,
              <br /> con <span className="text-white/90">agentes IA.</span>
            </h1>
            <p className="mt-6 text-base text-white/80 mx-auto max-w-sm">
              KOSMO orquesta el ciclo SDD y la práctica de Vibe Modeling — descubrimiento,
              requisitos, diseño y tareas — en un solo espacio colaborativo.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3 mx-auto max-w-sm">
              {[
                { icon: FileText, label: "Specs vivas" },
                { icon: Layers, label: "Diseño Apollon" },
                { icon: Bot, label: "Agentes por etapa" },
                { icon: Wand2, label: "Vibe Modeling" },
                { icon: ShieldCheck, label: "Tu API key, tu control" },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 backdrop-blur px-3 py-2 text-xs text-left">
                  <f.icon className="h-3.5 w-3.5 text-white/80 shrink-0" />
                  <span className="text-white/90 font-medium">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative text-[11px] text-white/60">
          © {new Date().getFullYear()} KOSMO · Proyecto académico EPN
        </div>
      </div>

      {/* Right form pane */}
      <div className="flex items-center justify-center px-6 py-10 sm:px-12">
        <div className="w-full max-w-sm">
          {/* mobile brand */}
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-semibold tracking-tight">KOSMO</span>
          </div>

          <h2 className="text-3xl font-semibold tracking-tight">
            {mode === "login" ? "Bienvenido de vuelta" : "Crea tu cuenta"}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {mode === "login"
              ? "Accede a tu workspace de specs y agentes."
              : "Empieza a construir software guiado por specs."}
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1.5">Nombre completo</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Cesar Pantoja"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 focus:bg-white transition"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1.5">Correo electrónico</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full rounded-lg border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 focus:bg-white transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  required
                  minLength={6}
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  placeholder={mode === "register" ? "Mínimo 8 caracteres" : "••••••••"}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 pr-10 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute inset-y-0 right-0 grid w-10 place-items-center text-slate-400 hover:text-slate-600"
                  aria-label="Mostrar contraseña"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {mode === "login" && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={forgot}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            {err && <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{err}</div>}
            {info && <div className="rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-700">{info}</div>}

            <button
              type="submit"
              disabled={busy}
              className="group relative w-full overflow-hidden rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:shadow-xl hover:shadow-indigo-600/30 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-60 transition"
            >
              {busy ? "Procesando…" : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
            </button>

            {mode === "register" && (
              <p className="text-center text-[11px] text-slate-500 leading-relaxed">
                Al registrarte aceptas el uso académico de KOSMO bajo licencia MIT.
              </p>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            {mode === "login" ? (
              <>
                ¿No tienes una cuenta?{" "}
                <button onClick={() => { setMode("register"); setErr(null); setInfo(null); }} className="font-semibold text-indigo-600 hover:text-indigo-700">
                  Regístrate gratis
                </button>
              </>
            ) : (
              <>
                ¿Ya tienes una cuenta?{" "}
                <button onClick={() => { setMode("login"); setErr(null); setInfo(null); }} className="font-semibold text-indigo-600 hover:text-indigo-700">
                  Inicia sesión
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
