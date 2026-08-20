import { useEffect, useState } from "react";
import { getApi } from "../api/client";
import type { PointBalanceResponse } from "../types/points";

export function usePoints(authenticated: boolean, sessionReady = authenticated) {
  const [points, setPoints] = useState<PointBalanceResponse | null>(null);

  useEffect(() => {
    if (!sessionReady) return;

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
  }, [authenticated, sessionReady]);

  const visiblePoints = authenticated ? points : null;
  const spendPoints = (amount: number) => {
    setPoints((current) => current ? {
      ...current,
      balance: Math.max(0, current.balance - amount),
      pizza_progress: {
        ...current.pizza_progress,
        held: Math.max(0, current.pizza_progress.held - amount),
        percent: Math.max(0, Math.round((Math.max(0, current.pizza_progress.held - amount) / current.pizza_progress.target) * 100)),
      },
    } : current);
  };

  return { points: visiblePoints, sessionPoints: points, spendPoints };
}
