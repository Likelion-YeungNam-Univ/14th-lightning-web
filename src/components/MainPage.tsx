import { MarketNav } from "./MarketNav";
import { StockList } from "./StockList";
import { EmptyStocks } from "./EmptyStocks";
import { StatusBanner } from "./StatusBanner";
import { StockFeedSection } from "./StockFeedSection";
import { EconKnowledgeStrip } from "./EconKnowledgeStrip";
import type { SourceTab } from "./SourceNav";
import { savedItemToCard } from "../utils/card";
import type { Card, CardListResponse, SavedCardItem, SavedCardListResponse } from "../types/card";
import type { MarketInfo } from "../types/market";
import type { MyStockItem } from "../types/stock";

type Props = {
  markets: MarketInfo[];
  activeMarket: string;
  marketsLoading: boolean;
  marketsError: string;
  activeMarketInfo: MarketInfo | undefined;
  onSelectMarket: (market: string) => void;

  marketStocks: MyStockItem[];
  activeStockCode: string;
  stocksLoading: boolean;
  stocksError: string;
  onSelectStock: (stockCode: string) => void;
  onAddStock: () => void;
  onReorderStocks: (stockCodes: string[]) => void;
  reordering: boolean;
  reorderError: string;

  stockActionError: string;
  stockActionNotice: string;

  activeTab: SourceTab;
  onSelectTab: (tab: SourceTab) => void;

  saveError: string;
  savedResponse: SavedCardListResponse | null;
  savedLoading: boolean;
  savedError: string;
  onRemoveSaved: (item: SavedCardItem) => void;

  cardResponse: CardListResponse | null;
  cardsLoading: boolean;
  cardsError: string;
  canLoadCards: boolean;
  onToggleSave: (card: Card) => void;
  onOpenDetail: (card: Card, tab: string) => void;

  sessionError: string;
};

/** 시장·종목 선택부터 카드 피드까지 메인 화면의 콘텐츠를 렌더링한다. */
export function MainPage({
  markets,
  activeMarket,
  marketsLoading,
  marketsError,
  activeMarketInfo,
  onSelectMarket,
  marketStocks,
  activeStockCode,
  stocksLoading,
  stocksError,
  onSelectStock,
  onAddStock,
  onReorderStocks,
  reordering,
  reorderError,
  stockActionError,
  stockActionNotice,
  activeTab,
  onSelectTab,
  saveError,
  savedResponse,
  savedLoading,
  savedError,
  onRemoveSaved,
  cardResponse,
  cardsLoading,
  cardsError,
  canLoadCards,
  onToggleSave,
  onOpenDetail,
  sessionError,
}: Props) {
  return (
    <main id="main" className="px-6 pt-16">
      <EconKnowledgeStrip />
      <MarketNav
        markets={markets}
        activeMarket={activeMarket}
        marketsLoading={marketsLoading}
        onSelectMarket={onSelectMarket}
      />
      <StockList
        stocks={marketStocks}
        activeStockCode={activeStockCode}
        stocksLoading={stocksLoading}
        stocksError={stocksError}
        onSelectStock={onSelectStock}
        onAddStock={onAddStock}
        onReorderStocks={onReorderStocks}
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
        <EmptyStocks market={activeMarket} onAddStock={onAddStock} />
      ) : (
        <StockFeedSection
          market={activeMarket}
          tabs={activeMarketInfo?.tabs}
          disabled={stocksLoading || !activeStockCode}
          activeTab={activeTab}
          onSelectTab={onSelectTab}
          saveError={saveError}
          savedItems={savedResponse?.items ?? []}
          savedLoading={savedLoading}
          savedError={savedError}
          onRemoveSaved={onRemoveSaved}
          onOpenSaved={(item) => {
            const card = savedItemToCard(item);
            if (card) onOpenDetail(card, item.tab);
          }}
          cards={canLoadCards ? (cardResponse?.items ?? []) : []}
          cardsLoading={canLoadCards && cardsLoading}
          cardsError={canLoadCards ? cardsError : ""}
          cardsReason={canLoadCards ? (cardResponse?.reason ?? null) : null}
          cardsDisclaimer={canLoadCards && (cardResponse?.disclaimer ?? false)}
          linkSentence={
            canLoadCards ? (cardResponse?.link_sentence ?? null) : null
          }
          onToggleSave={onToggleSave}
          onOpenCard={(card) => onOpenDetail(card, activeTab)}
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
  );
}
