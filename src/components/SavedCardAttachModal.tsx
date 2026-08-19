import { useEffect, useMemo, useState } from "react";
import { getApi } from "../api/client";
import type { SavedCardItem, SavedCardListResponse } from "../types/card";

type Props = {
  stockCode: string;
  onClose: () => void;
  onSelect: (item: SavedCardItem) => void;
};

const FILTERS = [
  { id: "all", label: "전체" },
  { id: "disclosure", label: "공시" },
  { id: "regulation", label: "규제 동향" },
  { id: "bok", label: "한국은행" },
  { id: "fed", label: "미국 Fed" },
  { id: "youtube", label: "유튜브" },
];

function snapshotText(item: SavedCardItem, key: string) {
  const value = item.snapshot[key];
  return typeof value === "string" ? value : null;
}

/** 즐겨찾기 API의 자료를 댓글에 첨부할 수 있게 선택하는 모달입니다. */
export function SavedCardAttachModal({ stockCode, onClose, onSelect }: Props) {
  const [items, setItems] = useState<SavedCardItem[]>([]);
  const [selectedTab, setSelectedTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        // 즐겨찾기 전체를 받아 탭별로 필터링한다. 현재 종목 자료를 우선 노출한다.
        const response = await getApi<SavedCardListResponse>("/me/saved-cards");
        if (!cancelled) {
          const ordered = [...response.items].sort((a, b) =>
            Number(b.stock_code === stockCode) - Number(a.stock_code === stockCode),
          );
          setItems(ordered);
        }
      } catch (requestError) {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : "즐겨찾기 자료를 불러오지 못했어요.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [stockCode]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const filteredItems = useMemo(() => selectedTab === "all" ? items : items.filter((item) => item.tab === selectedTab), [items, selectedTab]);

  return <div className="fixed inset-0 z-70 grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={onClose}>
    <section role="dialog" aria-modal="true" aria-labelledby="saved-card-attach-title" onMouseDown={(event) => event.stopPropagation()} className="flex h-150 w-full max-w-116.5 flex-col rounded-2xl border border-[#303744] bg-[#1c2029] p-6 shadow-2xl">
      <div className="flex items-center justify-between"><h2 id="saved-card-attach-title" className="text-xl font-bold text-[#f2f3f5]">자료 카드 첨부</h2><button type="button" aria-label="닫기" onClick={onClose} className="text-2xl text-[#9aa3b2] hover:text-white">×</button></div>
      <p className="mt-6 text-sm text-[#9aa3b2]">즐겨찾기에 저장한 자료를 붙일 수 있어요.</p>
      <div className="mt-8 flex flex-wrap gap-2">{FILTERS.map((filter) => <button key={filter.id} type="button" onClick={() => setSelectedTab(filter.id)} className={`rounded-full px-3 py-2 text-xs font-semibold ${selectedTab === filter.id ? "bg-[#4d9fff] text-[#0f1115]" : "bg-[#2a2f3a] text-[#aab3c1] hover:text-white"}`}>{filter.label}</button>)}</div>
      <div className="mt-6 min-h-0 flex-1 overflow-y-auto">
        {loading && <p className="pt-24 text-center text-sm text-[#9aa3b2]">저장한 자료를 불러오는 중이에요.</p>}
        {!loading && error && <p role="alert" className="pt-24 text-center text-sm text-[#f0a868]">{error}</p>}
        {!loading && !error && filteredItems.length === 0 && <div className="grid h-full place-items-center text-center"><div><p className="text-xl text-[#9aa3b2]">⌁</p><strong className="mt-3 block text-sm text-[#f2f3f5]">이 출처에 저장한 자료가 없어요.</strong><p className="mt-3 text-sm text-[#9aa3b2]">카드의 ★를 눌러 모아보세요.</p></div></div>}
        {!loading && !error && filteredItems.length > 0 && <ul className="space-y-2">{filteredItems.map((item) => <li key={`${item.card_id}-${item.saved_at}`}><button type="button" onClick={() => onSelect(item)} className="w-full rounded-xl border border-[#343b48] bg-[#171a21] p-4 text-left hover:border-[#4d9fff]"><div className="flex justify-between gap-3"><span className="text-xs font-bold text-[#79b8ff]">{item.stock_name ?? item.stock_code} · {FILTERS.find((filter) => filter.id === item.tab)?.label ?? item.tab}</span><span className="text-xs text-[#ffbf00]">★</span></div><strong className="mt-2 line-clamp-2 block text-sm leading-5 text-[#f2f3f5]">{snapshotText(item, "title") ?? "저장한 자료"}</strong><span className="mt-2 block text-xs text-[#8b94a3]">{snapshotText(item, "source_name") ?? item.tab}</span></button></li>)}</ul>}
      </div>
      <p className="mt-4 border-t border-[#303744] pt-4 text-xs text-[#9aa3b2]">한 번에 하나만 첨부할 수 있어요. 저장 당시 내용이 그대로 보여요.</p>
    </section>
  </div>;
}
