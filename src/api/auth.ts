import { postApi } from './client';

/** 로그아웃 요청. 서버가 세션 쿠키를 만료시킨다. POST /auth/logout */
export async function logout(): Promise<void> {
  await postApi<null>('/auth/logout');
}