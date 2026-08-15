import { useEffect, useState } from "react";
import { getApi, postApi } from "./api/client";
import { Header } from "./components/Header";
import { LoginModal } from "./components/LoginModal";
import { MarketNav } from "./components/MarketNav";
import { SourceNav } from "./components/SourceNav";
import { StockList } from "./components/StockList";
import type {
  MarketInfo,
  MarketsResponse,
  MyStockItem,
  MyStocksResponse,
  SessionResponse,
} from "./types/api";

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);
  const [markets, setMarkets] = useState<MarketInfo[]>([]);
  const [activeMarket, setActiveMarket] = useState("");
  const [marketsLoading, setMarketsLoading] = useState(true);
  const [marketsError, setMarketsError] = useState("");
  const [marketStocks, setMarketStocks] = useState<MyStockItem[]>([]);
  const [activeStockCode, setActiveStockCode] = useState("");
  const [stocksLoading, setStocksLoading] = useState(false);
  const [stocksError, setStocksError] = useState("");

  useEffect(() => {
    const initialize = async () => {
      try {
        const session = await postApi<SessionResponse>("/session");
        setAuthenticated(session.authenticated);
      } catch (error) {
        setSessionError(
          error instanceof Error
            ? error.message
            : "세션을 연결하지 못했습니다.",
        );
      } finally {
        setSessionLoading(false);
      }
      try {
        const marketResponse = await getApi<MarketsResponse>("/markets");
        setMarkets(marketResponse.markets);
        setActiveMarket((current) => current || marketResponse.markets[0]?.market || "");
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
    void initialize();
  }, []);

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
        setMarketStocks(ordered);
        setActiveStockCode((current) =>
          ordered.some((stock) => stock.stock_code === current)
            ? current
            : ordered[0]?.stock_code ?? "",
        );
      } catch (error) {
        if (cancelled) return;
        setMarketStocks([]);
        setActiveStockCode("");
        setStocksError(
          error instanceof Error ? error.message : "종목을 불러오지 못했습니다.",
        );
      } finally {
        if (!cancelled) setStocksLoading(false);
      }
    };
    void loadStocks();
    return () => {
      cancelled = true;
    };
  }, [activeMarket]);

  return (
    <div className="min-h-screen bg-[#0f1115] text-[#f2f3f5]">
      <Header
        authenticated={authenticated}
        sessionLoading={sessionLoading}
        onLoginClick={() => setLoginOpen(true)}
      />
      <main id="main" className="px-6 pt-16">
        <MarketNav
          markets={markets}
          activeMarket={activeMarket}
          marketsLoading={marketsLoading}
          onSelectMarket={setActiveMarket}
        />
        <StockList
          stocks={marketStocks}
          activeStockCode={activeStockCode}
          stocksLoading={stocksLoading}
          stocksError={stocksError}
          onSelectStock={setActiveStockCode}
        />
        <SourceNav
          key={activeMarket}
          market={activeMarket}
          disabled={stocksLoading || !activeStockCode}
        />
        {marketsError && (
          <p role="status" className="mt-4 text-sm text-[#f0a868]">
            시장 정보를 불러오지 못했습니다: {marketsError}
          </p>
        )}
        {sessionError && (
          <p
            role="status"
            className="mt-4 rounded-lg border border-[#634b2f] bg-[#2a2119] px-4 py-3 text-sm text-[#f0a868]"
          >
            API 서버 연결 실패: {sessionError}
          </p>
        )}
      </main>
      {loginOpen && (
        <LoginModal
          onClose={() => setLoginOpen(false)}
          onLoginSuccess={() => {
            setAuthenticated(true);
            setLoginOpen(false);
          }}
        />
      )}
    </div>
  );
}
