import { useEffect, useState } from "react";
import { getApi } from "../api/client";
import type { MarketInfo, MarketsResponse } from "../types/market";

export function useMarkets() {
  // API가 제공하는 시장 목록과 사용자가 선택한 시장을 관리한다.
  const [markets, setMarkets] = useState<MarketInfo[]>([]);
  const [activeMarket, setActiveMarket] = useState("");
  const [marketsLoading, setMarketsLoading] = useState(true);
  const [marketsError, setMarketsError] = useState("");
  const activeMarketInfo = markets.find(
    (market) => market.market === activeMarket,
  );

  // 첫 화면 진입 시 시장 목록을 조회하고 첫 번째 시장을 기본값으로 선택한다.
  useEffect(() => {
    const loadMarkets = async () => {
      try {
        const response = await getApi<MarketsResponse>("/markets");
        setMarkets(response.markets);
        setActiveMarket((current) => current || response.markets[0]?.market || "");
      } catch (error) {
        setMarketsError(
          error instanceof Error
            ? error.message
            : "시장 정보를 불러오지 못했습니다.",
        );
      } finally {
        setMarketsLoading(false);
      }
    };
    void loadMarkets();
  }, []);

  // 종목 추가 또는 삭제 후 stock_count와 last_stock_code를 다시 조회한다.
  const refreshMarkets = async () => {
    try {
      const response = await getApi<MarketsResponse>("/markets");
      setMarkets(response.markets);
      setMarketsError("");
      setActiveMarket((current) =>
        response.markets.some((market) => market.market === current)
          ? current
          : (response.markets[0]?.market ?? ""),
      );
    } catch (error) {
      setMarketsError(
        error instanceof Error
          ? error.message
          : "시장 정보를 다시 불러오지 못했습니다.",
      );
    }
  };

  return {
    markets,
    activeMarket,
    setActiveMarket,
    marketsLoading,
    marketsError,
    activeMarketInfo,
    refreshMarkets,
  };
}
