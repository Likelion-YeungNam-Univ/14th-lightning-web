const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "/api";

type ErrorPayload = {
  code?: string;
  message?: string;
  details?: unknown;
  detail?: { msg?: string }[];
};

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

async function parseApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ErrorPayload | null;
    throw new ApiError(response, payload);
  }
  return response.json() as Promise<T>;
}

export async function postApi<T>(path: string, body?: object): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return parseApiResponse<T>(response);
}

export async function putApi<T>(path: string, body?: object): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return parseApiResponse<T>(response);
}

export async function getApi<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  return parseApiResponse<T>(response);
}

export async function deleteApi<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "DELETE",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  return parseApiResponse<T>(response);
}
