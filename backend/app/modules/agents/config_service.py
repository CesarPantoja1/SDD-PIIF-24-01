"""CRUD operations for agent_configs table."""

from app.db.supabase import get_supabase_user_client
from app.modules.agents.prompts import (
    DISCOVERY_CREATOR_DEFAULT_PROMPT,
    DISCOVERY_RUBRIC,
    SPECS_CREATOR_DEFAULT_PROMPT,
    SPECS_RUBRIC,
    REQUIREMENTS_CREATOR_DEFAULT_PROMPT,
    REQUIREMENTS_RUBRIC,
    DESIGN_CREATOR_DEFAULT_PROMPT,
    DESIGN_RUBRIC,
)

DEFAULT_CONFIGS: dict[str, dict] = {
    "clarifier": {
        "provider": "",
        "model": "",
        "system_prompt": "",
    },
    "discovery.creator": {
        "provider": "",
        "model": "",
        "system_prompt": DISCOVERY_CREATOR_DEFAULT_PROMPT,
    },
    "discovery.reviewer": {
        "provider": "",
        "model": "",
        "system_prompt": "",
    },
    "specs.creator": {
        "provider": "",
        "model": "",
        "system_prompt": SPECS_CREATOR_DEFAULT_PROMPT,
    },
    "specs.reviewer": {
        "provider": "",
        "model": "",
        "system_prompt": "",
    },
    "requirements.creator": {
        "provider": "",
        "model": "",
        "system_prompt": REQUIREMENTS_CREATOR_DEFAULT_PROMPT,
    },
    "requirements.reviewer": {
        "provider": "",
        "model": "",
        "system_prompt": "",
    },
    "design.creator": {
        "provider": "",
        "model": "",
        "system_prompt": DESIGN_CREATOR_DEFAULT_PROMPT,
    },
    "design.reviewer": {
        "provider": "",
        "model": "",
        "system_prompt": "",
    },
    "tasks.creator": {
        "provider": "",
        "model": "",
        "system_prompt": "",
    },
    "tasks.reviewer": {
        "provider": "",
        "model": "",
        "system_prompt": "",
    },
}

DEFAULT_RUBRICS: dict[str, str] = {
    "discovery": DISCOVERY_RUBRIC,
    "specs": SPECS_RUBRIC,
    "requirements": REQUIREMENTS_RUBRIC,
    "design": DESIGN_RUBRIC,
}


class AgentConfigService:
    def get_or_default(self, access_token: str, user_id: str, project_id: str | None = None) -> dict:
        client = get_supabase_user_client(access_token)
        result = (
            client.table("agent_configs")
            .select("slot_key,provider,model,system_prompt")
            .eq("user_id", user_id)
            .execute()
        )

        merged = {k: dict(v) for k, v in DEFAULT_CONFIGS.items()}
        local_overrides = []
        
        for row in (result.data or []):
            sk = row["slot_key"]
            if sk.startswith("project_"):
                if project_id and sk.startswith(f"project_{project_id}."):
                    local_overrides.append(row)
                continue
                
            if sk in merged:
                merged[sk]["provider"] = row["provider"]
                merged[sk]["model"] = row["model"]
                merged[sk]["system_prompt"] = row["system_prompt"] or DEFAULT_CONFIGS.get(sk, {}).get("system_prompt", "")
                
        if project_id:
            prefix = f"project_{project_id}."
            for row in local_overrides:
                base_sk = row["slot_key"].replace(prefix, "")
                if base_sk in merged:
                    merged[base_sk]["provider"] = row["provider"]
                    merged[base_sk]["model"] = row["model"]
                    if row["system_prompt"]:
                        merged[base_sk]["system_prompt"] = row["system_prompt"]

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
        project_id = None
        base_sk = slot_key
        if slot_key.startswith("project_"):
            parts = slot_key.split(".", 1)
            project_id = parts[0].replace("project_", "")
            base_sk = parts[1] if len(parts) > 1 else slot_key

        current = self.get_or_default(access_token, user_id, project_id)
        existing = current.get(base_sk, {})
        return self.save(
            access_token,
            user_id,
            slot_key,
            existing.get("provider", "openai"),
            existing.get("model", "gpt-4o"),
            system_prompt,
        )
