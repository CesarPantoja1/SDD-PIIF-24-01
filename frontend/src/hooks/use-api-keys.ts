import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { apiClient } from "@/lib/api/client";
import { DEFAULT_KEYS } from "@/lib/constants";
import type { ApiKeys, ProviderKey } from "@/lib/types";

type TestResult = { ok: boolean; provider: string; error?: string | null };

export function useApiKeys() {
  const { session } = useAuth();
  const token = session?.access_token ?? null;
  const qc = useQueryClient();
  const queryKey = ["api_keys"];

  const { data, isLoading } = useQuery({
    queryKey,
    enabled: !!token,
    queryFn: async (): Promise<ApiKeys> => {
      const res = await apiClient.get<{ keys: ApiKeys }>("/auth/me/api-keys", token);
      return { ...DEFAULT_KEYS, ...res.keys };
    },
    initialData: DEFAULT_KEYS,
  });

  const saveKey = useCallback(
    async (provider: ProviderKey, key: string): Promise<ApiKeys> => {
      const res = await apiClient.put<{ keys: ApiKeys }>(
        "/auth/me/api-keys",
        { provider, key },
        token,
      );
      const next = { ...DEFAULT_KEYS, ...res.keys };
      qc.setQueryData(queryKey, next);
      // Invalidate agent configs so UI reflects any auto-completed changes
      qc.invalidateQueries({ queryKey: ["agent_configs"] });
      return next;
    },
    [token, qc],
  );

  const deleteKey = useCallback(
    async (provider: ProviderKey): Promise<ApiKeys> => {
      const res = await apiClient.delete<{ keys: ApiKeys; provider: string }>(
        `/auth/me/api-keys/${provider}`,
        token,
      );
      const next = { ...DEFAULT_KEYS, ...res.keys };
      qc.setQueryData(queryKey, next);
      // Invalidate agent configs so UI reflects any deleted dependencies
      qc.invalidateQueries({ queryKey: ["agent_configs"] });
      return next;
    },
    [token, qc],
  );

  const testKey = useCallback(
    async (provider: ProviderKey, key?: string): Promise<TestResult> => {
      if (key !== undefined) {
        return apiClient.post<TestResult>("/auth/me/api-keys/test", { provider, key }, token);
      }
      return apiClient.post<TestResult>(`/auth/me/api-keys/${provider}/test`, {}, token);
    },
    [token],
  );

  const revealKey = useCallback(
    async (provider: ProviderKey): Promise<{ provider: string; key: string }> => {
      return apiClient.post<{ provider: string; key: string }>(
        `/auth/me/api-keys/${provider}/reveal`,
        { confirm: true },
        token,
      );
    },
    [token],
  );

  return {
    keys: data ?? DEFAULT_KEYS,
    isLoading,
    saveKey,
    deleteKey,
    testKey,
    revealKey,
  } as const;
}
