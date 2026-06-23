-- KOSMO: agent_configs table for per-user agent configuration.
-- Each user can override the default provider, model, and system prompt per slot.

CREATE TABLE IF NOT EXISTS public.agent_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    slot_key TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    system_prompt TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, slot_key)
);

ALTER TABLE public.agent_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_configs_select_own" ON public.agent_configs
    FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "agent_configs_insert_own" ON public.agent_configs
    FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "agent_configs_update_own" ON public.agent_configs
    FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id);

GRANT SELECT, INSERT, UPDATE ON public.agent_configs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_configs TO service_role;
