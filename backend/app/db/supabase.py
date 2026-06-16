"""
Supabase client factory.

SSL / Windows development note:
  On Windows, Python may not find the system CA bundle, causing
  "CERTIFICATE_VERIFY_FAILED" when connecting to Supabase.
  We configure certifi (if installed) as the trusted CA store via environment
  variables so that both httpx and the underlying ssl module use it.
  This is safe and ONLY applies inside the running process.
"""

import os
from functools import lru_cache

from supabase import Client, create_client

from app.core.config import settings

# ── SSL setup (development convenience, safe in production) ────────────────
try:
    import truststore
    truststore.inject_to_ssl()
except Exception:
    try:
        import certifi as _certifi
        _ca_bundle = _certifi.where()
        os.environ.setdefault("SSL_CERT_FILE", _ca_bundle)
        os.environ.setdefault("REQUESTS_CA_BUNDLE", _ca_bundle)
    except ImportError:
        pass
# ───────────────────────────────────────────────────────────────────────────


@lru_cache
def get_supabase_client() -> Client:
    return create_client(str(settings.supabase_url), settings.supabase_anon_key)


@lru_cache
def get_supabase_admin_client() -> Client:
    if not settings.supabase_service_role_key:
        raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY is not configured")
    return create_client(str(settings.supabase_url), settings.supabase_service_role_key)


def get_supabase_user_client(access_token: str) -> Client:
    """
    Create a Supabase client authenticated with the user's JWT.
    The postgrest client will automatically include the token in all requests,
    so RLS policies evaluate against the real user identity.
    """
    client = create_client(str(settings.supabase_url), settings.supabase_anon_key)
    client.postgrest.auth(access_token)
    return client
