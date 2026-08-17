import { useState, type Dispatch, type SetStateAction } from "react";
import { ApiError, deleteApi, postApi } from "../api/client";
import type {
  Card,
  CardListResponse,
  SavedCardAddResponse,
  SavedCardDeleteResponse,
  SavedCardItem,
  SavedCardListResponse,
} from "../types/card";

type UseCardActionsParams = {
  activeStockCode: string;
  setCardResponse: Dispatch<SetStateAction<CardListResponse | null>>;
  setSavedResponse: Dispatch<SetStateAction<SavedCardListResponse | null>>;
  setDetailCard: Dispatch<SetStateAction<Card | null>>;
  onRequireLogin: () => void;
};

/** 카드 저장·해제 요청과 로그인 후 재시도할 보류 상태를 관리한다. */
export function useCardActions({
  activeStockCode,
  setCardResponse,
  setSavedResponse,
  setDetailCard,
  onRequireLogin,
}: UseCardActionsParams) {
  const [saveError, setSaveError] = useState("");
  const [pendingSave, setPendingSave] = useState<{
    card: Card;
    stockCode: string;
  } | null>(null);

  // 일반 카드 목록과 열린 상세 카드의 저장 상태를 함께 갱신한다.
  const updateCardSaved = (cardId: number, isSaved: boolean) => {
    setCardResponse((current) =>
      current
        ? {
            ...current,
            items: current.items.map((card) =>
              card.card_id === cardId ? { ...card, is_saved: isSaved } : card,
            ),
          }
        : current,
    );
    setDetailCard((current) =>
      current?.card_id === cardId ? { ...current, is_saved: isSaved } : current,
    );
  };

  // 카드를 저장하고 401 응답이면 요청 정보를 보관한 뒤 로그인을 요청한다.
  const saveCard = async (card: Card, stockCode: string) => {
    setSaveError("");
    try {
      const response = await postApi<SavedCardAddResponse>("/me/saved-cards", {
        card_id: card.card_id,
        stock_code: stockCode,
      });
      updateCardSaved(card.card_id, true);
      setSavedResponse((current) =>
        current &&
        !current.items.some((item) => item.card_id === response.item.card_id)
          ? { ...current, items: [response.item, ...current.items] }
          : current,
      );
      setPendingSave(null);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setPendingSave({ card, stockCode });
        onRequireLogin();
        return;
      }
      setSaveError(
        error instanceof Error ? error.message : "카드를 저장하지 못했습니다.",
      );
    }
  };

  // 카드의 현재 저장 상태에 따라 저장 또는 저장 해제를 실행한다.
  const toggleCardSave = async (card: Card) => {
    if (!activeStockCode) return;
    setSaveError("");
    if (!card.is_saved) {
      await saveCard(card, activeStockCode);
      return;
    }
    try {
      await deleteApi<SavedCardDeleteResponse>(
        `/me/saved-cards/${card.card_id}`,
      );
      updateCardSaved(card.card_id, false);
      setSavedResponse((current) =>
        current
          ? {
              ...current,
              items: current.items.filter(
                (item) => item.card_id !== card.card_id,
              ),
            }
          : current,
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onRequireLogin();
        return;
      }
      setSaveError(
        error instanceof Error
          ? error.message
          : "카드 저장을 해제하지 못했습니다.",
      );
    }
  };

  // 저장 카드 화면에서 선택한 스냅샷을 저장 목록과 일반 카드 상태에서 제거한다.
  const removeSavedCard = async (item: SavedCardItem) => {
    if (item.card_id === null) return;
    setSaveError("");
    try {
      await deleteApi<SavedCardDeleteResponse>(
        `/me/saved-cards/${item.card_id}`,
      );
      setSavedResponse((current) =>
        current
          ? {
              ...current,
              items: current.items.filter(
                (saved) =>
                  !(
                    saved.card_id === item.card_id &&
                    saved.saved_at === item.saved_at
                  ),
              ),
            }
          : current,
      );
      updateCardSaved(item.card_id, false);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onRequireLogin();
        setSaveError("로그인 후 다시 저장 해제를 시도해주세요.");
        return;
      }
      setSaveError(
        error instanceof Error
          ? error.message
          : "카드 저장을 해제하지 못했습니다.",
      );
    }
  };

  return {
    saveError,
    pendingSave,
    setPendingSave,
    saveCard,
    toggleCardSave,
    removeSavedCard,
  };
}
