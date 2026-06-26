/**
 * Typed API functions for the KOSMO FastAPI backend.
 * Import these instead of calling Supabase directly for business logic.
 *
 * Auth (signup / login) still goes through the Supabase JS client in
 * use-auth.tsx because we need the Supabase session for real-time & storage.
 * The backend mirrors those operations and handles DB-level business rules.
 */

import { apiClient } from "./client";

const BACKEND_URL =
  (import.meta.env.VITE_BACKEND_URL as string | undefined) ??
  "http://localhost:8000";

// ─── Types (mirror backend Pydantic schemas) ──────────────────────────────

export type ProfileResponse = {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
};

export type AuthSessionResponse = {
  access_token: string | null;
  refresh_token: string | null;
  token_type: string;
  expires_in: number | null;
  user: ProfileResponse;
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

/** GET /projects/:id/specs – get specs for a project */
export async function fetchSpecs(
  token: string,
  projectId: string
): Promise<any[]> {
  return apiClient.get<any[]>(`/projects/${projectId}/specs`, token);
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

// ─── Agents ─────────────────────────────────────────────────────────────────

export type AgentConfigResponse = {
  configs: Record<string, { provider: string; model: string; system_prompt: string }>;
  rubrics?: Record<string, string>;
};

export type Evaluation = {
  iteration: number;
  result: string;
  explanation: string;
  criteria: { name: string; passed: boolean; gap?: string }[];
};

/** GET /agents/configs – get agent configs with defaults */
export async function getAgentConfigs(token: string): Promise<AgentConfigResponse> {
  return apiClient.get<AgentConfigResponse>("/agents/configs", token);
}

/** PUT /agents/configs/{slot_key} – save agent config */
export async function saveAgentConfig(
  token: string,
  slotKey: string,
  body: { provider: string; model: string; system_prompt: string }
): Promise<{ slot_key: string; status: string }> {
  return apiClient.put(`/agents/configs/${slotKey}`, body, token);
}

/** SSE: generate discovery or specs with real-time evaluations */
export function streamDiscovery(
  token: string,
  projectId: string,
  provider: string,
  model: string,
  docKey: string,
  onEvaluation: (data: Evaluation) => void,
  onComplete: (data: Record<string, unknown>) => void,
  onError: (error: string) => void,
  specId?: string | null,
): AbortController {
  const controller = new AbortController();
  const url = `${BACKEND_URL}/api/v1/agents/projects/${projectId}/generate/stream`;

  fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ provider, model, doc_key: docKey, spec_id: specId }),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        const text = await response.text();
        let detail = text;
        try { detail = JSON.parse(text).detail; } catch {}
        onError(detail);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) { onError("No response body"); return; }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let eventType = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (eventType === "rubric_evaluation") {
              try { onEvaluation(JSON.parse(data)); } catch {}
            } else if (eventType === "complete") {
              try {
                const parsed = JSON.parse(data);
                onComplete(parsed);
              } catch {}
              return;
            } else if (eventType === "error") {
              try {
                const parsed = JSON.parse(data);
                onError(parsed.error || "Unknown error");
              } catch { onError("Unknown error"); }
              return;
            }
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== "AbortError") {
        onError(err.message || "Connection failed");
      }
    });

  return controller;
}
