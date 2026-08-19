import { useEffect, useState, type FormEvent } from "react";
import type { CommunityDirection } from "../types/community";

type Props = { stockName: string; title: string; direction: CommunityDirection; pointBalance: number; onClose: () => void; onSubmit: (side: CommunityDirection, points: number) => void };

/** 커뮤니티 생성 모달과 같은 화면 체계로 참여 조건을 확인하는 모달입니다. */
export function CommunityParticipationModal({ stockName, title, direction, pointBalance, onClose, onSubmit }: Props) {
  const [side, setSide] = useState<CommunityDirection>(direction);
  const [points, setPoints] = useState("500");
  const [error, setError] = useState("");
  useEffect(() => { const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && onClose(); window.addEventListener("keydown", onKeyDown); return () => window.removeEventListener("keydown", onKeyDown); }, [onClose]);
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const amount = Number(points) || 0; if (!amount || amount > 1000) return setError("참여 포인트는 1P 이상 1,000P 이하로 입력해주세요."); if (amount > pointBalance) return setError("보유 포인트보다 큰 금액은 참여할 수 없어요."); onSubmit(side, amount); };
  return <div className="fixed inset-0 z-70 grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={onClose}>
    <section role="dialog" aria-modal="true" aria-labelledby="participation-title" onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-97.5 rounded-xl border border-[#303744] bg-[#1c2029] p-5 shadow-2xl">
      <div className="flex items-center justify-between"><h2 id="participation-title" className="text-base font-bold">커뮤니티 참여하기</h2><button type="button" aria-label="닫기" onClick={onClose} className="text-xl text-[#9aa3b2] hover:text-white">×</button></div>
      <form onSubmit={submit} className="mt-6 space-y-5"><div><p className="text-[10px] text-[#aeb7c5]">종목</p><div className="mt-1.5 rounded-md bg-[#15181e] px-3 py-2.5 text-sm font-bold">{stockName}</div></div><div><p className="text-[10px] text-[#aeb7c5]">참여할 커뮤니티</p><p className="mt-2 text-sm font-semibold leading-5 text-[#f2f3f5]">{title}</p></div><div><p className="mb-1.5 text-[10px] text-[#aeb7c5]">내 의견</p><div className="flex h-9 rounded-md border border-[#303744] bg-[#171a21] p-0.5"><button type="button" onClick={() => setSide("up")} className={`flex-1 rounded text-xs font-bold ${side === "up" ? "border border-[#42d994] bg-[#123422] text-[#4cde9a]" : "text-[#8b94a3]"}`}>간다</button><button type="button" onClick={() => setSide("down")} className={`flex-1 rounded text-xs font-bold ${side === "down" ? "border border-[#ff9a43] bg-[#412a16] text-[#ffad5d]" : "text-[#8b94a3]"}`}>안 간다</button></div></div><div><label htmlFor="participation-points" className="mb-1.5 block text-[10px] text-[#aeb7c5]">참여 포인트</label><div className="community-input flex items-center"><input id="participation-points" value={Number(points || 0).toLocaleString()} inputMode="numeric" onChange={(event) => setPoints(event.target.value.replace(/\D/g, ""))} className="min-w-0 flex-1 bg-transparent outline-none" /><span className="text-xs text-[#8b94a3]">P</span></div><p className="mt-1.5 text-[10px] text-[#7f8998]">최대 1,000P · 내 포인트 {pointBalance.toLocaleString()}P</p></div>{error && <p role="alert" className="text-xs text-[#ff8d72]">{error}</p>}<button type="submit" className="h-10 w-full rounded-md bg-[#4d9fff] text-xs font-bold text-[#0f1115] hover:bg-[#71b0ff]">{Number(points || 0).toLocaleString()}P 참여하기</button></form>
    </section>
  </div>;
}
