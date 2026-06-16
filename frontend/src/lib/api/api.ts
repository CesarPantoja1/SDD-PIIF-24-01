/**
 * Typed API functions for the KOSMO FastAPI backend.
 * Import these instead of calling Supabase directly for business logic.
 *
 * Auth (signup / login) still goes through the Supabase JS client in
 * use-auth.tsx because we need the Supabase session for real-time & storage.
 * The backend mirrors those operations and handles DB-level business rules.
 */

import { apiClient } from "./client";

// ─── Types (mirror backend Pydantic schemas) ──────────────────────────────

export type ProfileResponse = {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
};

export type ProjectResponse = {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  status: "active" | "paused" | "archived";
  tags: string[];
  cost: number;
  tokens: number;
  created_at: string;
  updated_at: string;
};

export type ProjectListResponse = {
  items: ProjectResponse[];
};

export type ProjectCreateBody = {
  name: string;
  description?: string;
  tags?: string[];
};

export type ProjectUpdateBody = {
  name?: string;
  description?: string;
  status?: "active" | "paused" | "archived";
  tags?: string[];
};

// ─── Auth / Profile ───────────────────────────────────────────────────────

/** GET /auth/me – fetch the current user's profile */
export async function fetchMe(token: string): Promise<ProfileResponse> {
  return apiClient.get<ProfileResponse>("/auth/me", token);
}

/** PATCH /auth/me – update display_name */
export async function updateMe(
  token: string,
  display_name: string
): Promise<ProfileResponse> {
  return apiClient.patch<ProfileResponse>("/auth/me", { display_name }, token);
}

// ─── Projects ─────────────────────────────────────────────────────────────

/** GET /projects – list all projects for the authenticated user */
export async function listProjects(token: string): Promise<ProjectResponse[]> {
  const res = await apiClient.get<ProjectListResponse>("/projects", token);
  return res.items;
}

/** POST /projects – create a new project */
export async function createProject(
  token: string,
  body: ProjectCreateBody
): Promise<ProjectResponse> {
  return apiClient.post<ProjectResponse>("/projects", body, token);
}

/** GET /projects/:id – get a single project */
export async function getProject(
  token: string,
  projectId: string
): Promise<ProjectResponse> {
  return apiClient.get<ProjectResponse>(`/projects/${projectId}`, token);
}

/** PATCH /projects/:id – update a project */
export async function updateProject(
  token: string,
  projectId: string,
  body: ProjectUpdateBody
): Promise<ProjectResponse> {
  return apiClient.patch<ProjectResponse>(
    `/projects/${projectId}`,
    body,
    token
  );
}

/** DELETE /projects/:id – soft-delete a project */
export async function deleteProject(
  token: string,
  projectId: string
): Promise<void> {
  await apiClient.delete(`/projects/${projectId}`, token);
}
