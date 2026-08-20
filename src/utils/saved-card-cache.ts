import type { SavedCardItem } from "../types/card";

const SAVED_CARD_CACHE_KEY = "assit:saved-card-snapshots:v1";

function itemKey(item: SavedCardItem) {
  return item.card_id === null
    ? `${item.stock_code}:${item.tab}:${item.saved_at}`
    : `${item.stock_code}:${item.card_id}`;
}

export function readSavedCardCache(): SavedCardItem[] {
  try {
    const value = JSON.parse(localStorage.getItem(SAVED_CARD_CACHE_KEY) ?? "[]") as unknown;
    return Array.isArray(value) ? (value as SavedCardItem[]) : [];
  } catch {
    return [];
  }
}

export function mergeSavedCards(...groups: SavedCardItem[][]) {
  const merged = new Map<string, SavedCardItem>();
  groups.flat().forEach((item) => merged.set(itemKey(item), item));
  return [...merged.values()].sort(
    (a, b) => Date.parse(b.saved_at) - Date.parse(a.saved_at),
  );
}

export function cacheSavedCards(items: SavedCardItem[]) {
  try {
    localStorage.setItem(SAVED_CARD_CACHE_KEY, JSON.stringify(items));
  } catch {
    // 저장 공간 제한 시에도 서버 기반 즐겨찾기는 계속 동작한다.
  }
}

export function cacheSavedCard(item: SavedCardItem) {
  cacheSavedCards(mergeSavedCards(readSavedCardCache(), [item]));
}

export function removeCachedSavedCard(cardId: number) {
  cacheSavedCards(readSavedCardCache().filter((item) => item.card_id !== cardId));
}
