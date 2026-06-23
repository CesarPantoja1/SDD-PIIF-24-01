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
from app.modules.agents.tools import get_project_info, save_brief, read_full_brief
from app.modules.agents.prompts import DISCOVERY_CREATOR_DEFAULT_PROMPT, DISCOVERY_RUBRIC


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

    resolved_model = init_chat_model(
        f"{provider}:{model_name}",
        api_key=api_key,
        temperature=0.3,
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
                trigger=("fraction", 0.85),
                keep=("fraction", 0.10),
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
