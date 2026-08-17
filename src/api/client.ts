/**
 * 프론트 전역에서 사용하는 공통 API 클라이언트입니다.
 * 기본값 `/api`는 Vite 개발 프록시를 거치며, 모든 요청에 세션 쿠키를 포함합니다.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

/** 백엔드 응답 */
type ErrorPayload = {
  code?: string;
  message?: string;
  details?: unknown;
  detail?: { msg?: string }[];
};

/** http 상태코드, 백엔드 응답 본문 캡슐화 */
export class ApiError extends Error {
  code: string | null;
  status: number;
  details: unknown;

  constructor(response: Response, payload: ErrorPayload | null) {
    super(
      payload?.message ??
        payload?.detail?.[0]?.msg ??
        `요청에 실패했습니다. (${response.status})`,
    );
    this.name = "ApiError";
    this.code = payload?.code ?? null;
    this.status = response.status;
    this.details = payload?.details ?? null;
  }
}

/** 성공 응답은 지정 타입으로 반환하고, 실패 응답은 ApiError로 통일합니다. */
async function parseApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let payload: ErrorPayload | null = null;

    try {
      payload = (await response.json()) as ErrorPayload;
    } catch {
      const text = await response.text().catch(() => null);
      if (text) {
        payload = { message: text.slice(0, 300) };
      }
    }

    throw new ApiError(response, payload);
  }

  // 2. 204 No Content 또는 Content-Length가 0인 성공 응답 처리
  if (
    response.status === 204 ||
    response.headers.get("content-length") === "0"
  ) {
    return null as T;
  }

  // 3. 정상
  try {
    return (await response.json()) as T;
  } catch {
    return null as T;
  }
}

/** 세션 생성, 로그인, 종목·카드 저장, 용어 풀이 요청에 사용합니다. */
export async function postApi<T>(path: string, body?: object): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return parseApiResponse<T>(response);
}

/** F-3.7 관심 종목 노출 순서 변경 요청에 사용합니다. */
export async function putApi<T>(path: string, body?: object): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return parseApiResponse<T>(response);
}

/** 시장, 관심 종목, 카드 목록처럼 상태를 변경하지 않는 조회에 사용합니다. */
export async function getApi<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  return parseApiResponse<T>(response);
}

/** 관심 종목 제거와 저장 카드 해제 요청에 사용합니다. */
export async function deleteApi<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "DELETE",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  return parseApiResponse<T>(response);
}
