from app.core.errors import http_error
from app.db.supabase import get_supabase_client, get_supabase_user_client
from app.modules.auth.dependencies import CurrentUser
from app.modules.auth.schemas import AuthSessionResponse, LoginRequest, ProfileResponse, RegisterRequest

_PROFILE_SELECT = "id,email,display_name,avatar_url,role"


class AuthService:
    def __init__(self) -> None:
        self.auth_client = get_supabase_client()

    def register(self, payload: RegisterRequest) -> AuthSessionResponse:
        try:
            response = self.auth_client.auth.sign_up(
                {
                    "email": payload.email,
                    "password": payload.password,
                    "options": {"data": {"display_name": payload.display_name}},
                }
            )
        except Exception as exc:
            raise http_error(f"Could not register user: {exc}", status_code=400) from exc

        if response.user is None:
            raise http_error("Registration did not return a user", status_code=400)

        access_token = getattr(response.session, "access_token", None)
        if access_token:
            profile = self._upsert_profile(
                access_token=access_token,
                user_id=response.user.id,
                email=response.user.email,
                display_name=payload.display_name,
            )
        else:
            profile = ProfileResponse(
                id=response.user.id,
                email=response.user.email,
                display_name=payload.display_name,
                role="user"
            )
        return self._session_response(response.session, profile)

    def login(self, payload: LoginRequest) -> AuthSessionResponse:
        try:
            response = self.auth_client.auth.sign_in_with_password(
                {"email": payload.email, "password": payload.password}
            )
        except Exception as exc:
            raise http_error("Invalid credentials", status_code=401) from exc

        if response.user is None:
            raise http_error("Invalid credentials", status_code=401)

        profile = self.get_profile(
            CurrentUser(
                id=response.user.id,
                email=response.user.email,
                access_token=getattr(response.session, "access_token", ""),
            )
        )
        return self._session_response(response.session, profile)

    def get_profile(self, current_user: CurrentUser) -> ProfileResponse:
        """Fetch profile from DB. Falls back to upsert if row is missing."""
        client = get_supabase_user_client(current_user.access_token)
        result = (
            client.table("profiles")
            .select(_PROFILE_SELECT)
            .eq("id", current_user.id)
            .maybe_single()
            .execute()
        )
        if result.data is None:
            return self._upsert_profile(
                access_token=current_user.access_token,
                user_id=current_user.id,
                email=current_user.email,
                display_name=(
                    current_user.email.split("@")[0] if current_user.email else "Usuario"
                ),
            )
        return ProfileResponse(**result.data)

    def update_profile(self, current_user: CurrentUser, display_name: str) -> ProfileResponse:
        client = get_supabase_user_client(current_user.access_token)
        result = (
            client.table("profiles")
            .update({"display_name": display_name.strip()})
            .eq("id", current_user.id)
            .select(_PROFILE_SELECT)
            .execute()
        )
        data = result.data[0] if isinstance(result.data, list) and result.data else result.data
        if not data:
            raise http_error("Profile was not updated", status_code=500)
        return ProfileResponse(**data)

    def _upsert_profile(
        self,
        access_token: str,
        user_id: str,
        email: str | None,
        display_name: str,
    ) -> ProfileResponse:
        client = get_supabase_user_client(access_token)
        result = (
            client.table("profiles")
            .upsert(
                {
                    "id": user_id,
                    "email": email,
                    "display_name": display_name,
                },
                on_conflict="id",
            )
            .select(_PROFILE_SELECT)
            .execute()
        )
        data = result.data[0] if isinstance(result.data, list) and result.data else result.data
        if not data:
            # Fallback (RLS race on signup)
            return ProfileResponse(id=user_id, email=email, display_name=display_name)
        return ProfileResponse(**data)

    @staticmethod
    def _session_response(session: object | None, profile: ProfileResponse) -> AuthSessionResponse:
        return AuthSessionResponse(
            access_token=getattr(session, "access_token", None),
            refresh_token=getattr(session, "refresh_token", None),
            expires_in=getattr(session, "expires_in", None),
            user=profile,
        )
