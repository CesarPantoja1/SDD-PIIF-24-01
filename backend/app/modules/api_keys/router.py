from fastapi import APIRouter, Depends

from app.modules.api_keys.schemas import (
    ApiKeysResponse,
    DeleteKeyResponse,
    RevealRequest,
    RevealResponse,
    SaveKeyRequest,
    TestKeyRequest,
    TestKeyResponse,
)
from app.modules.api_keys.service import ApiKeysService
from app.modules.auth.dependencies import CurrentUser, get_current_user

router = APIRouter(prefix="/auth/me/api-keys", tags=["api-keys"])


@router.get("", response_model=ApiKeysResponse)
def get_keys(current_user: CurrentUser = Depends(get_current_user)) -> ApiKeysResponse:
    service = ApiKeysService()
    keys = service.get_keys(current_user.access_token, current_user.id)
    from app.core.crypto import mask_key
    return ApiKeysResponse(keys={p: mask_key(v) for p, v in keys.items()})


@router.put("", response_model=ApiKeysResponse)
def save_key(
    payload: SaveKeyRequest,
    current_user: CurrentUser = Depends(get_current_user),
) -> ApiKeysResponse:
    service = ApiKeysService()
    masked = service.save_key(current_user.access_token, current_user.id, payload.provider, payload.key)
    return ApiKeysResponse(keys=masked)


@router.delete("/{provider}", response_model=DeleteKeyResponse)
def delete_key(
    provider: str,
    current_user: CurrentUser = Depends(get_current_user),
) -> DeleteKeyResponse:
    service = ApiKeysService()
    masked = service.delete_key(current_user.access_token, current_user.id, provider)
    return DeleteKeyResponse(keys=masked, provider=provider)


@router.post("/test", response_model=TestKeyResponse)
def test_unsaved_key(
    payload: TestKeyRequest,
    current_user: CurrentUser = Depends(get_current_user),
) -> TestKeyResponse:
    service = ApiKeysService()
    ok, error = service.test_key(payload.provider, payload.key)
    return TestKeyResponse(ok=ok, provider=payload.provider, error=error)


@router.post("/{provider}/test", response_model=TestKeyResponse)
def test_saved_key(
    provider: str,
    current_user: CurrentUser = Depends(get_current_user),
) -> TestKeyResponse:
    service = ApiKeysService()
    ok, error = service.test_saved_key(current_user.access_token, current_user.id, provider)
    return TestKeyResponse(ok=ok, provider=provider, error=error)


@router.post("/{provider}/reveal", response_model=RevealResponse)
def reveal_key(
    provider: str,
    payload: RevealRequest,
    current_user: CurrentUser = Depends(get_current_user),
) -> RevealResponse:
    if not payload.confirm:
        from app.core.errors import http_error
        raise http_error("Debes confirmar la acción (confirm: true)", status_code=400)
    service = ApiKeysService()
    key = service.reveal_key(current_user.access_token, current_user.id, provider)
    return RevealResponse(provider=provider, key=key)
