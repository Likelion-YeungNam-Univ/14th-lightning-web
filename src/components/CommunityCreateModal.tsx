import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent, MouseEvent } from 'react';
import type { CommunityDirection } from '../types/community';

export interface CommunityCreateFormData {
  stockName: string; title: string; expectedPrice: number; deadlineDate: string;
  content: string; direction: CommunityDirection; betAmount: number; maxParticipants: number;
}

interface Props { stockName: string; pointBalance: number; onClose: () => void; onSubmit: (data: CommunityCreateFormData) => void; }
const MAX_BET = 5000;
const PARTICIPANTS = [2, 3, 4] as const;

export default function CommunityCreateModal({ stockName, pointBalance, onClose, onSubmit }: Props) {
  const headingId = useId();
  const titleRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [deadline, setDeadline] = useState('');
  const [content, setContent] = useState('');
  const [direction, setDirection] = useState<CommunityDirection>('up');
  const [bet, setBet] = useState('500');
  const [participants, setParticipants] = useState(4);
  const [fileName, setFileName] = useState('');
  const today = new Date().toLocaleDateString('en-CA');
  const betNumber = Number(bet);
  const canSubmit = Boolean(title.trim() && Number(price) > 0 && deadline >= today && content.trim()) && betNumber > 0 && betNumber <= MAX_BET && betNumber <= pointBalance;

  useEffect(() => {
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    titleRef.current?.focus();
    const escape = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', escape);
    return () => { document.body.style.overflow = oldOverflow; window.removeEventListener('keydown', escape); };
  }, [onClose]);

  function closeBackdrop(event: MouseEvent<HTMLDivElement>) { if (event.target === event.currentTarget) onClose(); }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    onSubmit({ stockName, title: title.trim(), expectedPrice: Number(price), deadlineDate: deadline, content: content.trim(), direction, betAmount: betNumber, maxParticipants: participants });
  }

  return (
    <div onMouseDown={closeBackdrop} className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-[2px]">
      <form role="dialog" aria-modal="true" aria-labelledby={headingId} onSubmit={submit} className="my-auto max-h-[calc(100vh-32px)] w-full max-w-[620px] overflow-y-auto rounded-2xl border border-[#303744] bg-[#1c2029] p-6 shadow-2xl sm:p-7">
        <header className="mb-6 flex items-center justify-between"><h2 id={headingId} className="text-lg font-bold text-white">{stockName} 커뮤니티 만들기</h2><button type="button" onClick={onClose} aria-label="닫기" className="p-1 text-xl text-white/45 hover:text-white">×</button></header>
        <div className="space-y-5">
          <label className="block text-xs font-medium text-white/45">종목<span className="mt-2 flex items-center justify-between rounded-lg bg-[#15181f] px-4 py-3 text-sm text-white"><b>{stockName}</b><span className="text-xs font-normal text-white/35">상단에서 선택한 종목이에요</span></span></label>
          <label className="block text-xs font-medium text-white/45">방 제목<input ref={titleRef} value={title} maxLength={50} onChange={(e) => setTitle(e.target.value)} placeholder="예) 9월 말까지 8만원 간다" className="mt-2 w-full rounded-lg border border-[#3a414d] bg-[#12151b] px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-blue-400" /></label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="text-xs font-medium text-white/45">기준 가격<div className="relative mt-2"><input inputMode="numeric" value={price ? Number(price).toLocaleString() : ''} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))} placeholder="80,000" className="w-full rounded-lg border border-[#3a414d] bg-[#12151b] px-4 py-3 pr-9 text-sm font-semibold text-white outline-none focus:border-blue-400" /><span className="absolute right-4 top-3 text-sm text-white/55">원</span></div></label>
            <label className="text-xs font-medium text-white/45">결과일<input type="date" min={today} value={deadline} onChange={(e) => setDeadline(e.target.value)} className="mt-2 w-full rounded-lg border border-[#3a414d] bg-[#12151b] px-4 py-3 text-sm font-semibold text-white outline-none [color-scheme:dark] focus:border-blue-400" /></label>
          </div>
          <label className="block text-xs font-medium text-white/45">방을 만든 이유<textarea value={content} maxLength={500} onChange={(e) => setContent(e.target.value)} rows={4} placeholder="왜 그렇게 보는지 적어주세요. 사진과 링크를 함께 올릴 수 있어요." className="mt-2 w-full resize-y rounded-lg border border-[#3a414d] bg-[#12151b] px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-blue-400" /></label>
          <div className="flex flex-wrap items-center gap-2"><input ref={fileRef} type="file" accept="image/*" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? '')} className="hidden" /><button type="button" onClick={() => fileRef.current?.click()} className="rounded-full bg-white/[.06] px-3 py-2 text-xs text-white/60 hover:text-white">▧ 사진 첨부</button><button type="button" className="rounded-full bg-white/[.06] px-3 py-2 text-xs text-white/60 hover:text-white">⌁ 자료 카드 첨부</button>{fileName && <span className="max-w-48 truncate text-xs text-blue-300">{fileName}</span>}</div>
          <div className="grid grid-cols-[1fr_125px] gap-4">
            <fieldset><legend className="mb-2 text-xs font-medium text-white/45">내 의견</legend><div className="grid grid-cols-2 gap-2">{(['up', 'down'] as const).map((value) => <button key={value} type="button" onClick={() => setDirection(value)} aria-pressed={direction === value} className={`rounded-lg border py-3 text-sm font-bold ${direction === value ? value === 'up' ? 'border-emerald-400 bg-emerald-400/10 text-emerald-300' : 'border-orange-400 bg-orange-400/10 text-orange-300' : 'border-[#3a414d] bg-[#15181f] text-white/45'}`}>{value === 'up' ? '간다' : '안 간다'}</button>)}</div></fieldset>
            <label className="text-xs font-medium text-white/45">참여 포인트<input inputMode="numeric" value={bet} onChange={(e) => setBet(e.target.value.replace(/\D/g, ''))} className="mt-2 w-full rounded-lg border border-[#3a414d] bg-[#12151b] px-4 py-3 text-sm font-bold text-white outline-none focus:border-blue-400" /></label>
          </div>
          <p className="-mt-3 text-[11px] text-white/35">최대 {MAX_BET.toLocaleString()}P · 현재 참여 가능 포인트 {pointBalance.toLocaleString()}P</p>
          <fieldset className="rounded-xl border border-[#445064] p-4"><legend className="px-1 text-xs font-bold text-white/65">참여 인원</legend><p className="mb-3 text-[11px] text-white/35">방장을 포함해 2~4명으로 정할 수 있어요.</p><div className="grid grid-cols-3 gap-2">{PARTICIPANTS.map((count) => <button key={count} type="button" onClick={() => setParticipants(count)} aria-pressed={participants === count} className={`rounded-lg border p-3 text-left ${participants === count ? 'border-blue-400 bg-blue-500/20' : 'border-[#445064] bg-[#15181f]'}`}><strong className="block text-sm text-white">{count}명</strong><span className="mt-1 block text-[10px] text-white/45">{count === 2 ? '빠르게 의견 나누기' : count === 3 ? '균형 있게 모으기' : '여러 의견 함께 보기'}</span></button>)}</div></fieldset>
          <p className="text-xs leading-5 text-white/40">참여 포인트를 걸고 내 의견을 고르면 방장 본인 몫을 먼저 내고 방이 열려요. 참여자도 같은 금액을 내요.</p>
          <button type="submit" disabled={!canSubmit} className="w-full rounded-lg bg-[#4d9fff] py-4 text-sm font-bold text-[#07111f] transition hover:bg-[#6aafff] disabled:opacity-40">커뮤니티 만들고 {betNumber.toLocaleString()}P 내기</button>
        </div>
      </form>
    </div>
  );
}
