import type { SavedCardItem } from "../types/card";

type SavedCardFeedProps = {
  items: SavedCardItem[];
  loading: boolean;
  error: string;
  onRemove?: (item: SavedCardItem) => void;
  onOpen?: (item: SavedCardItem) => void;
};

const tabLabels: Record<string, string> = {
  youtube: "유튜브",
  disclosure: "공시",
  regulation: "규제동향",
  bok: "한국은행",
  fed: "미국 Fed",
};

// 저장 당시 스냅샷에서 문자열 필드를 안전하게 읽는다.
function snapshotText(snapshot: Record<string, unknown>, key: string) {
  const value = snapshot[key];
  return typeof value === "string" ? value : null;
}

// 저장 당시 스냅샷에서 숫자 필드를 안전하게 읽는다.
function snapshotNumber(snapshot: Record<string, unknown>, key: string) {
  const value = snapshot[key];
  return typeof value === "number" ? value : null;
}

// 저장 시각을 카드 하단에 표시할 날짜로 변환한다.
function formatSavedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "저장됨";
  return `${new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
  }).format(date)} 저장`;
}

// 저장된 유튜브 카드의 조회수를 한국어 단위로 변환한다.
function formatViews(value: number | null) {
  if (value === null) return null;
  if (value >= 10000) return `조회수 ${(value / 10000).toFixed(1).replace(/\.0$/, "")}만회`;
  return `조회수 ${value.toLocaleString("ko-KR")}회`;
}

// 저장 카드 목록을 불러오는 동안 스켈레톤을 표시한다.
function SavedLoading() {
  return <div className="grid grid-cols-5 gap-5 max-[1120px]:grid-cols-3 max-[760px]:grid-cols-1">{Array.from({ length: 5 }, (_, index) => <article key={index} className="min-h-[210px] animate-pulse rounded-xl bg-[#1c2029]" />)}</div>;
}

/** GET /me/saved-cards 응답을 종목과 출처 배지가 포함된 카드로 표시한다. */
export function SavedCardFeed({
  items,
  loading,
  error,
  onRemove,
  onOpen,
}: SavedCardFeedProps) {
  if (loading) return <section aria-label="저장한 자료 로딩 중" className="py-5"><SavedLoading /></section>;

  if (error) return <section role="alert" className="my-5 rounded-xl border border-[#634b2f] bg-[#2a2119] px-5 py-6"><strong className="text-sm text-[#f0a868]">저장한 자료를 불러오지 못했습니다.</strong><p className="mb-0 mt-2 text-sm text-[#c8ccd4]">{error}</p></section>;

  if (items.length === 0) return <section className="my-5 flex min-h-64 flex-col items-center justify-center rounded-xl border border-[#262c36] bg-[#12151b] px-6 text-center"><span className="text-2xl text-[#4d9fff]" aria-hidden="true">☆</span><h2 className="mb-2 mt-3 text-xl font-bold">아직 저장한 자료가 없어요</h2><p className="m-0 text-sm text-[#9aa3b2]">관심 있는 카드의 별을 눌러 나중에 다시 확인해보세요.</p></section>;

  return <section className="py-5"><div className="grid grid-cols-5 items-start gap-5 max-[1120px]:grid-cols-3 max-[760px]:grid-cols-1">{items.map((item, index) => {
    const title = snapshotText(item.snapshot, "title") ?? "저장한 자료";
    const summary = snapshotText(item.snapshot, "summary_short");
    const sourceName = snapshotText(item.snapshot, "source_name") ?? tabLabels[item.tab] ?? item.tab;
    const channelName = snapshotText(item.snapshot, "channel_name");
    const thumbnailUrl = snapshotText(item.snapshot, "thumbnail_url");
    const views = formatViews(snapshotNumber(item.snapshot, "view_count"));
    const videoCard = item.tab === "youtube";
    const key = `${item.card_id ?? "snapshot"}-${item.saved_at}-${index}`;

    return <article key={key} tabIndex={onOpen ? 0 : undefined} role={onOpen ? "button" : undefined} onClick={() => onOpen?.(item)} onKeyDown={(event) => { if (onOpen && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onOpen(item); } }} className={`group overflow-hidden rounded-xl bg-[#1c2029] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(0,0,0,.35)] focus-visible:outline-2 focus-visible:outline-[#4d9fff] ${onOpen ? "cursor-pointer" : ""}`}>
      {videoCard && <div className="relative h-[180px] overflow-hidden bg-[#2a2e36]">{thumbnailUrl ? <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full bg-[radial-gradient(circle_at_70%_35%,#46586e_0_10%,transparent_11%),linear-gradient(145deg,#35475b,#252b34)]" />}<button type="button" aria-label="즐겨찾기 해제" disabled={!onRemove || item.card_id === null} onClick={(event) => { event.stopPropagation(); onRemove?.(item); }} className="absolute right-2 top-2 grid size-9 place-items-center rounded-full border-0 bg-[#0f1115]/60 text-xl text-[#4d9fff] transition hover:text-[#79b8ff] disabled:cursor-default disabled:opacity-60">★</button></div>}
      <div className={videoCard ? "p-4" : "min-h-[210px] p-4"}>
        <div className="mb-3 flex items-start justify-between gap-2"><div className="flex flex-wrap items-center gap-1.5"><span className="rounded-md bg-[#243a52] px-2 py-1 text-[11px] font-bold text-[#79b8ff]">{item.stock_name ?? item.stock_code}</span><span className="rounded-md bg-[#2a2e36] px-2 py-1 text-[11px] font-bold text-[#c8ccd4]">{tabLabels[item.tab] ?? item.tab}</span></div>{!videoCard && <button type="button" aria-label="즐겨찾기 해제" disabled={!onRemove || item.card_id === null} onClick={(event) => { event.stopPropagation(); onRemove?.(item); }} className="-mr-1 -mt-1 shrink-0 border-0 bg-transparent px-1 text-lg text-[#4d9fff] transition hover:text-[#79b8ff] disabled:cursor-default disabled:opacity-60">★</button>}</div>
        <h2 className="m-0 line-clamp-2 text-[15px] font-bold leading-[1.45] text-[#f2f3f5]">{title}</h2>
        {channelName && <p className="mb-1 mt-2 text-[13px] text-[#c8ccd4]">{channelName}</p>}
        {!videoCard && summary && <p className="mb-0 mt-2 line-clamp-3 text-[13px] leading-5 text-[#c8ccd4]">{summary}</p>}
        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-[#9aa3b2]"><span>{views ?? sourceName}</span><span>{formatSavedAt(item.saved_at)}</span></div>
      </div>
    </article>;
  })}</div></section>;
}
