import { useLayoutEffect, useState } from "react";
import { ApiError, getApi } from "../api/client";
import type { SourceTab } from "../components/SourceNav";
import type { CardListResponse } from "../types/card";
import type { MarketInfo } from "../types/market";

/** 선택한 종목과 출처 탭의 카드 목록 및 조회 상태를 관리한다. */
export function useCards(
  activeStockCode: string,
  activeTab: SourceTab,
  activeMarketInfo: MarketInfo | undefined,
  onInvalidCombination: (tab: SourceTab) => void,
) {
  const [cardResponse, setCardResponse] = useState<CardListResponse | null>(
    null,
  );
  const [cardsLoading, setCardsLoading] = useState(false);
  const [cardsError, setCardsError] = useState("");
  const canLoadCards = Boolean(
    activeStockCode && activeTab !== "saved" && activeTab !== "community",
  );

  // 종목 또는 출처 탭이 바뀌면 해당 조합으로 GET /cards를 호출한다.
  useLayoutEffect(() => {
    if (
      !activeStockCode ||
      activeTab === "saved" ||
      activeTab === "community"
    ) {
      return;
    }
    let cancelled = false;
    const loadCards = async () => {
      setCardResponse(null);
      setCardsLoading(true);
      setCardsError("");
      try {
        const response = await getApi<CardListResponse>(
          `/cards?tab=${encodeURIComponent(activeTab)}&stock_code=${encodeURIComponent(activeStockCode)}`,
        );
        if (!cancelled) {
          setCardResponse(response);
        }
      } catch (error) {
        if (cancelled) return;

        // 유효하지 않은 시장·탭 조합이면 현재 시장의 첫 번째 탭으로 이동한다.
        if (error instanceof ApiError && error.code === "invalid_combination") {
          const firstTab = activeMarketInfo?.tabs[0] as SourceTab | undefined;
          if (firstTab && firstTab !== activeTab) {
            onInvalidCombination(firstTab);
            return;
          }
        }
        setCardResponse(null);
        setCardsError(
          error instanceof Error ? error.message : "자료를 불러오지 못했습니다.",
        );
      } finally {
        if (!cancelled) setCardsLoading(false);
      }
    };
    void loadCards();
    return () => {
      cancelled = true;
    };
  }, [activeStockCode, activeTab, activeMarketInfo, onInvalidCombination]);

  return { cardResponse, setCardResponse, cardsLoading, cardsError, canLoadCards };
}
