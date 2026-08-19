import { deleteApi } from './client';

/** 로그아웃 요청. 세션을 종료하고 서버가 쿠키를 만료시킨다. DELETE /session */
export async function logout(): Promise<void> {
  await deleteApi<null>('/session');
}