from pydantic import BaseModel, Field


class ApiKeysResponse(BaseModel):
    keys: dict[str, str]


class SaveKeyRequest(BaseModel):
    provider: str = Field(min_length=1, max_length=50)
    key: str = Field(min_length=1, max_length=512)


class TestKeyRequest(BaseModel):
    provider: str
    key: str = Field(min_length=1, max_length=512)


class TestKeyResponse(BaseModel):
    ok: bool
    provider: str
    error: str | None = None


class RevealRequest(BaseModel):
    confirm: bool = False


class RevealResponse(BaseModel):
    provider: str
    key: str


class DeleteKeyResponse(BaseModel):
    keys: dict[str, str]
    provider: str
