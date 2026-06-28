import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  Home, Briefcase, Settings, LogOut, User, Sparkles, Plus,
  MoreHorizontal, Sun, Moon, Info,
} from "lucide-react";
import type { View } from "@/lib/types";
import { useVisibleProjects } from "@/hooks/use-project";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { useAgentPrefs } from "@/hooks/use-agents";
import {
  SidebarItem, SidebarProjectRow, MenuItem, ProjectTree,
} from "@/components/kosmo/common";
import {
  HomeView, MyWorkspaceView, NewProjectView, ProfileView, AboutView,
  GlobalSettings, ProjectSettings,
} from "@/components/kosmo/views";
import { Workspace } from "@/components/kosmo/workspace";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KOSMO — Spec-Driven Development" },
      { name: "description", content: "KOSMO is a spec-driven development platform for designing, specifying, and shipping software with AI agents." },
      { property: "og:title", content: "KOSMO — Spec-Driven Development" },
      { property: "og:description", content: "Design, specify, and ship software with AI agents." },
    ],
  }),
  component: KosmoApp,
});

function KosmoApp() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return <div className="grid h-screen place-items-center text-sm text-muted-foreground">Cargando…</div>;
  }
  if (!user) {
    return <Navigate to="/auth" />;
  }
  return <KosmoAppInner onSignOut={async () => { await signOut(); navigate({ to: "/auth" }); }} />;
}

function KosmoAppInner({ onSignOut }: { onSignOut: () => void }) {
  const [view, setView] = useState<View>({ kind: "home" });
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [profileOpen, setProfileOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [chatOpen, setChatOpen] = useState(true);
  const [gitOpen, setGitOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const visibleProjects = useVisibleProjects();
  const [agents] = useAgentPrefs();
  const [profile] = useProfile();
  const openApiKeys = () => setView({ kind: "global-settings", tab: "API Keys" });

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const toggleProject = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));
  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  const initials = (profile.name || "U").split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className={`${theme === "dark" ? "dark" : ""} flex h-screen w-full overflow-hidden bg-card text-foreground font-sans antialiased`}>
      <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-slate-50">
        <div className="flex items-center gap-2 px-4 py-4 border-b border-border">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-semibold tracking-tight">KOSMO</span>
          <span className="ml-auto text-[10px] font-medium text-slate-400 bg-card border border-border px-1.5 py-0.5 rounded">SDD</span>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-3">
          <SidebarItem icon={Home} label="Home" active={view.kind === "home"} onClick={() => setView({ kind: "home" })} />
          <SidebarItem icon={Briefcase} label="My Workspace" active={view.kind === "my-workspace"} onClick={() => setView({ kind: "my-workspace" })} />

          <div className="mt-5 mb-1 px-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Projects</span>
            <button onClick={() => setView({ kind: "new-project" })} className="text-slate-400 hover:text-slate-700" title="New project"><Plus className="h-3.5 w-3.5" /></button>
          </div>

          {visibleProjects.length === 0 && (
            <div className="px-2 py-1.5 text-[11px] italic text-slate-400">Aún no tienes proyectos</div>
          )}
          {visibleProjects.map((p) => {
            const isOpen = !!expanded[p.id];
            return (
              <div key={p.id} className="mb-0.5">
                <SidebarProjectRow project={p} isOpen={isOpen} onToggle={() => toggleProject(p.id)} />
                {isOpen && (
                  <ProjectTree
                    projectId={p.id}
                    view={view}
                    onPick={(specId, doc) => setView({ kind: "workspace", projectId: p.id, specId, doc })}
                    onSettings={() => setView({ kind: "project-settings", projectId: p.id, tab: "General" })}
                    disabled={!agents.configured}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div ref={profileRef} className="relative border-t border-border p-2">
          {profileOpen && (
            <div className="absolute bottom-full left-2 right-2 mb-2 rounded-lg border border-border bg-card p-1.5 shadow-lg">
              <MenuItem icon={User} label="Profile" onClick={() => { setView({ kind: "profile" }); setProfileOpen(false); }} />
              <MenuItem icon={Settings} label="Settings" onClick={() => { setView({ kind: "global-settings", tab: "General" }); setProfileOpen(false); }} />
              <MenuItem icon={Info} label="Acerca de KOSMO" onClick={() => { setView({ kind: "about" }); setProfileOpen(false); }} />
              <div className="my-1 h-px bg-slate-100" />
              <MenuItem icon={LogOut} label="Log out" onClick={() => { setProfileOpen(false); onSignOut(); }} />
            </div>
          )}
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex w-full items-center gap-2.5 rounded-md p-2 hover:bg-white"
          >
            <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xs font-semibold text-white">{initials}</div>
            <div className="text-left min-w-0">
              <div className="truncate text-sm font-medium">{profile.name || "Usuario"}</div>
              <div className="truncate text-[11px] text-muted-foreground">Pro Workspace</div>
            </div>
            <MoreHorizontal className="ml-auto h-4 w-4 text-slate-400" />
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-hidden bg-card flex flex-col">
        <div className="flex items-center justify-end gap-1.5 border-b border-border bg-white/80 backdrop-blur px-4 h-11 shrink-0">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={theme === "light" ? "Switch to dark" : "Switch to light"}
            className="grid h-8 w-8 place-items-center rounded-md text-slate-600 hover:bg-slate-100 transition"
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          {view.kind === "home" && <HomeView onOpenProject={(id) => setView({ kind: "workspace", projectId: id, specId: null, doc: "brief" })} onNew={() => setView({ kind: "new-project" })} onOpenWorkspace={() => setView({ kind: "my-workspace" })} />}
          {view.kind === "my-workspace" && <MyWorkspaceView onOpenProject={(id) => setView({ kind: "workspace", projectId: id, specId: null, doc: "brief" })} onSettings={(id) => setView({ kind: "project-settings", projectId: id, tab: "General" })} onNew={() => setView({ kind: "new-project" })} onConfigureAgents={(id) => setView({ kind: "project-settings", projectId: id, tab: "Coding Agents" })} />}
          {view.kind === "new-project" && <NewProjectView onCreated={() => setView({ kind: "my-workspace" })} />}
          {view.kind === "profile" && <ProfileView />}
          {view.kind === "about" && <AboutView />}
          {view.kind === "global-settings" && <GlobalSettings tab={view.tab} onTab={(t) => setView({ kind: "global-settings", tab: t })} onOpenApiKeys={openApiKeys} />}
          {view.kind === "project-settings" && (
            <ProjectSettings
              projectId={view.projectId}
              tab={view.tab}
              onTab={(t) => setView({ kind: "project-settings", projectId: view.projectId, tab: t })}
              onOpenApiKeys={openApiKeys}
              onDeleted={() => setView({ kind: "home" })}
            />
          )}
          {view.kind === "workspace" && (
            <Workspace
              projectId={view.projectId}
              specId={view.specId}
              doc={view.doc}
              autoStartBrief={!!view.autoStartBrief}
              onNav={(specId, doc) => setView({ kind: "workspace", projectId: view.projectId, specId, doc })}
              onHome={() => setView({ kind: "home" })}
              chatOpen={chatOpen}
              onToggleChat={() => setChatOpen((v) => !v)}
              onCloseChat={() => setChatOpen(false)}
              gitOpen={gitOpen}
              onToggleGit={() => setGitOpen((v) => !v)}
            />
          )}
        </div>
      </main>
    </div>
  );
}

