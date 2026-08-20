import { useEffect, useState, type FormEvent } from "react";
import type { AccountResponse } from "../types/session";
import { Logo } from "./Logo";

type Props = { account: AccountResponse | null; onClose: () => void; onNicknameChange: (nickname: string) => void };

export function ProfileModal({ account, onClose, onNicknameChange }: Props) {
  const [nickname, setNickname] = useState(account?.nickname ?? "");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", closeOnEscape); };
  }, [onClose]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextNickname = nickname.trim();
    if (nextNickname.length < 1 || nextNickname.length > 12) return setNotice("닉네임은 1~12자로 입력해주세요.");
    onNicknameChange(nextNickname);
    setNotice("현재 화면에 반영했어요. 서버 저장 API 연결이 필요해요.");
  };

  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-5 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <section role="dialog" aria-modal="true" aria-labelledby="profile-title" className="relative w-full max-w-[520px] rounded-[18px] border border-[#303744] bg-[#1c2029] p-7 shadow-[0_28px_90px_rgba(0,0,0,.6)] max-[640px]:p-5">
      <div className="flex items-center justify-between"><Logo /><button type="button" aria-label="닫기" onClick={onClose} className="grid size-11 place-items-center rounded-full border-0 bg-[#2a2f3a] text-[28px] font-light text-[#b9c1ce]">×</button></div>
      <h2 id="profile-title" className="mb-0 mt-7 text-[28px] font-bold tracking-[-0.04em]">내 프로필</h2>
      <p className="mb-6 mt-2 text-[13px] text-[#9aa3b2]">커뮤니티에서 사용할 닉네임을 확인하고 수정할 수 있어요.</p>
      <div className="rounded-[12px] border border-[#3a4250] bg-[#12151b] px-4 py-4"><span className="block text-xs font-bold text-[#9aa3b2]">아이디</span><strong className="mt-2 block text-base">{account?.login_id || "현재 세션 계정"}</strong></div>
      <form onSubmit={submit}>
        <label htmlFor="profile-nickname" className="mb-2 mt-6 block text-sm font-bold text-[#c8ccd4]">닉네임</label>
        <div className="flex gap-3"><input id="profile-nickname" value={nickname} onChange={(e) => { setNickname(e.target.value); setNotice(""); }} className="h-12 min-w-0 flex-1 rounded-[10px] border border-[#3a4250] bg-[#12151b] px-4 text-sm outline-none focus:border-[#6f9fff]" /><button type="button" onClick={() => setNotice("프로필 중복확인 API가 아직 준비되지 않았어요.")} className="w-[96px] shrink-0 rounded-[10px] border border-[#5f8bd1] bg-[#21304a] text-xs font-bold text-[#a9c8ff]">중복 확인</button></div>
        <p className="mt-2 text-xs text-[#9aa3b2]">커뮤니티에서 보여요. 1~12자</p>
        {notice && <p role="status" className="mt-3 text-xs text-[#a9c8ff]">{notice}</p>}
        <button type="submit" className="mt-6 h-12 w-full rounded-[10px] border-0 bg-[#6f9fff] text-sm font-bold text-[#0f1115] transition hover:bg-[#83adff]">변경사항 저장하기</button>
      </form>
      <p className="mb-0 mt-5 text-center text-xs text-[#9aa3b2]">닉네임은 커뮤니티의 방과 댓글에 표시돼요.</p>
    </section>
  </div>;
}
