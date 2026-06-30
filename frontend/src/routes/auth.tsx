import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, Eye, EyeOff, FileText, Layers, Bot, ShieldCheck, Wand2, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api/client";
import type { AuthSessionResponse } from "@/lib/api/api";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "KOSMO — Acceso" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { t, i18n } = useTranslation();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [langOpen, setLangOpen] = useState(false);
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
      setErr(e.message ?? t("auth.errorGeneric", "Error desconocido"));
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    setErr(null); setInfo(null);
    if (!email) { setErr(t("auth.enterEmailToReset", "Ingresa tu correo para recuperar la contraseña.")); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) setErr(error.message);
    else setInfo(t("auth.resetLinkSent", "Te enviamos un enlace para restablecer tu contraseña."));
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
              {t("auth.heroTitlePrefix", "De una ")}<span className="italic font-light">{t("auth.heroTitleIdea", "idea")}</span>{t("auth.heroTitleTo", " al ")}<span className="italic font-light">{t("auth.heroTitleCode", "código")}</span>{t("auth.heroTitleSuffix", ",")}
              <br /> {t("auth.heroTitleSuffix2", "con ")}<span className="text-white/90">{t("auth.heroTitleAgents", "agentes IA.")}</span>
            </h1>
            <p className="mt-6 text-base text-white/80 mx-auto max-w-sm">
              {t("auth.heroDesc", "KOSMO orquesta el ciclo SDD y la práctica de Vibe Modeling — descubrimiento, requisitos, diseño y tareas — en un solo espacio colaborativo.")}
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3 mx-auto max-w-sm">
              {[
                { icon: FileText, label: t("auth.featSpecs", "Specs vivas") },
                { icon: Layers, label: t("auth.featDesign", "Diseño Apollon") },
                { icon: Bot, label: t("auth.featAgents", "Agentes por etapa") },
                { icon: Wand2, label: t("auth.featVibe", "Vibe Modeling") },
                { icon: ShieldCheck, label: t("auth.featControl", "Tu API key, tu control") },
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
          {t("auth.copyright", "© {{year}} KOSMO · Proyecto académico EPN", { year: new Date().getFullYear() })}
        </div>
      </div>

      {/* Right form pane */}
      <div className="flex items-center justify-center px-6 py-10 sm:px-12 relative">
        {/* Language Switcher */}
        <div className="absolute top-6 right-6">
          {langOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
              <div className="absolute top-full right-0 mt-2 w-48 rounded-lg border border-border bg-card p-1.5 shadow-lg z-50">
                <button
                  onClick={() => {
                    i18n.changeLanguage("es");
                    localStorage.setItem("kosmo_lang", "es");
                    setLangOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-100 ${i18n.language === "es" ? "bg-slate-50 font-medium text-slate-900" : "text-slate-600"}`}
                >
                  <img src="https://flagcdn.com/w20/es.png" srcSet="https://flagcdn.com/w40/es.png 2x" width="20" alt="ES" className="rounded-[2px] shadow-[0_0_2px_rgba(0,0,0,0.2)]" />
                  <span>Español</span>
                </button>
                <button
                  onClick={() => {
                    i18n.changeLanguage("en");
                    localStorage.setItem("kosmo_lang", "en");
                    setLangOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-100 ${i18n.language === "en" ? "bg-slate-50 font-medium text-slate-900" : "text-slate-600"}`}
                >
                  <img src="https://flagcdn.com/w20/us.png" srcSet="https://flagcdn.com/w40/us.png 2x" width="20" alt="US" className="rounded-[2px] shadow-[0_0_2px_rgba(0,0,0,0.2)]" />
                  <span>English</span>
                </button>
              </div>
            </>
          )}
          <button
            onClick={() => setLangOpen((v) => !v)}
            className={`flex items-center justify-center gap-1 h-8 px-2 rounded-md border border-border text-xs shadow-sm transition ${langOpen ? "bg-slate-100 text-slate-900" : "bg-card text-slate-700 hover:bg-slate-50"}`}
          >
            <img src={i18n.language === "es" ? "https://flagcdn.com/w20/es.png" : "https://flagcdn.com/w20/us.png"} srcSet={i18n.language === "es" ? "https://flagcdn.com/w40/es.png 2x" : "https://flagcdn.com/w40/us.png 2x"} width="20" alt={i18n.language?.toUpperCase() || "EN"} className="rounded-[2px] shadow-[0_0_2px_rgba(0,0,0,0.2)]" />
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>
        </div>

        <div className="w-full max-w-sm">
          {/* mobile brand */}
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-semibold tracking-tight">KOSMO</span>
          </div>

          <h2 className="text-3xl font-semibold tracking-tight">
            {mode === "login" ? t("auth.welcomeBack", "Bienvenido de vuelta") : t("auth.createAccountTitle", "Crea tu cuenta")}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {mode === "login"
              ? t("auth.loginSub", "Accede a tu workspace de specs y agentes.")
              : t("auth.registerSub", "Empieza a construir software guiado por specs.")}
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1.5">{t("auth.fullName", "Nombre completo")}</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("auth.namePlaceholder", "César Pantoja")}
                  className="w-full rounded-md border border-slate-200 px-3.5 py-2.5 text-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1.5">{t("auth.emailLabel", "Correo electrónico")}</label>
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-800">{t("auth.passwordLabel", "Contraseña")}</label>
              </div>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  required
                  minLength={6}
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-md border border-slate-200 pl-3.5 pr-10 py-2.5 text-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
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
              <div className="flex justify-end mt-2">
                <button type="button" onClick={forgot} className="text-xs font-medium text-indigo-600 hover:text-indigo-500">
                  {t("auth.forgotPassword", "¿Olvidaste tu contraseña?")}
                </button>
              </div>
            )}

            {err && <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{err}</div>}
            {info && <div className="rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-700">{info}</div>}

            <div className="pt-2">
              <button
                type="submit"
                disabled={busy}
                className="w-full flex justify-center items-center rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors disabled:opacity-70"
              >
                {busy ? (
                  <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : mode === "login" ? (
                  t("auth.loginBtn", "Iniciar sesión")
                ) : (
                  t("auth.registerBtn", "Crear cuenta")
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center text-sm text-slate-600">
            {mode === "login" ? (
              <>
                {t("auth.noAccount", "¿No tienes una cuenta?")}{" "}
                <button onClick={() => { setMode("register"); setErr(null); setInfo(null); }} className="font-semibold text-indigo-600 hover:text-indigo-500">
                  {t("auth.registerFree", "Regístrate gratis")}
                </button>
              </>
            ) : (
              <>
                {t("auth.hasAccount", "¿Ya tienes una cuenta?")}{" "}
                <button onClick={() => { setMode("login"); setErr(null); setInfo(null); }} className="font-semibold text-indigo-600 hover:text-indigo-500">
                  {t("auth.loginNow", "Inicia sesión")}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
