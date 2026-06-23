from datetime import UTC, datetime

from app.core.errors import http_error
from app.db.supabase import get_supabase_user_client
from app.modules.auth.dependencies import CurrentUser
from app.modules.projects.schemas import ProjectCreateRequest, ProjectResponse, ProjectUpdateRequest

# Columns to always select from the projects table (must match DB schema)
_SELECT = "id,owner_id,name,description,status,tags,cost,tokens,created_at,updated_at"


class ProjectService:
    def __init__(self) -> None:
        pass

    def list_projects(self, current_user: CurrentUser) -> list[ProjectResponse]:
        client = get_supabase_user_client(current_user.access_token)
        result = (
            client.table("projects")
            .select(_SELECT)
            .eq("owner_id", current_user.id)
            .order("updated_at", desc=True)
            .execute()
        )
        return [ProjectResponse(**row) for row in (result.data or [])]

    def get_project(self, project_id: str, current_user: CurrentUser) -> ProjectResponse:
        row = self._get_project_row(project_id, current_user)
        return ProjectResponse(**row)

    def create_project(self, payload: ProjectCreateRequest, current_user: CurrentUser) -> ProjectResponse:
        client = get_supabase_user_client(current_user.access_token)
        project = {
            "owner_id": current_user.id,
            "name": payload.name.strip(),
            "description": payload.description.strip(),
            "tags": self._normalize_tags(payload.tags),
        }
        result = (
            client.table("projects")
            .insert(project)
            .execute()
        )
        data = result.data[0] if result.data else None
        if data is None:
            raise http_error("Project was not created", status_code=500)
        return ProjectResponse(**data)

    def update_project(
        self,
        project_id: str,
        payload: ProjectUpdateRequest,
        current_user: CurrentUser,
    ) -> ProjectResponse:
        # Verify ownership first
        self._get_project_row(project_id, current_user)
        client = get_supabase_user_client(current_user.access_token)
        patch = payload.model_dump(exclude_unset=True)
        if "name" in patch and patch["name"] is not None:
            patch["name"] = patch["name"].strip()
        if "description" in patch and patch["description"] is not None:
            patch["description"] = patch["description"].strip()
        if "tags" in patch and patch["tags"] is not None:
            patch["tags"] = self._normalize_tags(patch["tags"])

        result = (
            client.table("projects")
            .update(patch)
            .eq("id", project_id)
            .eq("owner_id", current_user.id)
            .execute()
        )
        data = result.data[0] if result.data else None
        if data is None:
            raise http_error("Project was not updated", status_code=500)
        return ProjectResponse(**data)

    def delete_project(self, project_id: str, current_user: CurrentUser) -> None:
        self._get_project_row(project_id, current_user)
        (
            get_supabase_user_client(current_user.access_token)
            .table("projects")
            .delete()
            .eq("id", project_id)
            .eq("owner_id", current_user.id)
            .execute()
        )

    def _get_project_row(self, project_id: str, current_user: CurrentUser) -> dict:
        db = get_supabase_user_client(current_user.access_token)
        result = (
            db.table("projects")
            .select(_SELECT)
            .eq("id", project_id)
            .eq("owner_id", current_user.id)
            .maybe_single()
            .execute()
        )
        if result.data is None:
            raise http_error("Project not found", status_code=404)
        return result.data

    @staticmethod
    def _normalize_tags(tags: list[str]) -> list[str]:
        normalized: list[str] = []
        for tag in tags:
            clean = tag.strip().lower().replace(" ", "-")
            if clean and clean not in normalized:
                normalized.append(clean)
        return normalized[:12]
