import { AddStockModal } from "./AddStockModal";
import { CardDetailSheet } from "./CardDetailSheet";
import { LoginModal } from "./LoginModal";
import type { Card } from "../types/card";
import type { MyStockItem, StockAddResponse, StockChanges } from "../types/stock";
import type { AccountResponse } from "../types/session";

type Props = {
  loginOpen: boolean;
  onLoginClose: () => void;
  onLoginSuccess: (account: AccountResponse) => void;
  stockModalOpen: boolean;
  activeMarket: string;
  marketStocks: MyStockItem[];
  onStockModalClose: () => void;
  onStockUpdated: (response: StockAddResponse | null) => void;
  onStockAuthRequired: (changes: StockChanges) => void;
  detailCard: Card | null;
  detailTab: string;
  detailLinkSentence: string | null;
  onDetailClose: () => void;
  onToggleSave: (card: Card, tab: string) => void;
};

/** 로그인, 종목 추가, 카드 상세 모달을 열림 상태에 따라 조건부로 렌더링한다. */
export function AppModals({
  loginOpen,
  onLoginClose,
  onLoginSuccess,
  stockModalOpen,
  activeMarket,
  marketStocks,
  onStockModalClose,
  onStockUpdated,
  onStockAuthRequired,
  detailCard,
  detailTab,
  detailLinkSentence,
  onDetailClose,
  onToggleSave,
}: Props) {
  return (
    <>
      {loginOpen && (
        <LoginModal onClose={onLoginClose} onLoginSuccess={onLoginSuccess} />
      )}
      {stockModalOpen && (
        <AddStockModal
          market={activeMarket}
          currentStocks={marketStocks}
          onClose={onStockModalClose}
          onUpdated={onStockUpdated}
          onAuthRequired={onStockAuthRequired}
        />
      )}
      {detailCard && (
        <CardDetailSheet
          card={detailCard}
          tab={detailTab}
          linkSentence={detailLinkSentence}
          onClose={onDetailClose}
          onToggleSave={(card) => onToggleSave(card, detailTab)}
        />
      )}
    </>
  );
}
