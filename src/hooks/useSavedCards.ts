import { useLayoutEffect, useState } from "react";
import { getApi } from "../api/client";
import type { SourceTab } from "../components/SourceNav";
import type { SavedCardListResponse } from "../types/card";

/** 저장 탭이 선택됐을 때 현재 종목의 저장 카드 목록을 조회한다. */
export function useSavedCards(activeStockCode: string, activeTab: SourceTab) {
  const [savedResponse, setSavedResponse] =
    useState<SavedCardListResponse | null>(null);
  const [savedLoading, setSavedLoading] = useState(false);
  const [savedError, setSavedError] = useState("");

  // 일반 출처 탭에서는 요청하지 않고 저장 탭 진입 시에만 API를 호출한다.
  useLayoutEffect(() => {
    if (!activeStockCode || activeTab !== "saved") return;
    let cancelled = false;
    const loadSavedCards = async () => {
      setSavedResponse(null);
      setSavedLoading(true);
      setSavedError("");
      try {
        const response = await getApi<SavedCardListResponse>(
          `/me/saved-cards?stock_code=${encodeURIComponent(activeStockCode)}`,
        );
        if (!cancelled) setSavedResponse(response);
      } catch (error) {
        if (cancelled) return;
        setSavedResponse(null);
        setSavedError(
          error instanceof Error
            ? error.message
            : "저장한 자료를 불러오지 못했습니다.",
        );
      } finally {
        if (!cancelled) setSavedLoading(false);
      }
    };
    void loadSavedCards();
    return () => {
      cancelled = true;
    };
  }, [activeStockCode, activeTab]);

  return { savedResponse, setSavedResponse, savedLoading, savedError };
}
