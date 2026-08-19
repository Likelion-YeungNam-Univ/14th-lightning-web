import type { Card, CardDetail, SavedCardItem } from "../types/card";
import { youtubeThumbnailUrl } from "./youtube";

// 스냅샷의 알 수 없는 값에서 문자열만 안전하게 반환한다.
function snapshotString(snapshot: Record<string, unknown>, key: string) {
  const value = snapshot[key];
  return typeof value === "string" ? value : null;
}

// 스냅샷의 알 수 없는 값에서 숫자만 안전하게 반환한다.
function snapshotNumber(snapshot: Record<string, unknown>, key: string) {
  const value = snapshot[key];
  return typeof value === "number" ? value : null;
}

// 스냅샷 상세 배열에서 카드 상세 형식에 맞는 항목만 추린다.
function snapshotDetails(snapshot: Record<string, unknown>) {
  const value = snapshot.details;
  if (!Array.isArray(value)) return null;
  const details = value.filter(
    (item): item is CardDetail =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as Record<string, unknown>).label === "string" &&
      typeof (item as Record<string, unknown>).value === "string",
  );
  return details.length > 0 ? details : null;
}

/** 저장 당시 snapshot_json을 카드 상세 모달에서 사용하는 Card 타입으로 변환한다. */
export function savedItemToCard(item: SavedCardItem): Card | null {
  if (item.card_id === null) return null;
  const { snapshot } = item;
  const originUrl = snapshotString(snapshot, "origin_url");
  return {
    card_id: item.card_id,
    label: snapshotString(snapshot, "label"),
    label_reason: snapshotString(snapshot, "label_reason"),
    title: snapshotString(snapshot, "title") ?? "저장한 자료",
    summary_short: snapshotString(snapshot, "summary_short"),
    summary_full: snapshotString(snapshot, "summary_full"),
    source_name:
      snapshotString(snapshot, "source_name") ??
      ({
        youtube: "YouTube",
        disclosure: "공시",
        regulation: "규제동향",
        bok: "한국은행",
        fed: "미국 Fed",
      }[item.tab] ?? item.tab),
    published_at: snapshotString(snapshot, "published_at"),
    origin_url: originUrl,
    is_saved: true,
    thumbnail_url:
      snapshotString(snapshot, "thumbnail_url") ??
      (item.tab === "youtube" ? youtubeThumbnailUrl(originUrl) : null),
    channel_name: snapshotString(snapshot, "channel_name"),
    view_count: snapshotNumber(snapshot, "view_count"),
    indicator_value: snapshotString(snapshot, "indicator_value"),
    details: snapshotDetails(snapshot),
  };
}
