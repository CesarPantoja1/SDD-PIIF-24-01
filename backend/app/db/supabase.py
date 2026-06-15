from functools import lru_cache

from supabase import Client, create_client

from app.core.config import settings


@lru_cache
def get_supabase_client() -> Client:
    return create_client(str(settings.supabase_url), settings.supabase_anon_key)


@lru_cache
def get_supabase_admin_client() -> Client:
    if not settings.supabase_service_role_key:
        raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY is not configured")
    return create_client(str(settings.supabase_url), settings.supabase_service_role_key)


def get_supabase_user_client(access_token: str) -> Client:
    client = create_client(str(settings.supabase_url), settings.supabase_anon_key)
    client.postgrest.auth(access_token)
    return client
