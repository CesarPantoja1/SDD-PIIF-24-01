-- KOSMO: api_keys table for storing provider API keys encrypted at rest.
-- Encryption/decryption happens in the backend application layer (Fernet).

create table if not exists public.api_keys (
    user_id uuid primary key references auth.users(id) on delete cascade,
    encrypted_keys text not null default '',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

drop trigger if exists api_keys_set_updated_at on public.api_keys;
create trigger api_keys_set_updated_at
    before update on public.api_keys
    for each row execute function public.set_updated_at();

alter table public.api_keys enable row level security;

drop policy if exists "api_keys_select_own" on public.api_keys;
create policy "api_keys_select_own"
    on public.api_keys for select
    to authenticated
    using ((select auth.uid()) = user_id);

drop policy if exists "api_keys_insert_own" on public.api_keys;
create policy "api_keys_insert_own"
    on public.api_keys for insert
    to authenticated
    with check ((select auth.uid()) = user_id);

drop policy if exists "api_keys_update_own" on public.api_keys;
create policy "api_keys_update_own"
    on public.api_keys for update
    to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

grant select, insert, update on public.api_keys to authenticated;
grant select, insert, update, delete on public.api_keys to service_role;
