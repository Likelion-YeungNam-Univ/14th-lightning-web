import { Logo } from "./Logo";
import type { PointBalanceResponse } from "../types/points";

type HeaderProps = {
  authenticated: boolean;
  sessionLoading: boolean;
  points: PointBalanceResponse | null;
  onLoginClick: () => void;
};

export function Header({
  authenticated,
  sessionLoading,
  points,
  onLoginClick,
}: HeaderProps) {
  const balance = points?.balance ?? 0;
  const held = points?.pizza_progress.held ?? balance;
  const target = points?.pizza_progress.target ?? 18_000;
  const percent = Math.min(100, Math.max(0, points?.pizza_progress.percent ?? 0));
  const numberFormatter = new Intl.NumberFormat("ko-KR");

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between bg-[#12151b] px-6 shadow-[0_1px_0_#20242c]">
      <Logo />
      {authenticated ? (
        <div className="flex items-center gap-3">
          <div className="relative h-[48px] w-[370px] rounded-full bg-[#1b2231] px-5 py-2 max-[860px]:hidden">
            <div className="flex items-center justify-between gap-6 text-[14px] font-bold">
              <span className="text-[#6fa8ff]">🍕 피자까지</span>
              <strong className="text-[#f2f3f5]">
                {numberFormatter.format(held)} / {numberFormatter.format(target)}P
              </strong>
            </div>
            <div className="absolute bottom-[5px] left-6 right-6 h-[5px] overflow-hidden rounded-full bg-[#2b3039]">
              <span
                className="block h-full rounded-full bg-[#6f9fff] transition-[width] duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          <div className="grid h-[48px] min-w-[116px] place-items-center rounded-full bg-[#1b2231] px-5 text-[17px] font-bold text-[#6fa8ff] max-[560px]:min-w-0 max-[560px]:px-4 max-[560px]:text-sm">
            {numberFormatter.format(balance)}P
          </div>

          <button
            type="button"
            aria-label="사용자 메뉴 열기"
            className="flex h-[48px] items-center gap-3 rounded-lg border-0 bg-transparent px-2 text-[16px] font-medium text-[#f2f3f5] transition hover:bg-[#1b2231] max-[560px]:hidden"
          >
            반도체러버
            <span aria-hidden="true" className="text-xl text-[#a4adbb]">
             ⌄
            </span>
          </button>
        </div>
      ) : (
        <button
          disabled={sessionLoading}
          onClick={onLoginClick}
          className="min-h-10 rounded-lg bg-[#4d9fff] px-6 text-sm font-bold text-[#0f1115] transition hover:bg-[#71b0ff] disabled:cursor-wait disabled:opacity-60"
        >
          {sessionLoading ? "연결 중" : "로그인"}
        </button>
      )}
    </header>
  );
}
