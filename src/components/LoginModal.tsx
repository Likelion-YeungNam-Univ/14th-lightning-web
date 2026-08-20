import { useState, type FormEvent } from "react";
import { postApi } from "../api/client";
import type { LoginResponse } from "../types/session";
import { Logo } from "./Logo";

type LoginModalProps = {
  onClose: () => void;
  onLoginSuccess: () => void;
};

/** 모의 로그인 계정을 입력받아 POST /auth/mock-login을 호출한다. */
export function LoginModal({ onClose, onLoginSuccess }: LoginModalProps) {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id.trim() || !password)
      return setLoginError("아이디와 비밀번호를 입력해주세요.");
    setLoginLoading(true);
    setLoginError("");
    try {
      const result = await postApi<LoginResponse>("/auth/mock-login", {
        id: id.trim(),
        password,
      });
      if (!result.authenticated)
        return setLoginError("아이디 또는 비밀번호가 맞지 않습니다.");
      setPassword("");
      onLoginSuccess();
    } catch (error) {
      setLoginError(
        error instanceof Error ? error.message : "로그인 요청에 실패했습니다.",
      );
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] grid place-items-center bg-black/70 p-5 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
        onMouseDown={(event) => event.stopPropagation()}
        className="relative w-full max-w-137.5 rounded-2xl border border-[#303744] bg-[#1c2029] p-8 shadow-2xl"
      >
        <button
          aria-label="닫기"
          onClick={onClose}
          className="absolute right-4 top-3 border-0 bg-transparent text-2xl text-[#9aa3b2]"
        >
          ×
        </button>
        <Logo />
        <h2 id="login-title" className="mb-6 mt-7 text-2xl font-bold">
          로그인
        </h2>
        <form onSubmit={submitLogin}>
          <label
            htmlFor="login-id"
            className="mb-2 block text-xs text-[#c8ccd4]"
          >
            아이디
          </label>
          <input
            id="login-id"
            autoFocus
            autoComplete="username"
            value={id}
            onChange={(event) => setId(event.target.value)}
            placeholder="아이디 입력"
            className="h-12 w-full rounded-lg border border-[#3a4250] bg-[#12151b] px-3 text-sm outline-none focus:border-[#4d9fff]"
          />
          <label
            htmlFor="login-password"
            className="mb-2 mt-4 block text-xs text-[#c8ccd4]"
          >
            비밀번호
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="비밀번호 입력"
            className="h-12 w-full rounded-lg border border-[#3a4250] bg-[#12151b] px-3 text-sm outline-none focus:border-[#4d9fff]"
          />
          {loginError && (
            <p role="alert" className="mt-5 text-sm text-[#c64848]">
              아이디 또는 비밀번호가 일치하지 않습니다.
            </p>
          )}
          <button
            type="submit"
            disabled={loginLoading}
            className="mt-5 h-12 w-full rounded-lg bg-[#4d9fff] text-sm font-bold text-[#0f1115] disabled:opacity-60"
          >
            {loginLoading ? "로그인 중..." : "로그인"}
          </button>
        </form>
      </section>
    </div>
  );
}
