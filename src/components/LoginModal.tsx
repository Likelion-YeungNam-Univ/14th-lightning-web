import { useEffect, useState, type FormEvent } from "react";
import { ApiError, postApi } from "../api/client";
import type {
  AccountResponse,
  SessionResponse,
  SignupRequest,
} from "../types/session";
import { Logo } from "./Logo";

type LoginModalProps = {
  onClose: () => void;
  onLoginSuccess: (account: AccountResponse) => void;
};

type AuthMode = "login" | "signup";
const fieldClass = "h-12 w-full rounded-[10px] border border-[#3a4250] bg-[#12151b] px-4 text-sm text-[#f2f3f5] outline-none placeholder:text-[#737b88] focus:border-[#6f9fff]";

function authErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    if (error.code === "invalid_credentials" || error.status === 401) {
      return "아이디 또는 비밀번호가 일치하지 않습니다.";
    }
    if (error.code === "duplicate_login_id") {
      return "이미 사용 중인 아이디입니다.";
    }
    if (error.code === "already_logged_in") {
      return "이미 로그인된 계정이 있습니다.";
    }
    if (error.code === "rate_limited" || error.status === 429) {
      return "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
    }
    if (error.code === "validation_error" || error.status === 422) {
      return "입력 내용을 다시 확인해주세요.";
    }
    return error.message;
  }
  return error instanceof Error ? error.message : fallback;
}

/** 실계정 로그인과 회원가입을 한 모달 안에서 전환해 처리한다. */
export function LoginModal({ onClose, onLoginSuccess }: LoginModalProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [nickname, setNickname] = useState("");
  const [nicknameStatus, setNicknameStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError("");
    setPassword("");
    setPasswordConfirm("");
    setNicknameStatus("");
  };

  const validateSignup = () => {
    if (!/^[a-z0-9_]{4,20}$/.test(loginId)) return "아이디는 영문 소문자·숫자·밑줄을 사용해 4~20자로 입력해주세요.";
    if (password.length < 8 || password.length > 64) return "비밀번호는 8~64자로 입력해주세요.";
    if (password !== passwordConfirm) return "비밀번호 확인이 일치하지 않습니다.";
    if (nickname.trim().length < 1 || nickname.trim().length > 12) return "닉네임은 1~12자로 입력해주세요.";
    return null;
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (mode === "login" && (!loginId.trim() || !password)) return setError("아이디와 비밀번호를 입력해주세요.");
    if (mode === "signup") {
      const validationError = validateSignup();
      if (validationError) return setError(validationError);
    }
    setLoading(true);
    try {
      // 실계정 API도 익명 세션 쿠키를 기준으로 기존 활동을 승계하므로,
      // 브라우저에 쿠키가 없거나 만료된 경우를 대비해 먼저 세션을 보장한다.
      await postApi<SessionResponse>("/session");
      const account = mode === "signup"
        ? await postApi<AccountResponse>("/auth/signup", {
            login_id: loginId.trim(), password, nickname: nickname.trim(),
          } satisfies SignupRequest)
        : await postApi<AccountResponse>("/auth/login", {
            login_id: loginId.trim(), password,
          });
      onLoginSuccess(account);
    } catch (requestError) {
      setError(authErrorMessage(requestError, mode === "signup" ? "회원가입에 실패했습니다." : "로그인 요청에 실패했습니다."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 p-5 backdrop-blur-sm" onMouseDown={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby="auth-title" onMouseDown={(event) => event.stopPropagation()} className="relative flex max-h-[calc(100vh-40px)] w-full max-w-[520px] flex-col overflow-hidden rounded-[18px] border border-[#303744] bg-[#1c2029] shadow-[0_28px_90px_rgba(0,0,0,.6)]">
        <div className="flex shrink-0 items-center justify-between bg-[#1c2029] px-7 pb-3 pt-6 max-[640px]:px-5">
          <Logo />
          <button type="button" aria-label="닫기" onClick={onClose} className="grid size-11 place-items-center rounded-full border-0 bg-[#2a2f3a] text-[28px] font-light text-[#b9c1ce] transition hover:bg-[#343b48] hover:text-white">×</button>
        </div>
        <div className="min-h-0 overflow-y-auto px-7 pb-7 max-[640px]:px-5">
          <h2 id="auth-title" className="mb-0 mt-4 text-[28px] font-bold tracking-[-0.04em]">{mode === "signup" ? "회원가입" : "로그인"}</h2>
          <p className="mb-6 mt-2 text-[13px] leading-6 text-[#9aa3b2]">{mode === "signup" ? "아이디와 비밀번호, 커뮤니티에서 사용할 닉네임을 만들어 주세요." : "아이디와 비밀번호를 입력해 주세요."}</p>
          <form onSubmit={submit}>
            <label htmlFor="auth-id" className="mb-2 block text-sm font-bold text-[#c8ccd4]">아이디</label>
            <input id="auth-id" autoFocus autoComplete="username" value={loginId} onChange={(e) => setLoginId(e.target.value)} placeholder={mode === "signup" ? "예) assit_user" : "아이디 입력"} className={fieldClass} />
            {mode === "signup" && <p className="mb-5 mt-2 text-xs text-[#9aa3b2]">영문 소문자·숫자·밑줄, 4~20자</p>}
            <label htmlFor="auth-password" className="mb-2 mt-5 block text-sm font-bold text-[#c8ccd4]">비밀번호</label>
            <input id="auth-password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === "signup" ? "8자 이상" : "비밀번호 입력"} className={fieldClass} />
            {mode === "signup" && <p className="mb-5 mt-2 text-xs text-[#9aa3b2]">8~64자로 입력해 주세요.</p>}
            {mode === "signup" && <>
              <label htmlFor="auth-password-confirm" className="mb-2 mt-5 block text-sm font-bold text-[#c8ccd4]">비밀번호 확인</label>
              <input id="auth-password-confirm" type="password" autoComplete="new-password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} className={fieldClass} />
              <label htmlFor="auth-nickname" className="mb-2 mt-5 block text-sm font-bold text-[#c8ccd4]">닉네임</label>
              <div className="flex gap-3">
                <input id="auth-nickname" value={nickname} onChange={(e) => { setNickname(e.target.value); setNicknameStatus(""); }} placeholder="예) 반도체러버" className={fieldClass} />
                <button type="button" onClick={() => setNicknameStatus(nickname.trim().length >= 1 && nickname.trim().length <= 12 ? "사용할 수 있는 형식이에요." : "닉네임은 1~12자로 입력해주세요.")} className="w-[96px] shrink-0 rounded-[10px] border border-[#5f8bd1] bg-[#21304a] text-xs font-bold text-[#a9c8ff] transition hover:bg-[#293c5c]">형식 확인</button>
              </div>
              <p className="mt-2 text-xs text-[#9aa3b2]">커뮤니티에서 보여요. 1~12자</p>
              {nicknameStatus && <p className={`mt-2 text-xs font-bold ${nicknameStatus.startsWith("사용할 수") ? "text-[#82d5a0]" : "text-[#ef7b7b]"}`}>{nicknameStatus}</p>}
            </>}
            {error && <p role="alert" className="mt-5 text-sm text-[#ef7b7b]">{error}</p>}
            <button type="submit" disabled={loading} className="mt-6 h-12 w-full rounded-[10px] border-0 bg-[#6f9fff] text-sm font-bold text-[#0f1115] transition hover:bg-[#83adff] disabled:opacity-60">{loading ? (mode === "signup" ? "가입 중..." : "로그인 중...") : (mode === "signup" ? "회원가입하고 로그인" : "로그인")}</button>
          </form>
          <p className="mb-0 mt-6 text-center text-sm text-[#9aa3b2]">{mode === "signup" ? "이미 계정이 있나요? " : "처음이신가요? "}<button type="button" onClick={() => changeMode(mode === "signup" ? "login" : "signup")} className="border-0 bg-transparent p-0 font-bold text-[#6f9fff] underline underline-offset-4">{mode === "signup" ? "로그인" : "회원가입"}</button></p>
        </div>
      </section>
    </div>
  );
}
