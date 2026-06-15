import {
  Sparkles, Github, Heart, GraduationCap, Scale, FileText, Layers, Bot,
  ShieldCheck, Mail, ExternalLink, Code2, Wand2,
} from "lucide-react";

export function AboutView() {
  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-slate-50 to-white">
      <div className="w-full px-8 lg:px-12 py-10">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 text-white p-10 shadow-lg">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.15]"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />
          <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-fuchsia-400/25 blur-3xl" />
          <div className="relative flex items-start gap-5">
            <div className="grid h-14 w-14 place-items-center rounded-xl bg-white/15 backdrop-blur border border-white/20">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/70">Acerca de</div>
              <h1 className="mt-1 text-4xl font-semibold tracking-tight">KOSMO</h1>
              <p className="mt-3 text-base text-white/85 max-w-2xl">
                Plataforma de Spec-Driven Development y Vibe Modeling que orquesta
                agentes IA para llevar tus ideas desde el descubrimiento hasta el código.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/15 backdrop-blur border border-white/20 px-2.5 py-1 text-[11px] font-medium">
                  v1.0.0 · Prototipo
                </span>
                <span className="rounded-full bg-white/15 backdrop-blur border border-white/20 px-2.5 py-1 text-[11px] font-medium">
                  Licencia MIT
                </span>
                <span className="rounded-full bg-white/15 backdrop-blur border border-white/20 px-2.5 py-1 text-[11px] font-medium">
                  Proyecto académico
                </span>
                <span className="rounded-full bg-white/15 backdrop-blur border border-white/20 px-2.5 py-1 text-[11px] font-medium">
                  SDD + Vibe Modeling
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Credits grid */}
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {/* University */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 text-indigo-700">
              <GraduationCap className="h-4 w-4" />
              <h2 className="text-sm font-semibold tracking-wide uppercase">Universidad</h2>
            </div>
            <div className="mt-3">
              <div className="text-lg font-semibold tracking-tight">Escuela Politécnica Nacional</div>
              <div className="text-sm text-muted-foreground">EPN · Quito, Ecuador</div>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Proyecto desarrollado en el marco de la Facultad de Ingeniería en
                Sistemas como exploración aplicada de metodologías SDD, Vibe Modeling
                y agentes de IA generativa.
              </p>
              <a
                href="https://www.epn.edu.ec"
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                epn.edu.ec <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </section>

          {/* License */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 text-indigo-700">
              <Scale className="h-4 w-4" />
              <h2 className="text-sm font-semibold tracking-wide uppercase">Licencia MIT</h2>
            </div>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              KOSMO se distribuye bajo licencia MIT. Eres libre de usar, copiar,
              modificar, fusionar, publicar, distribuir y sublicenciar el código,
              siempre que se conserve el aviso de copyright.
            </p>
            <pre className="mt-3 rounded-md border border-border bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-600 font-mono whitespace-pre-wrap">
{`MIT License

Copyright (c) ${new Date().getFullYear()} KOSMO — EPN

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction…`}
            </pre>
          </section>
        </div>

        {/* Stack */}
        <section className="mt-4 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-700">
            <Code2 className="h-4 w-4" />
            <h2 className="text-sm font-semibold tracking-wide uppercase">Stack tecnológico</h2>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[
              { k: "Frontend", v: "React 19 · TanStack Start · Tailwind v4" },
              { k: "Backend", v: "FastAPI (Python) · Pydantic" },
              { k: "Base de datos", v: "Supabase · PostgreSQL · RLS" },
              { k: "Auth", v: "Supabase Auth (email + password)" },
              { k: "IA", v: "Multi-proveedor: OpenAI, Anthropic, Google, DeepSeek" },
              { k: "Diseño UML", v: "Apollon Editor" },
              { k: "Iconografía", v: "Lucide React" },
              { k: "Deploy", v: "Edge · Cloudflare Workers" },
            ].map((s) => (
              <div key={s.k} className="rounded-lg border border-border bg-slate-50/60 px-3 py-2.5">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{s.k}</div>
                <div className="mt-0.5 text-sm text-slate-700">{s.v}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features mini-grid */}
        <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {[
            { icon: FileText, k: "Specs vivas", d: "Brief → Requirements → Tasks." },
            { icon: Layers, k: "Diseño UML", d: "Editor de diagramas integrado." },
            { icon: Bot, k: "Agentes por etapa", d: "Creador y revisor configurables." },
            { icon: Wand2, k: "Vibe Modeling", d: "Itera diseño y código por intención." },
            { icon: ShieldCheck, k: "Bring your own key", d: "Tus credenciales, tu control." },
          ].map((f) => (
            <div key={f.k} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                <f.icon className="h-4 w-4" />
              </div>
              <div className="mt-3 text-sm font-semibold">{f.k}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{f.d}</div>
            </div>
          ))}
        </section>

        {/* Team / contact */}
        <section className="mt-4 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-700">
            <Heart className="h-4 w-4" />
            <h2 className="text-sm font-semibold tracking-wide uppercase">Créditos</h2>
          </div>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            Diseño, ingeniería y especificación de KOSMO por el equipo de
            estudiantes e investigadores de la <strong>Escuela Politécnica Nacional</strong>.
            Gracias al cuerpo docente que acompañó el proceso de exploración del
            paradigma SDD y la práctica de Vibe Modeling.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href="https://github.com/CesarPantoja1/SDD-PIIF-24-01"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Github className="h-3.5 w-3.5" /> Repositorio
            </a>
            <a
              href="mailto:kosmo@epn.edu.ec"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Mail className="h-3.5 w-3.5" /> Contacto
            </a>
          </div>
        </section>

        <p className="mt-8 text-center text-[11px] text-muted-foreground">
          Hecho en Quito · © {new Date().getFullYear()} KOSMO
        </p>
      </div>
    </div>
  );
}
