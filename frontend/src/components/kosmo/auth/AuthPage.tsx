import { useState } from "react";
import { Sparkles, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

type Mode = "login" | "register";

export function AuthPage() {
  const { t, i18n } = useTranslation();
  const [langOpen, setLangOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: displayName || email.split("@")[0] },
          },
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err?.message ?? t("auth.errorGeneric", "Algo salió mal"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50 px-4 relative">
      {/* Language Switcher */}
      <div className="absolute top-4 right-4">
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
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-semibold tracking-tight text-xl">KOSMO</span>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex rounded-md border border-border bg-slate-50 p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-[5px] py-1.5 transition ${mode === "login" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              {t("auth.login", "Iniciar sesión")}
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 rounded-[5px] py-1.5 transition ${mode === "register" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              {t("auth.register", "Crear cuenta")}
            </button>
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "register" && (
              <div>
                <label className="text-xs font-medium text-slate-600">{t("auth.name", "Nombre")}</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t("auth.namePlaceholder", "Cesar Pantoja")}
                  className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                />
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-slate-600">{t("auth.email", "Email")}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth.emailPlaceholder", "tu@email.com")}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">{t("auth.password", "Contraseña")}</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("auth.passwordPlaceholder", "••••••••")}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              />
            </div>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? t("auth.processing", "Procesando…") : mode === "login" ? t("auth.login", "Iniciar sesión") : t("auth.register", "Crear cuenta")}
            </button>
          </form>
        </div>
        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          {t("auth.footer", "KOSMO — plataforma SDD interna · Prototipo")}
        </p>
      </div>
    </div>
  );
}
