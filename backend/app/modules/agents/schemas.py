"""Pydantic schemas for the agents module."""

from pydantic import BaseModel, Field


class GenerateRequest(BaseModel):
    doc_key: str = Field(default="brief", description="Phase to generate: brief, specs, requirements, design, tasks")
    provider: str | None = Field(default=None, description="Override provider from agent config")
    model: str | None = Field(default=None, description="Override model from agent config")
    spec_id: str | None = Field(default=None, description="Spec ID when generating a spec-level document")


class GenerateResponse(BaseModel):
    phase: str | None = None
    doc_key: str | None = None
    content: str | None = None
    specs: list[dict] | None = None
    evaluations: list[dict] | None = None
    error: str | None = None


class AgentConfigRequest(BaseModel):
    provider: str = Field(min_length=1, max_length=50)
    model: str = Field(min_length=1, max_length=100)
    system_prompt: str = Field(default="", max_length=10000)


class PromptUpdateRequest(BaseModel):
    system_prompt: str = Field(default="", max_length=10000)


class AgentConfigResponse(BaseModel):
    slot_key: str
    provider: str
    model: str
    system_prompt: str
    is_default: bool = False


class AgentConfigsResponse(BaseModel):
    configs: dict[str, dict]
