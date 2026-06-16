from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class ProjectCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    description: str = Field(default="", max_length=2000)
    tags: list[str] = Field(default_factory=list, max_length=12)


class ProjectUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=2000)
    tags: list[str] | None = Field(default=None, max_length=12)


class ProjectResponse(BaseModel):
    id: str
    owner_id: str
    name: str
    description: str
    status: str
    tags: list[str]
    cost: Decimal = Decimal("0")
    tokens: int = 0
    created_at: datetime
    updated_at: datetime


class ProjectListResponse(BaseModel):
    items: list[ProjectResponse]
