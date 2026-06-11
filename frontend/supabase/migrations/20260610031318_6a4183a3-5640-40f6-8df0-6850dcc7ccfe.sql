
-- =========================
-- Profiles
-- =========================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles self read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles self upsert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles self update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- =========================
-- Projects
-- =========================
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','archived')),
  tags TEXT[] NOT NULL DEFAULT '{}',
  cost NUMERIC NOT NULL DEFAULT 0,
  tokens INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX projects_owner_idx ON public.projects (owner_id) WHERE deleted_at IS NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects owner all" ON public.projects FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Limit: max 3 active (not soft-deleted) projects per user
CREATE OR REPLACE FUNCTION public.enforce_project_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c INTEGER;
BEGIN
  SELECT COUNT(*) INTO c FROM public.projects
   WHERE owner_id = NEW.owner_id AND deleted_at IS NULL;
  IF c >= 3 THEN
    RAISE EXCEPTION 'Project limit reached (3 max)';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER projects_limit BEFORE INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.enforce_project_limit();

-- =========================
-- Specs
-- =========================
CREATE TABLE public.specs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, slug)
);
CREATE INDEX specs_project_idx ON public.specs (project_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.specs TO authenticated;
GRANT ALL ON public.specs TO service_role;
ALTER TABLE public.specs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "specs via project owner" ON public.specs FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = specs.project_id AND p.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = specs.project_id AND p.owner_id = auth.uid()));

-- =========================
-- Phase state (brief uses spec_id NULL)
-- =========================
CREATE TABLE public.phase_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  spec_id UUID REFERENCES public.specs(id) ON DELETE CASCADE,
  doc TEXT NOT NULL CHECK (doc IN ('brief','requirements','design','tasks','code')),
  generated BOOLEAN NOT NULL DEFAULT false,
  content_md TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX phase_state_unique_with_spec
  ON public.phase_state (project_id, spec_id, doc) WHERE spec_id IS NOT NULL;
CREATE UNIQUE INDEX phase_state_unique_brief
  ON public.phase_state (project_id, doc) WHERE spec_id IS NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.phase_state TO authenticated;
GRANT ALL ON public.phase_state TO service_role;
ALTER TABLE public.phase_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "phase_state via project owner" ON public.phase_state FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = phase_state.project_id AND p.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = phase_state.project_id AND p.owner_id = auth.uid()));

-- =========================
-- Agent configs (global or per-project)
-- =========================
CREATE TABLE public.agent_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  config JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX agent_configs_global ON public.agent_configs (owner_id) WHERE project_id IS NULL;
CREATE UNIQUE INDEX agent_configs_project ON public.agent_configs (owner_id, project_id) WHERE project_id IS NOT NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_configs TO authenticated;
GRANT ALL ON public.agent_configs TO service_role;
ALTER TABLE public.agent_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_configs owner" ON public.agent_configs FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- =========================
-- Agent prompts
-- =========================
CREATE TABLE public.agent_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  slot TEXT NOT NULL,
  template_md TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX agent_prompts_global ON public.agent_prompts (owner_id, slot) WHERE project_id IS NULL;
CREATE UNIQUE INDEX agent_prompts_project ON public.agent_prompts (owner_id, project_id, slot) WHERE project_id IS NOT NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_prompts TO authenticated;
GRANT ALL ON public.agent_prompts TO service_role;
ALTER TABLE public.agent_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_prompts owner" ON public.agent_prompts FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- =========================
-- API keys
-- =========================
CREATE TABLE public.api_keys (
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('deepseek','google','openai','anthropic')),
  key TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, provider)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_keys TO authenticated;
GRANT ALL ON public.api_keys TO service_role;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "api_keys owner" ON public.api_keys FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- =========================
-- updated_at trigger function
-- =========================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER projects_set_updated BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER phase_state_set_updated BEFORE UPDATE ON public.phase_state FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER agent_configs_set_updated BEFORE UPDATE ON public.agent_configs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER agent_prompts_set_updated BEFORE UPDATE ON public.agent_prompts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER api_keys_set_updated BEFORE UPDATE ON public.api_keys FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================
-- Handle new user: profile (agent_configs default is created lazily client-side)
-- =========================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
