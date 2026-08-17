import { useState } from "react";
import type { Card } from "../types/card";

/** 상세 시트에 표시할 카드와 열린 출처 탭을 관리한다. */
export function useCardDetail() {
  const [detailCard, setDetailCard] = useState<Card | null>(null);
  const [detailTab, setDetailTab] = useState("");

  const openDetail = (card: Card, tab: string) => {
    setDetailCard(card);
    setDetailTab(tab);
  };

  const closeDetail = () => {
    setDetailCard(null);
    setDetailTab("");
  };

  return { detailCard, detailTab, setDetailCard, openDetail, closeDetail };
}
