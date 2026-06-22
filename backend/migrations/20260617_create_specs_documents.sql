-- KOSMO: specs and documents tables for AI-generated content.
-- specs: named groupings within a project (one project has many specs).
-- documents: generated content for each SDD phase (brief, requirements, design, tasks, code).
--   doc_key discriminates the phase; spec_id is NULL for project-level brief.

create table if not exists public.specs (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references public.projects(id) on delete cascade,
    name text not null check (char_length(trim(name)) between 1 and 200),
    description text not null default '',
    position int not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists specs_project_position_idx
    on public.specs (project_id, position);

drop trigger if exists specs_set_updated_at on public.specs;
create trigger specs_set_updated_at
    before update on public.specs
    for each row execute function public.set_updated_at();

create table if not exists public.documents (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references public.projects(id) on delete cascade,
    spec_id uuid references public.specs(id) on delete cascade,
    doc_key text not null check (doc_key in ('brief', 'requirements', 'design', 'tasks', 'code')),
    content text not null default '',
    generated boolean not null default false,
    tokens_used bigint not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (project_id, spec_id, doc_key)
);

create index if not exists documents_project_dockey_idx
    on public.documents (project_id, doc_key);

drop trigger if exists documents_set_updated_at on public.documents;
create trigger documents_set_updated_at
    before update on public.documents
    for each row execute function public.set_updated_at();

-- ── RLS ────────────────────────────────────────────────────────────────────

alter table public.specs enable row level security;
alter table public.documents enable row level security;

-- Specs: the project owner can access specs of their own projects

drop policy if exists "specs_select_own" on public.specs;
create policy "specs_select_own"
    on public.specs for select
    to authenticated
    using (project_id in (select id from public.projects where owner_id = (select auth.uid())));

drop policy if exists "specs_insert_own" on public.specs;
create policy "specs_insert_own"
    on public.specs for insert
    to authenticated
    with check (project_id in (select id from public.projects where owner_id = (select auth.uid())));

drop policy if exists "specs_update_own" on public.specs;
create policy "specs_update_own"
    on public.specs for update
    to authenticated
    using (project_id in (select id from public.projects where owner_id = (select auth.uid())))
    with check (project_id in (select id from public.projects where owner_id = (select auth.uid())));

drop policy if exists "specs_delete_own" on public.specs;
create policy "specs_delete_own"
    on public.specs for delete
    to authenticated
    using (project_id in (select id from public.projects where owner_id = (select auth.uid())));

-- Documents: same ownership check through the parent project

drop policy if exists "documents_select_own" on public.documents;
create policy "documents_select_own"
    on public.documents for select
    to authenticated
    using (project_id in (select id from public.projects where owner_id = (select auth.uid())));

drop policy if exists "documents_insert_own" on public.documents;
create policy "documents_insert_own"
    on public.documents for insert
    to authenticated
    with check (project_id in (select id from public.projects where owner_id = (select auth.uid())));

drop policy if exists "documents_update_own" on public.documents;
create policy "documents_update_own"
    on public.documents for update
    to authenticated
    using (project_id in (select id from public.projects where owner_id = (select auth.uid())))
    with check (project_id in (select id from public.projects where owner_id = (select auth.uid())));

drop policy if exists "documents_delete_own" on public.documents;
create policy "documents_delete_own"
    on public.documents for delete
    to authenticated
    using (project_id in (select id from public.projects where owner_id = (select auth.uid())));

-- ── Grants ──────────────────────────────────────────────────────────────────

grant select, insert, update, delete on public.specs to authenticated;
grant select, insert, update, delete on public.specs to service_role;

grant select, insert, update, delete on public.documents to authenticated;
grant select, insert, update, delete on public.documents to service_role;
