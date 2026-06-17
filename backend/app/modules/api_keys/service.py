import httpx

from app.core.crypto import decrypt_keys, encrypt_keys, mask_key
from app.core.errors import http_error
from app.db.supabase import get_supabase_user_client

PROVIDER_TEST_CONFIG: dict[str, dict] = {
    "openai": {
        "url": "https://api.openai.com/v1/models",
        "headers": lambda key: {"Authorization": f"Bearer {key}"},
    },
    "google": {
        "url": "https://generativelanguage.googleapis.com/v1beta/models",
        "params": lambda key: {"key": key, "pageSize": 1},
    },
    "anthropic": {
        "url": "https://api.anthropic.com/v1/models",
        "headers": lambda key: {
            "x-api-key": key,
            "anthropic-version": "2023-06-01",
        },
        "params": lambda key: {"limit": 1},
    },
    "deepseek": {
        "url": "https://api.deepseek.com/v1/models",
        "headers": lambda key: {"Authorization": f"Bearer {key}"},
    },
}

VALID_PROVIDERS = frozenset(PROVIDER_TEST_CONFIG.keys())


def _test_provider_key(provider: str, key: str) -> tuple[bool, str | None]:
    config = PROVIDER_TEST_CONFIG.get(provider)
    if config is None:
        return False, f"Proveedor desconocido: {provider}"

    headers = config.get("headers", lambda k: {})(key)
    params = config.get("params", lambda k: {})(key)

    try:
        response = httpx.get(config["url"], headers=headers, params=params, timeout=15.0)
        if response.status_code == 200:
            return True, None
        detail = ""
        try:
            body = response.json()
            detail = body.get("error", {}).get("message", "") or str(body)
        except Exception:
            detail = response.text[:200]
        return False, detail or f"HTTP {response.status_code}"
    except httpx.TimeoutException:
        return False, "Timeout al conectar con el proveedor"
    except Exception as exc:
        return False, str(exc)


class ApiKeysService:
    def get_keys(self, access_token: str, user_id: str) -> dict[str, str]:
        client = get_supabase_user_client(access_token)
        result = (
            client.table("api_keys")
            .select("encrypted_keys")
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )
        if result is None or result.data is None:
            return {}
        ciphertext = result.data.get("encrypted_keys", "")
        return decrypt_keys(ciphertext)

    def save_key(self, access_token: str, user_id: str, provider: str, key: str) -> dict[str, str]:
        if provider not in VALID_PROVIDERS:
            raise http_error(f"Proveedor no soportado: {provider}", status_code=400)

        ok, error = _test_provider_key(provider, key)
        if not ok:
            raise http_error(error or "API Key inválida", status_code=400)

        current = self.get_keys(access_token, user_id)
        current[provider] = key
        ciphertext = encrypt_keys(current)

        client = get_supabase_user_client(access_token)
        client.table("api_keys").upsert(
            {"user_id": user_id, "encrypted_keys": ciphertext},
            on_conflict="user_id",
        ).execute()

        return {p: mask_key(v) for p, v in current.items()}

    def delete_key(self, access_token: str, user_id: str, provider: str) -> dict[str, str]:
        current = self.get_keys(access_token, user_id)
        current[provider] = ""

        ciphertext = encrypt_keys(current) if any(current.values()) else ""

        client = get_supabase_user_client(access_token)
        client.table("api_keys").upsert(
            {"user_id": user_id, "encrypted_keys": ciphertext},
            on_conflict="user_id",
        ).execute()

        return {p: mask_key(v) for p, v in current.items()}

    def test_key(self, provider: str, key: str) -> tuple[bool, str | None]:
        if provider not in VALID_PROVIDERS:
            return False, f"Proveedor no soportado: {provider}"
        return _test_provider_key(provider, key)

    def test_saved_key(self, access_token: str, user_id: str, provider: str) -> tuple[bool, str | None]:
        current = self.get_keys(access_token, user_id)
        key = current.get(provider, "")
        if not key:
            return False, "No hay API Key guardada para este proveedor"
        return _test_provider_key(provider, key)

    def reveal_key(self, access_token: str, user_id: str, provider: str) -> str:
        current = self.get_keys(access_token, user_id)
        key = current.get(provider, "")
        if not key:
            raise http_error("No hay API Key guardada para este proveedor", status_code=404)
        return key
