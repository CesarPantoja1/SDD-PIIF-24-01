from dataclasses import dataclass

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.errors import http_error
from app.db.supabase import get_supabase_client


bearer_scheme = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class CurrentUser:
    id: str
    email: str | None
    access_token: str


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> CurrentUser:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise http_error("Missing bearer token", status_code=401)

    token = credentials.credentials
    try:
        response = get_supabase_client().auth.get_user(token)
    except Exception as exc:
        raise http_error("Invalid or expired token", status_code=401) from exc

    user = response.user
    if user is None:
        raise http_error("Invalid or expired token", status_code=401)

    return CurrentUser(id=user.id, email=user.email, access_token=token)

