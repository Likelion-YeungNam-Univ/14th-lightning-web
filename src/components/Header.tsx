import { Logo } from "./Logo";

type HeaderProps = {
  authenticated: boolean;
  sessionLoading: boolean;
  onLoginClick: () => void;
};

export function Header({ authenticated, sessionLoading, onLoginClick }: HeaderProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between bg-[#12151b] px-6 shadow-[0_1px_0_#20242c]">
      <Logo />
      {authenticated ? (
        <span className="flex items-center gap-2 text-sm text-[#c8ccd4]">
          <i className="size-2 rounded-full bg-[#4d9fff]" />
          로그인됨
        </span>
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
