"""Database tools for the KOSMO agents.

These tools are called by the LLM agent via LangChain tool calling.
User identity (user_id, project_id, access_token) is injected via
LangGraph's config.configurable, not passed by the agent itself.
"""

import json

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


@tool
def create_specs(specs_json: str) -> str:
    """Create multiple specs from a JSON array. Each spec must have 'name' and 'description'.
    Example: [{"name":"Gestión de Inventario","description":"Los usuarios registran..."}]
    Saves all specs with auto-incremented positions."""
    ctx = _get_context()
    client = get_supabase_user_client(ctx["access_token"])

    try:
        specs = json.loads(specs_json)
    except json.JSONDecodeError:
        return "Error: invalid JSON. Expected [{\"name\": \"...\", \"description\": \"...\"}]"

    if not isinstance(specs, list):
        return "Error: expected a JSON array"

    # Hacer la operación idempotente: reemplazar las especificaciones existentes para evitar duplicados en iteraciones de rúbrica
    client.table("specs").delete().eq("project_id", ctx["project_id"]).execute()

    created = []
    for i, spec in enumerate(specs):
        if not isinstance(spec, dict) or "name" not in spec:
            continue
        result = (
            client.table("specs")
            .insert({
                "project_id": ctx["project_id"],
                "name": spec["name"],
                "description": spec.get("description", ""),
                "position": i,
            })
            .execute()
        )
        if result and result.data:
            created.append({"id": result.data[0]["id"], "name": spec["name"]})

    return f"Created {len(created)} specs: {json.dumps(created)}"


@tool
def read_all_specs() -> str:
    """Read ALL specs for the current project from the database.
    Returns name, description, and position for each spec.
    Use this to verify which specs exist and what they contain."""
    ctx = _get_context()
    client = get_supabase_user_client(ctx["access_token"])

    try:
        result = (
            client.table("specs")
            .select("id,name,description,position")
            .eq("project_id", ctx["project_id"])
            .order("position")
            .execute()
        )
        if not result or not result.data:
            return "No specs found for this project."

        lines = []
        for s in result.data:
            lines.append(
                f"## {s['name']} (position {s['position']})\n{s.get('description', '')}"
            )
        return "\n\n".join(lines)
    except Exception:
        pass
    return "Error: could not read specs from database."


@tool
def read_spec_info() -> str:
    """Read the current spec's name and description. Use this to focus the requirements
    ONLY on the interaction described for this specific module."""
    ctx = _get_context()
    client = get_supabase_user_client(ctx["access_token"])
    
    spec_id = ctx.get("spec_id")
    if not spec_id:
        return "Error: No spec_id in context."

    result = (
        client.table("specs")
        .select("name,description")
        .eq("id", spec_id)
        .maybe_single()
        .execute()
    )
    if not result or not result.data:
        return "Error: spec not found."
    
    s = result.data
    return f"Módulo: {s['name']}\nInteracción del usuario: {s['description']}"


@tool
def save_requirements(content: str) -> str:
    """Save the requirements document for the current spec. Pass the FULL markdown content."""
    if len(content) > 100_000:
        return "Error: content too large (max 100,000 characters)."

    ctx = _get_context()
    client = get_supabase_user_client(ctx["access_token"])
    
    spec_id = ctx.get("spec_id")
    if not spec_id:
        return "Error: No spec_id in context."

    client.table("documents").upsert(
        {
            "project_id": ctx["project_id"],
            "spec_id": spec_id,
            "doc_key": "requirements",
            "content": content,
            "generated": True,
        },
        on_conflict="project_id,spec_id,doc_key",
    ).execute()

    return "Requirements saved successfully."


@tool
def read_full_requirements() -> str:
    """Read the FULL saved requirements content directly from the database.
    Use this when you need to verify that all sections are present and complete."""
    ctx = _get_context()
    client = get_supabase_user_client(ctx["access_token"])
    
    spec_id = ctx.get("spec_id")
    if not spec_id:
        return "Error: No spec_id in context."

    try:
        result = (
            client.table("documents")
            .select("content")
            .eq("project_id", ctx["project_id"])
            .eq("spec_id", spec_id)
            .eq("doc_key", "requirements")
            .execute()
        )
        if result and result.data and len(result.data) > 0:
            return result.data[0].get("content", "")
    except Exception:
        pass
    return "Error: could not read requirements from database."
