"use client";

import { useCallback, useEffect, useState } from "react";

export function useVendorQuery<T>(enabled: boolean, loader: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refetch = useCallback(() => {
    setReloadKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!enabled) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await loader();
        if (!cancelled) {
          setData(response);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Something went wrong");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [enabled, loader, reloadKey]);

  return { data, loading, error, refetch };
}