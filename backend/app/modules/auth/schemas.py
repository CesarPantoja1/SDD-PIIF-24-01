from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    display_name: str = Field(min_length=2, max_length=120)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class ProfileResponse(BaseModel):
    id: str
    email: str | None = None
    display_name: str | None = None
    avatar_url: str | None = None
    role: str = "user"


class ProfileUpdateRequest(BaseModel):
    display_name: str = Field(min_length=2, max_length=120)


class AuthSessionResponse(BaseModel):
    access_token: str | None
    refresh_token: str | None
    token_type: str = "bearer"
    expires_in: int | None = None
    user: ProfileResponse
