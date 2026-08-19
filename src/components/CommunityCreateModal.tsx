import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import type { CommunityCurrency, CommunityDirection } from "../types/community";

export interface CommunityCreateFormData {
  stockName: string;
  title: string;
  expectedPrice: number;
  deadlineDate: string;
  content: string;
  direction: CommunityDirection;
  betAmount: number;
  maxParticipants: number;
  imageFile: File | null;
  attachCurrentCard: boolean;
}

type Props = { stockName: string; currency: CommunityCurrency; defaultPrice: number; pointBalance: number; onClose: () => void; onSubmit: (data: CommunityCreateFormData) => void };

const MAX_BET_PER_ROUND = 1000;
const PARTICIPANT_OPTIONS = [2, 3, 4];
const formatNumber = (value: string) => (value ? Number(value).toLocaleString("ko-KR") : "");

export default function CommunityCreateModal({ stockName, currency, defaultPrice, pointBalance, onClose, onSubmit }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [expectedPrice, setExpectedPrice] = useState(String(defaultPrice));
  const [deadlineDate, setDeadlineDate] = useState("");
  const [content, setContent] = useState("");
  const [direction, setDirection] = useState<CommunityDirection>("up");
  const [betAmount, setBetAmount] = useState("500");
  const [maxParticipants, setMaxParticipants] = useState(4);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [attachCurrentCard, setAttachCurrentCard] = useState(false);
  const [formError, setFormError] = useState("");
  const numericPrice = Number(expectedPrice) || 0;
  const numericBet = Number(betAmount) || 0;
  const unit = currency === "USD" ? "달러" : "원";
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const updateNumeric = (event: ChangeEvent<HTMLInputElement>, setValue: (value: string) => void) => setValue(event.target.value.replace(/\D/g, ""));
  const selectImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;
    if (!file.type.startsWith("image/")) { setFormError("이미지 파일만 첨부할 수 있어요."); event.target.value = ""; return; }
    setImageFile(file); setFormError("");
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !numericPrice || !deadlineDate) { setFormError("방 제목, 예상 가격, 판가름 날짜를 입력해주세요."); return; }
    if (deadlineDate < today) { setFormError("판가름 날짜는 오늘 이후로 선택해주세요."); return; }
    if (!numericBet || numericBet > MAX_BET_PER_ROUND) { setFormError(`참여 포인트는 1P 이상 ${MAX_BET_PER_ROUND.toLocaleString()}P 이하로 입력해주세요.`); return; }
    if (numericBet > pointBalance) { setFormError("보유 포인트보다 큰 금액은 참여할 수 없어요."); return; }
    onSubmit({ stockName, title: title.trim(), expectedPrice: numericPrice, deadlineDate, content: content.trim(), direction, betAmount: numericBet, maxParticipants, imageFile, attachCurrentCard });
  };

  return <div className="fixed inset-0 z-60 grid place-items-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm" onMouseDown={onClose}>
    <section role="dialog" aria-modal="true" aria-labelledby="community-create-title" onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-97.5 rounded-xl border border-[#303744] bg-[#1c2029] p-4.5 shadow-2xl">
      <div className="mb-6 flex items-center justify-between"><h2 id="community-create-title" className="text-sm font-bold text-[#f2f3f5]">{stockName} 커뮤니티 만들기</h2><button type="button" aria-label="닫기" onClick={onClose} className="text-lg leading-none text-[#9aa3b2] hover:text-white">×</button></div>
      <form onSubmit={submit} className="space-y-4.5">
        <div><FieldLabel label="종목" /><div className="flex h-8.5 items-center justify-between rounded-md bg-[#15181e] px-2.5 text-[10px]"><strong className="text-[#e7eaf0]">{stockName}</strong><span className="text-[#8b94a3]">상단에서 선택한 종목이에요</span></div></div>
        <div><FieldLabel label="방 제목" /><input autoFocus value={title} maxLength={60} onChange={(event) => setTitle(event.target.value)} placeholder={`예) 9월 말까지 ${formatNumber(expectedPrice || "0")}${unit} 간다`} className="community-input" /></div>
        <div className="grid grid-cols-2 gap-3"><div><FieldLabel label="기준 가격" /><label className="community-input flex items-center gap-0.5"><input value={formatNumber(expectedPrice)} inputMode="numeric" onChange={(event) => updateNumeric(event, setExpectedPrice)} aria-label="기준 가격" className="min-w-0 flex-1 bg-transparent outline-none" /><span className="text-[11px] text-[#8b94a3]">{unit}</span></label></div><div><FieldLabel label="결과일" /><input type="date" value={deadlineDate} min={today} onChange={(event) => setDeadlineDate(event.target.value)} className="community-input [color-scheme:dark]" /></div></div>
        <div><FieldLabel label="방을 만든 이유" /><textarea value={content} maxLength={500} onChange={(event) => setContent(event.target.value)} placeholder="왜 그렇게 보는지 적어주세요. 사진과 링크를 함께 올릴 수 있어요." className="community-input h-18 resize-none py-2.5 leading-5" /><div className="mt-2 flex flex-wrap items-center gap-2"><input ref={fileInputRef} type="file" accept="image/*" onChange={selectImage} className="hidden" /><button type="button" onClick={() => fileInputRef.current?.click()} className="community-attachment">▣ 사진 첨부</button><button type="button" onClick={() => setAttachCurrentCard((current) => !current)} aria-pressed={attachCurrentCard} className={`community-attachment ${attachCurrentCard ? "border-[#4d9fff] text-[#8cc4ff]" : ""}`}>⌁ 자료 카드 첨부</button>{imageFile && <span className="max-w-35 truncate text-[10px] text-[#9aa3b2]">{imageFile.name}</span>}{attachCurrentCard && <span className="text-[10px] text-[#8cc4ff]">현재 자료 카드 첨부됨</span>}</div></div>
        <div className="grid grid-cols-[1fr_82px] gap-3"><div><FieldLabel label="내 의견" /><div className="flex h-8.5 rounded-md border border-[#303744] bg-[#171a21] p-0.5"><DirectionButton active={direction === "up"} tone="up" onClick={() => setDirection("up")}>간다</DirectionButton><DirectionButton active={direction === "down"} tone="down" onClick={() => setDirection("down")}>안 간다</DirectionButton></div></div><div><FieldLabel label="참여 포인트" /><label className="community-input flex items-center gap-0.5 px-2.5"><input value={formatNumber(betAmount)} inputMode="numeric" onChange={(event) => updateNumeric(event, setBetAmount)} aria-label="참여 포인트" className="min-w-0 flex-1 bg-transparent outline-none" /><span className="text-[10px] text-[#8b94a3]">P</span></label></div></div>
        <p className="-mt-2 text-[10px] text-[#7f8998]">최대 1,000P · 현재 보유 포인트 {pointBalance.toLocaleString()}P</p>
        <div><FieldLabel label="참여 인원" /><p className="-mt-1.5 mb-2 text-[10px] text-[#8b94a3]">방장은 포함해 2~4명으로 정할 수 있어요.</p><div className="grid grid-cols-3 gap-1.5">{PARTICIPANT_OPTIONS.map((count) => <button key={count} type="button" onClick={() => setMaxParticipants(count)} className={`rounded-md border px-2 py-2 text-left transition ${maxParticipants === count ? "border-[#4d9fff] bg-[#18365c] text-white" : "border-[#3a4250] bg-[#1a1e27] text-[#c8ccd4] hover:border-[#5d6675]"}`}><strong className="block text-sm">{count}명</strong><span className="block text-[9px] text-[#9aa3b2]">{count === 2 ? "둘이서 바로 나누기" : count === 3 ? "친구와 셋이 모이기" : "여러 의견 함께 보기"}</span></button>)}</div></div>
        <p className="border-t border-[#303744] pt-3 text-[10px] leading-4 text-[#9aa3b2]">참여 포인트를 정하고 내 의견을 고르면 방장이 받은 쪽은 먼저 나뉘어 보여요. 참여자는 같은 금액을 내요.</p>
        {formError && <p role="alert" className="text-xs text-[#ff8d72]">{formError}</p>}
        <button type="submit" className="h-8.5 w-full rounded-md bg-[#4d9fff] text-[11px] font-bold text-[#0f1115] transition hover:bg-[#71b0ff]">커뮤니티 만들고 {formatNumber(betAmount || "0")}P 내기</button>
      </form>
    </section>
  </div>;
}

function FieldLabel({ label }: { label: string }) { return <label className="mb-1.5 block text-[10px] font-medium text-[#aeb7c5]">{label}</label>; }
function DirectionButton({ active, tone, onClick, children }: { active: boolean; tone: CommunityDirection; onClick: () => void; children: string }) {
  const activeClass = tone === "up" ? "border-[#42d994] bg-[#123422] text-[#4cde9a]" : "border-[#ff9a43] bg-[#412a16] text-[#ffad5d]";
  return <button type="button" onClick={onClick} className={`flex-1 rounded px-2 text-[11px] font-bold ${active ? `border ${activeClass}` : "text-[#8b94a3]"}`}>{children}</button>;
}
