import { useEffect, useState } from "react";
import { getApi } from "../api/client";
import type { PointBalanceResponse } from "../types/points";

export function usePoints(authenticated: boolean) {
  const [points, setPoints] = useState<PointBalanceResponse | null>(null);

  useEffect(() => {
    if (!authenticated) return;

    let cancelled = false;
    const loadPoints = async () => {
      try {
        const response = await getApi<PointBalanceResponse>("/me/points");
        if (!cancelled) setPoints(response);
      } catch {
        if (!cancelled) setPoints(null);
      }
    };
    void loadPoints();
    return () => {
      cancelled = true;
    };
  }, [authenticated]);

  return authenticated ? points : null;
}
