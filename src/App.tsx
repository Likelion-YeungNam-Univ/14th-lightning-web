import { useCallback, useState } from "react";
import { Header } from "./components/Header";
import type { SourceTab } from "./components/SourceNav";
import { AppModals } from "./components/AppModals";
import { MainPage } from "./components/MainPage";
import { useSession } from "./hooks/useSession";
import { useMarkets } from "./hooks/useMarkets";
import { useStocks } from "./hooks/useStocks";
import { useCards } from "./hooks/useCards";
import { useSavedCards } from "./hooks/useSavedCards";
import { useCardActions } from "./hooks/useCardActions";
import { useStockActions } from "./hooks/useStockActions";
import { useCardDetail } from "./hooks/useCardDetail";
import { usePoints } from "./hooks/usePoints";
import { logout } from "./api/auth";
import type { AccountResponse } from "./types/session";
import { LOGIN_ID_STORAGE_KEY } from "./types/session";

const ACTIVE_TAB_KEY = "assit:active-source-tab";

function initialSourceTab(): SourceTab {
  const value = sessionStorage.getItem(ACTIVE_TAB_KEY);
  return value === "youtube" || value === "disclosure" || value === "regulation" || value === "bok" || value === "fed" || value === "saved" || value === "community"
    ? value
    : "youtube";
}

/** 세션부터 시장·종목·카드·로그인 모달까지 메인 화면의 전체 흐름을 연결한다. */
export default function App() {
  // 첫 진입 세션과 로그인 모달 표시 상태를 관리한다.
  const { authenticated, setAuthenticated, account, setAccount, sessionLoading, sessionError } =
    useSession();
  const [loginOpen, setLoginOpen] = useState(false);
  const { points, spendPoints } = usePoints(authenticated);
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
  const [activeTab, setActiveTab] = useState<SourceTab>(initialSourceTab);
  const selectTab = useCallback((tab: SourceTab) => {
    sessionStorage.setItem(ACTIVE_TAB_KEY, tab);
    setActiveTab(tab);
  }, []);
  const { cardResponse, setCardResponse, cardsLoading, cardsError, canLoadCards } =
    useCards(activeStockCode, activeTab, activeMarketInfo, selectTab);
  const { savedResponse, setSavedResponse, savedLoading, savedError } =
    useSavedCards(activeStockCode, activeTab);
  const { detailCard, detailTab, detailLinkSentence, setDetailCard, openDetail, closeDetail } =
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
      if (
        current === "saved" ||
        current === "community" ||
        nextMarket?.tabs.includes(current)
      ) {
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
        points={points}
        account={account}
        onLoginClick={() => setLoginOpen(true)}
        onLogoutClick={() => {
          void logout().finally(() => {
            window.localStorage.removeItem(LOGIN_ID_STORAGE_KEY);
            setAuthenticated(false);
            setAccount(null);
          });
        }}
        onNicknameChange={(nickname) =>
          setAccount((current) =>
            current
              ? { ...current, nickname }
              : { login_id: "", nickname, authenticated: true },
          )
        }
      />
      <MainPage
        authenticated={authenticated}
        pointBalance={points?.balance ?? 0}
        onSpendPoints={spendPoints}
        markets={markets}
        activeMarket={activeMarket}
        marketsLoading={marketsLoading}
        marketsError={marketsError}
        activeMarketInfo={activeMarketInfo}
        onSelectMarket={selectMarket}
        marketStocks={marketStocks}
        activeStockCode={activeStockCode}
        stocksLoading={stocksLoading}
        stocksError={stocksError}
        onSelectStock={setActiveStockCode}
        onAddStock={openStockModal}
        onReorderStocks={(stockCodes) => void reorderStocks(stockCodes)}
        reordering={reordering}
        reorderError={reorderError}
        stockActionError={stockActionError}
        stockActionNotice={stockActionNotice}
        activeTab={activeTab}
        onSelectTab={selectTab}
        saveError={saveError}
        savedResponse={savedResponse}
        savedLoading={savedLoading}
        savedError={savedError}
        onRemoveSaved={(item) => void removeSavedCard(item)}
        cardResponse={cardResponse}
        cardsLoading={cardsLoading}
        cardsError={cardsError}
        canLoadCards={canLoadCards}
        onToggleSave={(card, tab) => void toggleCardSave(card, tab)}
        onOpenDetail={openDetail}
        sessionError={sessionError}
      />
      <AppModals
        loginOpen={loginOpen}
        onLoginClose={() => setLoginOpen(false)}
        onLoginSuccess={(nextAccount: AccountResponse) => {
          // 로그인 전에 보류된 카드 저장과 종목 변경 요청을 성공 후 다시 실행한다.
          setAuthenticated(true);
          setAccount(nextAccount);
          setLoginOpen(false);
          if (pendingSave) {
            void saveCard(
              pendingSave.card,
              pendingSave.stockCode,
              pendingSave.tab,
            );
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
        detailLinkSentence={detailLinkSentence}
        onDetailClose={closeDetail}
        onToggleSave={(card, tab) => void toggleCardSave(card, tab)}
      />
    </div>
  );
}
