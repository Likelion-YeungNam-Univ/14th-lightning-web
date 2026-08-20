import { useEffect, useState } from "react";
import { getApi, postApi } from "../api/client";
import type {
  GifticonExchangeResponse,
  PointBalanceResponse,
  PointChargeResponse,
} from "../types/points";

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

  const applyBalance = (balance: number) => {
    setPoints((current) => {
      if (!current) return current;
      const target = current.pizza_progress.target;
      return {
        ...current,
        balance,
        pizza_progress: {
          ...current.pizza_progress,
          held: balance,
          percent: Math.min(100, Math.max(0, Math.round((balance / target) * 100))),
        },
      };
    });
  };

  const chargePoints = async (amount: number) => {
    const response = await postApi<PointChargeResponse>("/me/points/charge", {
      amount,
    });
    applyBalance(response.balance);
    return response;
  };

  const redeemGifticon = async () => {
    const response = await postApi<GifticonExchangeResponse>("/me/gifticons");
    applyBalance(response.balance);
    return response;
  };

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

  return {
    points: visiblePoints,
    sessionPoints: points,
    spendPoints,
    chargePoints,
    redeemGifticon,
  };
}
