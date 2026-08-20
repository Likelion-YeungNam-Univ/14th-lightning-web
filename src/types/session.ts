//POST /session
// 첫 진입  -> 종목 4개 받음
export type SessionResponse = {
  created: boolean;
  authenticated: boolean;
  stocks: string[];
  nickname?: string | null;
};

// POST /auth/mock-login
// 설정한거 확인
export type LoginResponse = { authenticated: boolean };
export type LogoutResponse = { authenticated: boolean };
export type AccountResponse = {
  login_id: string;
  nickname: string;
  authenticated: boolean;
};

export type SignupRequest = {
  login_id: string;
  password: string;
  nickname: string;
};

export const LOGIN_ID_STORAGE_KEY = "assit_login_id";
