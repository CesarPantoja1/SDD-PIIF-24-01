import json
import logging

from cryptography.fernet import Fernet, InvalidToken

logger = logging.getLogger(__name__)

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
    try:
        return json.loads(_fernet().decrypt(ciphertext.encode()))
    except InvalidToken:
        logger.warning("No se pudo desencriptar las claves API. Es posible que ENCRYPTION_KEY haya cambiado.")
        return {}


def mask_key(key: str) -> str:
    if not key:
        return ""
    return f"{key[:4]}...{key[-4:]}"
