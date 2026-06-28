from fastapi import APIRouter, Depends, Response, status

from app.modules.auth.dependencies import CurrentUser, get_current_user
from app.db.supabase import get_supabase_user_client
from app.modules.projects.schemas import ProjectCreateRequest, ProjectListResponse, ProjectResponse, ProjectUpdateRequest, DocumentUpdateRequest
from app.modules.projects.service import ProjectService


router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=ProjectListResponse)
def list_projects(current_user: CurrentUser = Depends(get_current_user)) -> ProjectListResponse:
    return ProjectListResponse(items=ProjectService().list_projects(current_user))


@router.post("", response_model=ProjectResponse, status_code=201)
def create_project(
    payload: ProjectCreateRequest,
    current_user: CurrentUser = Depends(get_current_user),
) -> ProjectResponse:
    return ProjectService().create_project(payload, current_user)


@router.get("/{project_id}/documents/{doc_key}")
def get_document(
    project_id: str,
    doc_key: str,
    spec_id: str | None = None,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get a document. If spec_id is provided, gets the spec-level document (e.g. requirements), otherwise gets project-level document (e.g. brief)."""
    client = get_supabase_user_client(current_user.access_token)
    
    query = client.table("documents").select("content,generated").eq("project_id", project_id).eq("doc_key", doc_key)
    if spec_id:
        query = query.eq("spec_id", spec_id)
    else:
        query = query.is_("spec_id", "null")
        
    result = query.execute()

    if result and result.data and len(result.data) > 0:
        return {
            "content": result.data[0].get("content"),
            "generated": result.data[0].get("generated", False),
        }
    return {"content": None, "generated": False}


@router.put("/{project_id}/documents/{doc_key}")
def update_document(
    project_id: str,
    doc_key: str,
    payload: DocumentUpdateRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Upsert a document's content."""
    client = get_supabase_user_client(current_user.access_token)
    
    # We upsert based on project_id, doc_key and optionally spec_id
    data = {
        "project_id": project_id,
        "doc_key": doc_key,
        "content": payload.content,
    }
    if payload.spec_id:
        data["spec_id"] = payload.spec_id
        
    result = client.table("documents").upsert(data, on_conflict="project_id,doc_key,spec_id").execute()
    return {"status": "success"}

@router.get("/{project_id}/specs")
def get_project_specs(
    project_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get all specs for a project."""
    client = get_supabase_user_client(current_user.access_token)
    result = (
        client.table("specs")
        .select("id,name,description,position")
        .eq("project_id", project_id)
        .order("position")
        .execute()
    )
    if result and result.data:
        return result.data
    return []


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: str,
    current_user: CurrentUser = Depends(get_current_user),
) -> ProjectResponse:
    return ProjectService().get_project(project_id, current_user)


@router.patch("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: str,
    payload: ProjectUpdateRequest,
    current_user: CurrentUser = Depends(get_current_user),
) -> ProjectResponse:
    return ProjectService().update_project(project_id, payload, current_user)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: str,
    current_user: CurrentUser = Depends(get_current_user),
) -> Response:
    ProjectService().delete_project(project_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

