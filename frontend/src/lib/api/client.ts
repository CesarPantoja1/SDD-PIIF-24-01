/**
 * Thin HTTP client that forwards every request to the KOSMO FastAPI backend.
 * The Supabase JWT (access_token) is injected automatically as Authorization header.
 *
 * Usage:
 *   import { apiClient } from "@/lib/api/client";
 *   const data = await apiClient.get("/auth/me", token);
 */

const BACKEND_URL =
  (import.meta.env.VITE_BACKEND_URL as string | undefined) ??
  "http://localhost:8000";

const API_PREFIX = "/api/v1";

type RequestOptions = {
  token?: string | null;
  body?: unknown;
};

async function request<T>(
  method: string,
  path: string,
  { token, body }: RequestOptions = {}
): Promise<T> {
  const url = `${BACKEND_URL}${API_PREFIX}${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const json = (await response.json()) as { detail?: string };
      if (json.detail) detail = json.detail;
    } catch {
      /* ignore parse errors */
    }
    throw new Error(detail);
  }

  // 204 No Content → return undefined
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string, token?: string | null) =>
    request<T>("GET", path, { token }),

  post: <T>(path: string, body: unknown, token?: string | null) =>
    request<T>("POST", path, { token, body }),

  patch: <T>(path: string, body: unknown, token?: string | null) =>
    request<T>("PATCH", path, { token, body }),

  delete: <T = void>(path: string, token?: string | null) =>
    request<T>("DELETE", path, { token }),

  put: <T>(path: string, body: unknown, token?: string | null) =>
    request<T>("PUT", path, { token, body }),
};
