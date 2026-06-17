import json

from cryptography.fernet import Fernet

from app.core.config import settings

PROVIDER_PREFIXES: dict[str, str] = {
    "openai": "sk-",
    "google": "AIza",
    "anthropic": "sk-ant-",
    "deepseek": "sk-",
}


def _fernet() -> Fernet:
    if not settings.encryption_key:
        raise RuntimeError("ENCRYPTION_KEY is not configured")
    return Fernet(settings.encryption_key.encode())


def encrypt_keys(keys: dict[str, str]) -> str:
    return _fernet().encrypt(json.dumps(keys).encode()).decode()


def decrypt_keys(ciphertext: str) -> dict[str, str]:
    if not ciphertext:
        return {}
    return json.loads(_fernet().decrypt(ciphertext.encode()))


def mask_key(key: str) -> str:
    if not key:
        return ""
    return f"{key[:4]}...{key[-4:]}"
