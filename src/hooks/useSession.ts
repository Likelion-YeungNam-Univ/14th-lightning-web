import { useEffect, useState } from "react";
import { postApi } from "../api/client";
import { LOGIN_ID_STORAGE_KEY, type SessionResponse } from "../types/session";
import type { AccountResponse } from "../types/session";

/** 첫 진입 시 세션을 생성하거나 재사용하고 인증 상태를 관리한다. */
export function useSession() {
  const [authenticated, setAuthenticated] = useState(false);
  const [account, setAccount] = useState<AccountResponse | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");

  // 앱이 처음 마운트될 때([]빈거) 한 번만 POST /session을 호출한다.
  useEffect(() => {
    const loadSession = async () => {
      try {
        const session = await postApi<SessionResponse>("/session"); //동기-> post api로 간편하게 부르기 및 session에 정보 저장
        setAuthenticated(session.authenticated); // 여전히 false(:로드세션)
        setAccount(
          session.authenticated && session.nickname
            ? {
                login_id: window.localStorage.getItem(LOGIN_ID_STORAGE_KEY) ?? "",
                nickname: session.nickname,
                authenticated: true,
              }
            : null,
        );
        if (!session.authenticated) {
          window.localStorage.removeItem(LOGIN_ID_STORAGE_KEY);
        }
      } catch (error) {
        setSessionError(
          error instanceof Error
            ? error.message
            : "세션을 연결하지 못했습니다.",
        );
      } finally {
        setSessionLoading(false);
      }
    };
    void loadSession();
  }, []);

  return {
    authenticated,
    setAuthenticated,
    account,
    setAccount,
    sessionLoading,
    sessionError,
  };
}
//로그인 성공 시 인증 상태를 직접 업데이트할 수 있게 하기 위해서 set함수 반환
