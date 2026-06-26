"""FastAPI router for agent endpoints.

POST /agents/projects/{id}/generate/stream  — SSE endpoint for discovery generation
GET  /agents/configs                         — Get agent configs (with defaults)
PUT  /agents/configs/{slot_key}              — Save agent config for a slot
"""

import asyncio
import concurrent.futures
import json

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from fastapi import HTTPException

from app.modules.agents.schemas import (
    AgentConfigRequest,
    AgentConfigsResponse,
    GenerateRequest,
    PromptUpdateRequest,
)
from app.modules.agents.config_service import AgentConfigService, DEFAULT_RUBRICS
from app.modules.agents.service import run_discovery_agent, run_specs_agent, run_requirements_agent
from app.modules.api_keys.service import ApiKeysService
from app.modules.auth.dependencies import CurrentUser, get_current_user

router = APIRouter(prefix="/agents", tags=["agents"])


# ── SSE: Generate Discovery ─────────────────────────────────────

@router.post("/projects/{project_id}/generate/stream")
async def generate_discovery_stream(
    project_id: str,
    request: Request,
    body: GenerateRequest | None = None,
    current_user: CurrentUser = Depends(get_current_user),
):
    """SSE endpoint that streams rubric evaluations in real time during
    generation. Routes to discovery or specs agent based on doc_key."""

    doc_key = body.doc_key if body else "brief"

    # Load user config
    keys = ApiKeysService().get_keys(current_user.access_token, current_user.id)
    configs = AgentConfigService().get_or_default(current_user.access_token, current_user.id)

    # Choose agent function and config
    if doc_key == "specs":
        run_agent = run_specs_agent
        slot_config = configs.get("specs.creator", {})
    elif doc_key == "requirements":
        run_agent = run_requirements_agent
        slot_config = configs.get("requirements.creator", {})
    else:
        run_agent = run_discovery_agent
        slot_config = configs.get("discovery.creator", {})

    # Override provider/model from request body if provided
    provider = (body.provider if body and body.provider else None) or slot_config.get("provider", "openai")
    model_name = (body.model if body and body.model else None) or slot_config.get("model", "gpt-4o")

    api_key = keys.get(provider)
    if not api_key:
        raise HTTPException(
            status_code=400,
            detail=f"No API key configured for {provider}. Add it in Settings → API Keys.",
        )

    async def event_generator():
        queue: asyncio.Queue = asyncio.Queue()
        loop = asyncio.get_running_loop()

        def on_eval(evaluation: dict):
            """Called by RubricMiddleware in the worker thread. Thread-safe bridge to async."""
            loop.call_soon_threadsafe(
                queue.put_nowait,
                {"event": "rubric_evaluation", "data": evaluation},
            )

        executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)

        if doc_key == "requirements":
            future = loop.run_in_executor(
                executor,
                run_agent,
                project_id,
                current_user.id,
                current_user.access_token,
                api_key,
                provider,
                model_name,
                slot_config.get("system_prompt"),
                on_eval,
                body.spec_id if body else None,
            )
        else:
            future = loop.run_in_executor(
                executor,
                run_agent,
                project_id,
                current_user.id,
                current_user.access_token,
                api_key,
                provider,
                model_name,
                slot_config.get("system_prompt"),
                on_eval,
            )

        # Stream events while agent works
        while not future.done():
            if await request.is_disconnected():
                future.cancel()
                break
                
            try:
                data = await asyncio.wait_for(queue.get(), timeout=0.2)
                event = data["event"]
                payload = data["data"]
                # Serialize evaluations for SSE
                serialized = {
                    "iteration": payload.get("iteration", 0),
                    "result": payload.get("result", "unknown"),
                    "explanation": payload.get("explanation", ""),
                    "criteria": [
                        {
                            "name": c.get("name", ""),
                            "passed": c.get("passed", False),
                            "gap": c.get("gap"),
                        }
                        for c in payload.get("criteria", [])
                    ],
                }
                yield f"event: {event}\ndata: {json.dumps(serialized)}\n\n"
            except asyncio.TimeoutError:
                yield ": keepalive\n\n"

        # Agent finished
        try:
            result = future.result()
            if doc_key == "specs":
                yield f"event: complete\ndata: {json.dumps({'specs': result.get('specs', [])})}\n\n"
            else:
                yield f"event: complete\ndata: {json.dumps({'content': result.get('content', '')})}\n\n"
        except Exception as exc:
            yield f"event: error\ndata: {json.dumps({'error': str(exc)})}\n\n"
        finally:
            executor.shutdown(wait=False)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ── Agent Config CRUD ───────────────────────────────────────────

@router.get("/configs", response_model=AgentConfigsResponse)
async def get_configs(current_user: CurrentUser = Depends(get_current_user)):
    configs = AgentConfigService().get_or_default(current_user.access_token, current_user.id)
    rubrics = dict(DEFAULT_RUBRICS)
    return AgentConfigsResponse(configs={**configs, "_rubrics": rubrics})


@router.put("/configs/{slot_key}")
async def save_config(
    slot_key: str,
    body: AgentConfigRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    return AgentConfigService().save(
        current_user.access_token,
        current_user.id,
        slot_key,
        body.provider,
        body.model,
        body.system_prompt,
    )


@router.patch("/configs/{slot_key}")
async def update_prompt(
    slot_key: str,
    body: PromptUpdateRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    return AgentConfigService().update_prompt(
        current_user.access_token,
        current_user.id,
        slot_key,
        body.system_prompt,
    )


@router.get("/configs/defaults")
async def get_defaults():
    from app.modules.agents.config_service import DEFAULT_CONFIGS
    rubrics = dict(DEFAULT_RUBRICS)
    return {"configs": DEFAULT_CONFIGS, "rubrics": rubrics}
