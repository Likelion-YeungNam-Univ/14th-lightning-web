import { SourceNav, type SourceTab } from "./SourceNav";
import { SavedCardFeed } from "./SavedCardFeed";
import { CardFeed } from "./CardFeed";
import { StatusBanner } from "./StatusBanner";
import CommunityFeed from './CommunityFeed';
import type { Card, SavedCardItem } from "../types/card";

type StockFeedSectionProps = {
  market: string;
  stockName: string;
  stockCode: string;
  authenticated: boolean;
  tabs?: string[];
  disabled: boolean;
  activeTab: SourceTab;
  onSelectTab: (tab: SourceTab) => void;
  saveError: string;
  savedItems: SavedCardItem[];
  savedLoading: boolean;
  savedError: string;
  onRemoveSaved: (item: SavedCardItem) => void;
  onOpenSaved: (item: SavedCardItem) => void;
  cards: Card[];
  cardsLoading: boolean;
  cardsError: string;
  cardsReason: string | null;
  cardsDisclaimer: boolean;
  onToggleSave: (card: Card) => void;
  onOpenCard: (card: Card) => void;
};

/** 출처 탭 선택과, 탭에 따라 일반 카드 또는 저장 카드 목록을 전환해 보여준다. */
export function StockFeedSection({
  market,
  stockName,
  stockCode,
  authenticated,
  tabs,
  disabled,
  activeTab,
  onSelectTab,
  saveError,
  savedItems,
  savedLoading,
  savedError,
  onRemoveSaved,
  onOpenSaved,
  cards,
  cardsLoading,
  cardsError,
  cardsReason,
  cardsDisclaimer,
  onToggleSave,
  onOpenCard,
}: StockFeedSectionProps) {
  return (
    <>
      <SourceNav
        key={market}
        market={market}
        tabs={tabs}
        disabled={disabled}
        activeTab={activeTab}
        onSelectTab={onSelectTab}
      />
      {saveError && (
        <StatusBanner
          tone="error"
          message={`즐겨찾기를 변경하지 못했습니다: ${saveError}`}
        />
      )}
      {activeTab === "community" ? (
        <CommunityFeed
          stockName={stockName}
          stockCode={stockCode}
          market={market}
          authenticated={authenticated}
        />
      ) : activeTab === "saved" ? (
        <SavedCardFeed
          items={savedItems}
          loading={savedLoading}
          error={savedError}
          onRemove={onRemoveSaved}
          onOpen={onOpenSaved}
        />
      ) : (
        <CardFeed
          cards={cards}
          market={market}
          tab={activeTab}
          loading={cardsLoading}
          error={cardsError}
          reason={cardsReason}
          disclaimer={cardsDisclaimer}
          onToggleSave={onToggleSave}
          onOpenCard={onOpenCard}
        />
      )}
    </>
  );
}
