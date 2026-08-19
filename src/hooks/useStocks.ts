import { useEffect, useState } from "react";
import { getApi, putApi } from "../api/client";
import type { MarketInfo } from "../types/market";
import type {
  MyStockItem,
  MyStocksResponse,
  StockOrderRequest,
  StockOrderResponse,
} from "../types/stock";

export function useStocks(activeMarket: string, markets: MarketInfo[]) {
  // 현재 시장의 종목 목록과 화면에서 선택한 종목 코드를 관리한다.
  const [marketStocks, setMarketStocks] = useState<MyStockItem[]>([]);
  const [activeStockCode, setActiveStockCode] = useState("");
  const [stocksLoading, setStocksLoading] = useState(false);
  const [stocksError, setStocksError] = useState("");
  const [reordering, setReordering] = useState(false);
  const [reorderError, setReorderError] = useState("");
  const [stockRefreshKey, setStockRefreshKey] = useState(0);

  // 시장이 바뀌거나 목록 갱신이 요청되면 등록 종목을 다시 조회한다.
  useEffect(() => {
    if (!activeMarket) return;
    let cancelled = false;
    const loadStocks = async () => {
      setStocksLoading(true);
      setStocksError("");
      try {
        const response = await getApi<MyStocksResponse>(
          `/me/stocks?market=${encodeURIComponent(activeMarket)}`,
        );
        if (cancelled) return;
        const ordered = [...response.items].sort(
          (a, b) => a.display_order - b.display_order,
        );
        const lastStockCode = markets.find(
          (market) => market.market === activeMarket,
        )?.last_stock_code;

        // 서버의 노출 순서대로 목록을 저장하고 마지막 선택 종목을 우선 복원한다.
        setMarketStocks(ordered);
        setActiveStockCode((current) =>
          ordered.some((stock) => stock.stock_code === current)
            ? current
            : ordered.some((stock) => stock.stock_code === lastStockCode)
              ? (lastStockCode ?? "")
              : (ordered[0]?.stock_code ?? ""),
        );
      } catch (error) {
        if (cancelled) return;
        setMarketStocks([]);
        setActiveStockCode("");
        setStocksError(
          error instanceof Error
            ? error.message
            : "종목을 불러오지 못했습니다.",
        );
      } finally {
        if (!cancelled) setStocksLoading(false);
      }
    };
    void loadStocks();
    return () => {
      cancelled = true;
    };
  }, [activeMarket, markets, stockRefreshKey]);

  // 종목 추가 또는 삭제 후 조회 효과를 다시 실행한다.
  const refreshStocks = () => setStockRefreshKey((current) => current + 1);

  /** 드래그 결과를 먼저 반영하고 서버 저장 실패 시 기존 순서로 복구한다. */
  const reorderStocks = async (stockCodes: string[]) => {
    if (!activeMarket || reordering || stockCodes.length !== marketStocks.length) {
      return;
    }

    const stockByCode = new Map(
      marketStocks.map((stock) => [stock.stock_code, stock]),
    );
    const reordered = stockCodes
      .map((stockCode, index) => {
        const stock = stockByCode.get(stockCode);
        return stock ? { ...stock, display_order: index } : null;
      })
      .filter((stock): stock is MyStockItem => stock !== null);

    if (reordered.length !== marketStocks.length) return;

    const previousStocks = marketStocks;

    // 사용자가 바로 결과를 확인할 수 있도록 API 응답 전에 순서를 반영한다.
    setMarketStocks(reordered);
    setReordering(true);
    setReorderError("");

    try {
      const request: StockOrderRequest = {
        market: activeMarket,
        stock_codes: stockCodes,
      };
      const response = await putApi<StockOrderResponse>(
        "/me/stocks/order",
        request,
      );

      // 서버가 확정한 순서가 있으면 이를 최종 화면 순서로 다시 반영한다.
      if (response?.stocks?.length === reordered.length) {
        const reorderedByCode = new Map(
          reordered.map((stock) => [stock.stock_code, stock]),
        );
        const confirmed = response.stocks
          .map((stockCode, index) => {
            const stock = reorderedByCode.get(stockCode);
            return stock ? { ...stock, display_order: index } : null;
          })
          .filter((stock): stock is MyStockItem => stock !== null);

        if (confirmed.length === reordered.length) setMarketStocks(confirmed);
      }
    } catch (error) {
      // 저장 실패 시 낙관적으로 변경했던 목록을 이전 순서로 되돌린다.
      setMarketStocks(previousStocks);
      setReorderError(
        error instanceof Error
          ? error.message
          : "종목 순서를 저장하지 못했습니다.",
      );
    } finally {
      setReordering(false);
    }
  };

  return {
    marketStocks,
    activeStockCode,
    setActiveStockCode,
    stocksLoading,
    stocksError,
    reorderStocks,
    reordering,
    reorderError,
    refreshStocks,
  };
}
