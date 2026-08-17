//POST /session
// 첫 진입  -> 종목 4개 받음
export type SessionResponse = {
  created: boolean;
  authenticated: boolean;
  stocks: string[];
};

// POST /auth/mock-login
// 설정한거 확인
export type LoginResponse = { authenticated: boolean };
