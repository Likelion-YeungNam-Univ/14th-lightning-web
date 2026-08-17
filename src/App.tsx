import { useState } from "react";
import { Header } from "./components/Header";
import { MarketNav } from "./components/MarketNav";
import type { SourceTab } from "./components/SourceNav";
import { StockList } from "./components/StockList";
import { AppModals } from "./components/AppModals";
import { EmptyStocks } from "./components/EmptyStocks";
import { StatusBanner } from "./components/StatusBanner";
import { StockFeedSection } from "./components/StockFeedSection";
import { useSession } from "./hooks/useSession";
import { useMarkets } from "./hooks/useMarkets";
import { useStocks } from "./hooks/useStocks";
import { useCards } from "./hooks/useCards";
import { useSavedCards } from "./hooks/useSavedCards";
import { useCardActions } from "./hooks/useCardActions";
import { useStockActions } from "./hooks/useStockActions";
import { useCardDetail } from "./hooks/useCardDetail";
import { savedItemToCard } from "./utils/card";

/** 세션부터 시장·종목·카드·로그인 모달까지 메인 화면의 전체 흐름을 연결한다. */
export default function App() {
  // 첫 진입 세션과 로그인 모달 표시 상태를 관리한다.
  const { authenticated, setAuthenticated, sessionLoading, sessionError } =
    useSession();
  const [loginOpen, setLoginOpen] = useState(false);
  const {
    markets,
    activeMarket,
    setActiveMarket,
    marketsLoading,
    marketsError,
    activeMarketInfo,
    refreshMarkets,
  } = useMarkets();
  const {
    marketStocks,
    activeStockCode,
    setActiveStockCode,
    stocksLoading,
    stocksError,
    reorderStocks,
    reordering,
    reorderError,
    refreshStocks,
  } = useStocks(activeMarket, markets);

  // 선택한 종목과 출처 탭에 맞는 일반 카드와 저장 카드를 각각 조회한다.
  const [activeTab, setActiveTab] = useState<SourceTab>("youtube");
  const { cardResponse, setCardResponse, cardsLoading, cardsError, canLoadCards } =
    useCards(activeStockCode, activeTab, activeMarketInfo, setActiveTab);
  const { savedResponse, setSavedResponse, savedLoading, savedError } =
    useSavedCards(activeStockCode, activeTab);
  const { detailCard, detailTab, setDetailCard, openDetail, closeDetail } =
    useCardDetail();
  const {
    saveError,
    pendingSave,
    saveCard,
    toggleCardSave,
    removeSavedCard,
  } = useCardActions({
    activeStockCode,
    setCardResponse,
    setSavedResponse,
    setDetailCard,
    onRequireLogin: () => setLoginOpen(true),
  });
  const {
    stockModalOpen,
    setStockModalOpen,
    pendingStockChanges,
    stockActionError,
    stockActionNotice,
    completeStockAdd,
    retryPendingStockAdd,
    requireLoginForStocks,
    openStockModal,
  } = useStockActions({
    activeMarket,
    refreshMarkets,
    refreshStocks,
    onRequireLogin: () => setLoginOpen(true),
  });

  // 시장 전환 시 새 시장에서 사용할 수 없는 출처 탭을 첫 번째 탭으로 교체한다.
  const selectMarket = (market: string) => {
    const nextMarket = markets.find((item) => item.market === market);
    setActiveMarket(market);
    setActiveTab((current) => {
      if (current === "saved" || nextMarket?.tabs.includes(current)) {
        return current;
      }
      return (nextMarket?.tabs[0] as SourceTab | undefined) ?? "youtube";
    });
  };

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
          onSelectMarket={selectMarket}
        />
        <StockList
          stocks={marketStocks}
          activeStockCode={activeStockCode}
          stocksLoading={stocksLoading}
          stocksError={stocksError}
          onSelectStock={setActiveStockCode}
          onAddStock={openStockModal}
          onReorderStocks={(stockCodes) => void reorderStocks(stockCodes)}
          reordering={reordering}
        />
        {reorderError && (
          <StatusBanner
            tone="error"
            message={`종목 순서를 저장하지 못했습니다: ${reorderError}`}
          />
        )}
        {stockActionError && (
          <StatusBanner
            tone="error"
            message={`종목을 추가하지 못했습니다: ${stockActionError}`}
          />
        )}
        {stockActionNotice && (
          <StatusBanner tone="info" message={stockActionNotice} />
        )}
        {!stocksLoading && marketStocks.length === 0 && !stocksError ? (
          <EmptyStocks market={activeMarket} onAddStock={openStockModal} />
        ) : (
          <StockFeedSection
            market={activeMarket}
            tabs={activeMarketInfo?.tabs}
            disabled={stocksLoading || !activeStockCode}
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            saveError={saveError}
            savedItems={savedResponse?.items ?? []}
            savedLoading={savedLoading}
            savedError={savedError}
            onRemoveSaved={(item) => void removeSavedCard(item)}
            onOpenSaved={(item) => {
              const card = savedItemToCard(item);
              if (card) openDetail(card, item.tab);
            }}
            cards={canLoadCards ? (cardResponse?.items ?? []) : []}
            cardsLoading={canLoadCards && cardsLoading}
            cardsError={canLoadCards ? cardsError : ""}
            cardsReason={canLoadCards ? (cardResponse?.reason ?? null) : null}
            cardsDisclaimer={canLoadCards && (cardResponse?.disclaimer ?? false)}
            linkSentence={
              canLoadCards ? (cardResponse?.link_sentence ?? null) : null
            }
            onToggleSave={(card) => void toggleCardSave(card)}
            onOpenCard={(card) => openDetail(card, activeTab)}
          />
        )}
        {marketsError && (
          <p className="mt-4 text-sm text-[#f0a868]">
            시장 정보를 불러오지 못했습니다: {marketsError}
          </p>
        )}
        {sessionError && (
          <StatusBanner
            tone="error"
            message={`API 서버 연결 실패: ${sessionError}`}
          />
        )}
      </main>
      <AppModals
        loginOpen={loginOpen}
        onLoginClose={() => setLoginOpen(false)}
        onLoginSuccess={() => {
          // 로그인 전에 보류된 카드 저장과 종목 변경 요청을 성공 후 다시 실행한다.
          setAuthenticated(true);
          setLoginOpen(false);
          if (pendingSave) {
            void saveCard(pendingSave.card, pendingSave.stockCode);
          }
          if (pendingStockChanges) {
            void retryPendingStockAdd(pendingStockChanges);
          }
        }}
        stockModalOpen={stockModalOpen}
        activeMarket={activeMarket}
        marketStocks={marketStocks}
        onStockModalClose={() => setStockModalOpen(false)}
        onStockUpdated={completeStockAdd}
        onStockAuthRequired={requireLoginForStocks}
        detailCard={detailCard}
        detailTab={detailTab}
        onDetailClose={closeDetail}
        onToggleSave={(card) => void toggleCardSave(card)}
      />
    </div>
  );
}
