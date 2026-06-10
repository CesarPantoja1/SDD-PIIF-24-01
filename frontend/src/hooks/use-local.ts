import { useEffect, useRef, useState } from "react";

/**
 * Reactive localStorage hook with cross-component sync via a custom
 * `kosmo:local` event (plus a synthetic `storage` event for cross-tab).
 *
 * Behavior:
 * - Hydrates from localStorage on mount.
 * - Persists on every change after hydration.
 * - Listens to `kosmo:local` events with `{ key, value }` to stay in sync.
 */
export function useLocal<T>(key: string, initial: T) {
  const [v, setV] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);
  const fromSync = useRef(false);

  useEffect(() => {
    const loadFromStorage = () => {
      try {
        const r = localStorage.getItem(key);
        if (r) {
          const parsed = JSON.parse(r) as T;
          setV(parsed);
        }
      } catch {}
    };

    loadFromStorage();
    setHydrated(true);

    const onSync = (e: Event) => {
      const ce = e as CustomEvent<{ key: string; value: unknown }>;
      if (ce.detail?.key === key) {
        fromSync.current = true;
        setV(ce.detail.value as T);
      }
    };
    window.addEventListener("kosmo:local", onSync as EventListener);
    return () => window.removeEventListener("kosmo:local", onSync as EventListener);
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    if (fromSync.current) { fromSync.current = false; return; }
    try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
    try {
      window.dispatchEvent(new CustomEvent("kosmo:local", { detail: { key, value: v } }));
      window.dispatchEvent(new StorageEvent("storage", { key, newValue: JSON.stringify(v) }));
    } catch {}
  }, [key, v, hydrated]);

  return [v, setV] as const;
}