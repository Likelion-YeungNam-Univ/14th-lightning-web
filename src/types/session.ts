//POST /session
// 첫 진입  -> 종목 4개 받음
export type SessionResponse = {
  created: boolean;
  authenticated: boolean;
  stocks: string[];
  nickname?: string | null;
};

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
