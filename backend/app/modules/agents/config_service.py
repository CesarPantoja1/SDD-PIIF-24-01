"""CRUD operations for agent_configs table."""

from app.db.supabase import get_supabase_user_client
from app.modules.agents.prompts import (
    DISCOVERY_CREATOR_DEFAULT_PROMPT,
    DISCOVERY_RUBRIC,
    SPECS_CREATOR_DEFAULT_PROMPT,
    SPECS_RUBRIC,
)

DEFAULT_CONFIGS: dict[str, dict] = {
    "discovery.creator": {
        "provider": "openai",
        "model": "gpt-4o",
        "system_prompt": DISCOVERY_CREATOR_DEFAULT_PROMPT,
    },
    "discovery.reviewer": {
        "provider": "openai",
        "model": "gpt-4o",
        "system_prompt": "",
    },
    "requirements.creator": {
        "provider": "anthropic",
        "model": "claude-sonnet-4",
        "system_prompt": "",
    },
    "requirements.reviewer": {
        "provider": "anthropic",
        "model": "claude-sonnet-4",
        "system_prompt": "",
    },
    "design.creator": {
        "provider": "openai",
        "model": "gpt-4o",
        "system_prompt": "",
    },
    "design.reviewer": {
        "provider": "anthropic",
        "model": "claude-opus-4",
        "system_prompt": "",
    },
    "tasks.creator": {
        "provider": "openai",
        "model": "gpt-4o",
        "system_prompt": "",
    },
    "tasks.reviewer": {
        "provider": "google",
        "model": "gemini-2.5-pro",
        "system_prompt": "",
    },
}

DEFAULT_RUBRICS: dict[str, str] = {
    "discovery": DISCOVERY_RUBRIC,
    "specs": SPECS_RUBRIC,
}


class AgentConfigService:
    def get_or_default(self, access_token: str, user_id: str) -> dict:
        client = get_supabase_user_client(access_token)
        result = (
            client.table("agent_configs")
            .select("slot_key,provider,model,system_prompt")
            .eq("user_id", user_id)
            .execute()
        )

        merged = {k: dict(v) for k, v in DEFAULT_CONFIGS.items()}
        for row in (result.data or []):
            sk = row["slot_key"]
            if sk in merged:
                merged[sk]["provider"] = row["provider"]
                merged[sk]["model"] = row["model"]
                merged[sk]["system_prompt"] = row["system_prompt"] or DEFAULT_CONFIGS.get(sk, {}).get("system_prompt", "")

        return merged

    def save(
        self,
        access_token: str,
        user_id: str,
        slot_key: str,
        provider: str,
        model: str,
        system_prompt: str,
    ) -> dict:
        client = get_supabase_user_client(access_token)
        client.table("agent_configs").upsert(
            {
                "user_id": user_id,
                "slot_key": slot_key,
                "provider": provider,
                "model": model,
                "system_prompt": system_prompt.strip() if system_prompt else "",
            },
            on_conflict="user_id,slot_key",
        ).execute()

        return {"slot_key": slot_key, "status": "saved"}

    def update_prompt(
        self,
        access_token: str,
        user_id: str,
        slot_key: str,
        system_prompt: str,
    ) -> dict:
        """Update only the system_prompt for a slot. Reads existing config first to preserve provider/model."""
        current = self.get_or_default(access_token, user_id)
        existing = current.get(slot_key, {})
        return self.save(
            access_token,
            user_id,
            slot_key,
            existing.get("provider", "openai"),
            existing.get("model", "gpt-4o"),
            system_prompt,
        )
