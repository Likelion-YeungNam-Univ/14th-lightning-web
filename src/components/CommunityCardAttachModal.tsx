import { useEffect, useMemo, useState } from 'react';
import { getApi } from '../api/client';
import type { SavedCardItem, SavedCardListResponse } from '../types/card';
import { cacheSavedCards, mergeSavedCards, readSavedCardCache } from '../utils/saved-card-cache';

const tabs: Array<[string, string]> = [['all', '전체'], ['disclosure', '공시'], ['regulation', '규제동향'], ['bok', '한국은행'], ['fed', '미국 Fed'], ['youtube', '유튜브']];

function text(snapshot: Record<string, unknown>, key: string) {
  return typeof snapshot[key] === 'string' ? String(snapshot[key]) : '';
}

interface Props {
  stockCode: string;
  selected: SavedCardItem | null;
  onSelect: (item: SavedCardItem) => void;
  onClose: () => void;
}

export default function CommunityCardAttachModal({ stockCode, selected, onSelect, onClose }: Props) {
  const [items, setItems] = useState<SavedCardItem[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [candidate, setCandidate] = useState<SavedCardItem | null>(selected);

  useEffect(() => {
    let cancelled = false;
    void getApi<SavedCardListResponse>(`/me/saved-cards?stock_code=${encodeURIComponent(stockCode)}`)
      .then((response) => {
        if (cancelled) return;
        const cachedForStock = readSavedCardCache().filter((item) => item.stock_code === stockCode);
        const merged = mergeSavedCards(cachedForStock, response.items);
        cacheSavedCards(mergeSavedCards(readSavedCardCache().filter((item) => item.stock_code !== stockCode), merged));
        setItems(merged.filter((item) => item.card_id !== null));
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        const cached = readSavedCardCache().filter((item) => item.stock_code === stockCode && item.card_id !== null);
        setItems(cached);
        if (cached.length === 0) setError(reason instanceof Error ? reason.message : '저장 자료를 불러오지 못했습니다.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [stockCode]);

  useEffect(() => {
    const escape = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [onClose]);

  const filtered = useMemo(() => activeTab === 'all' ? items : items.filter((item) => item.tab === activeTab), [activeTab, items]);

  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section role="dialog" aria-modal="true" aria-labelledby="attach-card-title" className="flex max-h-[calc(100vh-32px)] w-full max-w-lg flex-col rounded-2xl border border-[#303744] bg-[#1c2029] p-6 shadow-2xl">
      <header className="flex items-center justify-between"><h2 id="attach-card-title" className="font-bold text-white">자료 카드 첨부</h2><button type="button" onClick={onClose} aria-label="닫기" className="text-xl text-white/45">×</button></header>
      <p className="mt-4 text-xs text-white/40">즐겨찾기에 저장한 자료를 붙일 수 있어요.</p>
      <div className="mt-5 flex flex-wrap gap-2">{tabs.map(([value, label]) => <button key={value} type="button" onClick={() => setActiveTab(value)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${activeTab === value ? 'bg-[#4d9fff] text-[#07111f]' : 'bg-white/[.06] text-white/50'}`}>{label}</button>)}</div>
      <div className="mt-5 min-h-64 flex-1 space-y-2 overflow-y-auto">
        {loading ? <div className="grid gap-2">{[0, 1, 2].map((key) => <div key={key} className="h-20 animate-pulse rounded-lg bg-white/[.05]" />)}</div> : error ? <p role="alert" className="py-20 text-center text-sm text-red-300">{error}</p> : filtered.length === 0 ? <div className="py-20 text-center"><p className="font-bold text-white">이 출처에 저장한 자료가 없어요</p><p className="mt-2 text-sm text-white/40">카드의 ☆을 누르면 여기에 모여요.</p></div> : filtered.map((item, index) => {
          const key = `${item.card_id}-${item.saved_at}-${index}`;
          const chosen = candidate?.card_id === item.card_id;
          return <button key={key} type="button" role="radio" aria-checked={chosen} onClick={() => setCandidate(item)} className={`flex w-full items-center gap-4 rounded-lg border p-3 text-left ${chosen ? 'border-blue-400 bg-blue-500/10' : 'border-white/10 bg-[#15181f]'}`}><span className="min-w-0 flex-1"><span className="text-[11px] font-bold text-blue-300">{tabs.find(([value]) => value === item.tab)?.[1] ?? item.tab}</span><strong className="mt-1 block line-clamp-1 text-sm text-white">{text(item.snapshot, 'title') || '저장한 자료'}</strong><span className="mt-1 block line-clamp-1 text-xs text-white/40">{text(item.snapshot, 'summary_short')}</span></span><span aria-hidden="true" className={`grid size-5 shrink-0 place-items-center rounded-full border ${chosen ? 'border-blue-400' : 'border-white/25'}`}>{chosen && <span className="size-2.5 rounded-full bg-blue-400" />}</span></button>;
        })}
      </div>
      <p className="mt-4 text-[11px] text-white/35">한 번에 하나만 첨부할 수 있어요. 저장 당시 내용이 그대로 붙어요.</p>
      <button type="button" disabled={!candidate} onClick={() => candidate && onSelect(candidate)} className="mt-5 w-full rounded-lg bg-[#4d9fff] py-3 text-sm font-bold text-[#07111f] disabled:opacity-30">이 자료 첨부하기</button>
    </section>
  </div>;
}
