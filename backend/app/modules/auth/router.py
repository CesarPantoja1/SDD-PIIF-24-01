from fastapi import APIRouter, Depends

from app.modules.auth.dependencies import CurrentUser, get_current_user
from app.modules.auth.schemas import AuthSessionResponse, LoginRequest, ProfileResponse, ProfileUpdateRequest, RegisterRequest
from app.modules.auth.service import AuthService


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthSessionResponse, status_code=201)
def register(payload: RegisterRequest) -> AuthSessionResponse:
    return AuthService().register(payload)


@router.post("/login", response_model=AuthSessionResponse)
def login(payload: LoginRequest) -> AuthSessionResponse:
    return AuthService().login(payload)


@router.get("/me", response_model=ProfileResponse)
def me(current_user: CurrentUser = Depends(get_current_user)) -> ProfileResponse:
    return AuthService().get_profile(current_user)


@router.patch("/me", response_model=ProfileResponse)
def update_me(
    payload: ProfileUpdateRequest,
    current_user: CurrentUser = Depends(get_current_user),
) -> ProfileResponse:
    return AuthService().update_profile(current_user, payload.display_name)
