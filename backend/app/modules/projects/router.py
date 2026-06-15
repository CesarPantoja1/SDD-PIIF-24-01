from fastapi import APIRouter, Depends, Response, status

from app.modules.auth.dependencies import CurrentUser, get_current_user
from app.modules.projects.schemas import ProjectCreateRequest, ProjectListResponse, ProjectResponse, ProjectUpdateRequest
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

