"""Discovery agent service.

Runs the discovery agent with RubricMiddleware for self-evaluated iteration.
Executed synchronously in a background thread for SSE streaming support.
"""

from langchain.chat_models import init_chat_model
from langchain_core.messages import HumanMessage
from langchain.agents import create_agent

from deepagents.middleware.rubric import RubricMiddleware
from deepagents.backends.state import StateBackend
from deepagents.middleware.summarization import SummarizationMiddleware

from app.core.errors import http_error
from app.db.supabase import get_supabase_user_client
from app.modules.agents.tools import get_project_info, save_brief, read_full_brief, create_specs, read_all_specs, read_spec_info, save_requirements, read_full_requirements, save_design, read_full_design
from app.modules.agents.prompts import (
    DISCOVERY_CREATOR_DEFAULT_PROMPT, DISCOVERY_RUBRIC,
    SPECS_CREATOR_DEFAULT_PROMPT, SPECS_RUBRIC,
    REQUIREMENTS_CREATOR_DEFAULT_PROMPT, REQUIREMENTS_RUBRIC,
    DESIGN_CREATOR_DEFAULT_PROMPT, DESIGN_RUBRIC,
)
LANGCHAIN_PROVIDER_MAP = {
    "google": "google_genai",
    "openai": "openai",
    "anthropic": "anthropic",
    "deepseek": "deepseek",
}


def run_discovery_agent(
    project_id: str,
    user_id: str,
    access_token: str,
    api_key: str,
    provider: str,
    model_name: str,
    system_prompt: str | None = None,
    on_evaluation: object = None,
) -> dict:
    """Execute the discovery agent synchronously. Designed to run in a thread pool.

    Returns dict with 'content' and 'evaluations' keys, or raises HTTPException.
    """

    lc_provider = LANGCHAIN_PROVIDER_MAP.get(provider, provider)
    resolved_model = init_chat_model(
        f"{lc_provider}:{model_name}",
        api_key=api_key,
        temperature=0.3,
        max_retries=10,
    )

    agent = create_agent(
        model=resolved_model,
        tools=[get_project_info, save_brief],
        middleware=[
            RubricMiddleware(
                model=resolved_model,
                max_iterations=3,
                on_evaluation=on_evaluation,
                tools=[read_full_brief],
            ),
            SummarizationMiddleware(
                model=resolved_model,
                backend=StateBackend(),
                trigger=("tokens", 100000),
                keep=("tokens", 10000),
            ),
        ],
        system_prompt=system_prompt or DISCOVERY_CREATOR_DEFAULT_PROMPT,
    )

    result = agent.invoke(
        {
            "messages": [
                HumanMessage(
                    content="Generate the complete product discovery document for this project. "
                    "Start by calling get_project_info() to understand the project context. "
                    "When you finish, call save_brief() with the FULL markdown content including ALL sections. "
                    "Then respond ONLY with the document title as a level-1 heading (e.g. '# Product Name')."
                )
            ],
            "rubric": DISCOVERY_RUBRIC,
        },
        config={
            "configurable": {
                "thread_id": f"disc-{project_id}",
                "user_id": user_id,
                "project_id": project_id,
                "access_token": access_token,
            },
        },
    )

    # Read the brief directly from DB (not from the AI's conversational message)
    content = _read_brief_from_db(access_token, project_id)
    evaluations = result.get("_rubric_evaluations", [])

    return {
        "content": content,
        "evaluations": [_serialize_evaluation(ev) for ev in evaluations],
    }


def _read_brief_from_db(access_token: str, project_id: str) -> str | None:
    """Read brief from DB. Falls back to extracting from agent messages on error."""
    try:
        client = get_supabase_user_client(access_token)
        r = (
            client.table("documents")
            .select("content")
            .eq("project_id", project_id)
            .is_("spec_id", "null")
            .eq("doc_key", "brief")
            .execute()
        )
        if r and r.data and len(r.data) > 0:
            return r.data[0].get("content")
    except Exception:
        pass
    return None


def _read_specs_from_db(access_token: str, project_id: str) -> list[dict]:
    """Read all specs from DB."""
    try:
        client = get_supabase_user_client(access_token)
        r = (
            client.table("specs")
            .select("id,name,description,position")
            .eq("project_id", project_id)
            .order("position")
            .execute()
        )
        if r and r.data:
            return r.data
    except Exception:
        pass
    return []


def run_specs_agent(
    project_id: str,
    user_id: str,
    access_token: str,
    api_key: str,
    provider: str,
    model_name: str,
    system_prompt: str | None = None,
    on_evaluation: object = None,
) -> dict:
    """Execute the specs agent synchronously. Designed to run in a thread pool.

    Returns dict with 'specs' and 'evaluations' keys.
    """

    lc_provider = LANGCHAIN_PROVIDER_MAP.get(provider, provider)
    resolved_model = init_chat_model(
        f"{lc_provider}:{model_name}",
        api_key=api_key,
        temperature=0.3,
        max_retries=10,
    )

    agent = create_agent(
        model=resolved_model,
        tools=[read_full_brief, create_specs],
        middleware=[
            RubricMiddleware(
                model=resolved_model,
                max_iterations=3,
                on_evaluation=on_evaluation,
                tools=[read_full_brief, read_all_specs],
            ),
            SummarizationMiddleware(
                model=resolved_model,
                backend=StateBackend(),
                trigger=("tokens", 100000),
                keep=("tokens", 10000),
            ),
        ],
        system_prompt=system_prompt or SPECS_CREATOR_DEFAULT_PROMPT,
    )

    result = agent.invoke(
        {
            "messages": [
                HumanMessage(
                    content="Read the Discovery brief with read_full_brief(), "
                    "then extract functional specs and save them with create_specs()."
                )
            ],
            "rubric": SPECS_RUBRIC,
        },
        config={
            "configurable": {
                "thread_id": f"specs-{project_id}",
                "user_id": user_id,
                "project_id": project_id,
                "access_token": access_token,
            },
        },
    )

    specs = _read_specs_from_db(access_token, project_id)
    evaluations = result.get("_rubric_evaluations", [])

    return {
        "specs": specs,
        "evaluations": [_serialize_evaluation(ev) for ev in evaluations],
    }


def _serialize_evaluation(evaluation: dict) -> dict:
    return {
        "iteration": evaluation.get("iteration", 0),
        "result": evaluation.get("result", "unknown"),
        "explanation": evaluation.get("explanation", ""),
        "criteria": [
            {
                "name": c.get("name", ""),
                "passed": c.get("passed", False),
                "gap": c.get("gap"),
            }
            for c in evaluation.get("criteria", [])
        ],
    }


def run_requirements_agent(
    project_id: str,
    user_id: str,
    access_token: str,
    api_key: str,
    provider: str,
    model_name: str,
    system_prompt: str | None = None,
    on_evaluation: object = None,
    spec_id: str | None = None,
) -> dict:
    """Execute the requirements agent synchronously. Designed to run in a thread pool.

    Returns dict with 'content' and 'evaluations' keys.
    """

    lc_provider = LANGCHAIN_PROVIDER_MAP.get(provider, provider)
    resolved_model = init_chat_model(
        f"{lc_provider}:{model_name}",
        api_key=api_key,
        temperature=0.3,
        max_retries=10,
    )

    agent = create_agent(
        model=resolved_model,
        tools=[read_spec_info, save_requirements],
        middleware=[
            RubricMiddleware(
                model=resolved_model,
                max_iterations=3,
                on_evaluation=on_evaluation,
                tools=[read_spec_info, read_full_requirements],
            ),
            SummarizationMiddleware(
                model=resolved_model,
                backend=StateBackend(),
                trigger=("tokens", 100000),
                keep=("tokens", 10000),
            ),
        ],
        system_prompt=system_prompt or REQUIREMENTS_CREATOR_DEFAULT_PROMPT,
    )

    result = agent.invoke(
        {
            "messages": [
                HumanMessage(
                    content="Read the current module scope with read_spec_info(), "
                    "then write the requirements in EARS format and save them with save_requirements()."
                )
            ],
            "rubric": REQUIREMENTS_RUBRIC,
        },
        config={
            "configurable": {
                "thread_id": f"reqs-{spec_id}",
                "user_id": user_id,
                "project_id": project_id,
                "spec_id": spec_id,
                "access_token": access_token,
            },
        },
    )

    evaluations = result.get("_rubric_evaluations", [])

    # Fetch the content that was just saved by the agent
    final_content = ""
    try:
        client = get_supabase_user_client(access_token)
        r = (
            client.table("documents")
            .select("content")
            .eq("project_id", project_id)
            .eq("spec_id", spec_id)
            .eq("doc_key", "requirements")
            .execute()
        )
        if r and r.data and len(r.data) > 0:
            final_content = r.data[0].get("content", "")
    except Exception as e:
        print(f"Error fetching final requirements: {e}")

    return {
        "content": final_content,
        "evaluations": [_serialize_evaluation(ev) for ev in evaluations],
    }


def run_design_agent(
    project_id: str,
    user_id: str,
    access_token: str,
    api_key: str,
    provider: str,
    model_name: str,
    system_prompt: str | None = None,
    on_evaluation: object = None,
    spec_id: str | None = None,
) -> dict:
    """Execute the design agent synchronously. Designed to run in a thread pool.

    Returns dict with 'content' and 'evaluations' keys.
    """

    lc_provider = LANGCHAIN_PROVIDER_MAP.get(provider, provider)
    resolved_model = init_chat_model(
        f"{lc_provider}:{model_name}",
        api_key=api_key,
        temperature=0.3,
        max_retries=10,
    )

    agent = create_agent(
        model=resolved_model,
        tools=[read_spec_info, read_full_requirements, save_design],
        middleware=[
            RubricMiddleware(
                model=resolved_model,
                max_iterations=3,
                on_evaluation=on_evaluation,
                tools=[read_spec_info, read_full_requirements, read_full_design],
            ),
            SummarizationMiddleware(
                model=resolved_model,
                backend=StateBackend(),
                trigger=("tokens", 100000),
                keep=("tokens", 10000),
            ),
        ],
        system_prompt=system_prompt or DESIGN_CREATOR_DEFAULT_PROMPT,
    )

    result = agent.invoke(
        {
            "messages": [
                HumanMessage(
                    content="Read the module scope with read_spec_info() and the requirements with read_full_requirements(), "
                    "then design the class diagram and save the semantic JSON using save_design()."
                )
            ],
            "rubric": DESIGN_RUBRIC,
        },
        config={
            "configurable": {
                "thread_id": f"design-{spec_id}",
                "user_id": user_id,
                "project_id": project_id,
                "spec_id": spec_id,
                "access_token": access_token,
            },
        },
    )

    evaluations = result.get("_rubric_evaluations", [])

    final_content = ""
    try:
        client = get_supabase_user_client(access_token)
        r = (
            client.table("documents")
            .select("content")
            .eq("project_id", project_id)
            .eq("spec_id", spec_id)
            .eq("doc_key", "design")
            .execute()
        )
        if r and r.data and len(r.data) > 0:
            final_content = r.data[0].get("content", "")
    except Exception as e:
        print(f"Error fetching final design: {e}")

    return {
        "content": final_content,
        "evaluations": [_serialize_evaluation(ev) for ev in evaluations],
    }

