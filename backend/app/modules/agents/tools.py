"""Database tools for the KOSMO agents.

These tools are called by the LLM agent via LangChain tool calling.
User identity (user_id, project_id, access_token) is injected via
LangGraph's config.configurable, not passed by the agent itself.
"""

from langgraph.config import get_config
from langchain_core.tools import tool

from app.db.supabase import get_supabase_user_client


def _get_context():
    """Extract authenticated context from LangGraph config."""
    config = get_config()
    return config["configurable"]


@tool
def get_project_info() -> str:
    """Get the current project's name and description. Use this first to understand
    what the user wants to build."""
    ctx = _get_context()
    client = get_supabase_user_client(ctx["access_token"])

    result = (
        client.table("projects")
        .select("name,description")
        .eq("id", ctx["project_id"])
        .maybe_single()
        .execute()
    )
    if not result or not result.data:
        return "Error: project not found."
    p = result.data
    return f"Project: {p['name']}\nDescription: {p['description']}"


@tool
def save_brief(content: str) -> str:
    """Save the product discovery document (brief). Pass the FULL markdown content
    including all sections. This creates or updates the brief for the current project."""
    if len(content) > 100_000:
        return "Error: content too large (max 100,000 characters)."

    ctx = _get_context()
    client = get_supabase_user_client(ctx["access_token"])

    client.table("documents").upsert(
        {
            "project_id": ctx["project_id"],
            "spec_id": None,
            "doc_key": "brief",
            "content": content,
            "generated": True,
        },
        on_conflict="project_id,spec_id,doc_key",
    ).execute()

    return "Brief saved successfully."


@tool
def read_full_brief() -> str:
    """Read the FULL saved brief content directly from the database.
    Use this when you need to verify that all sections are present and complete.
    This bypasses the transcript truncation limits."""
    ctx = _get_context()
    client = get_supabase_user_client(ctx["access_token"])

    try:
        result = (
            client.table("documents")
            .select("content")
            .eq("project_id", ctx["project_id"])
            .is_("spec_id", "null")
            .eq("doc_key", "brief")
            .execute()
        )
        if result and result.data and len(result.data) > 0:
            return result.data[0].get("content", "")
    except Exception:
        pass
    return "Error: could not read brief from database."
