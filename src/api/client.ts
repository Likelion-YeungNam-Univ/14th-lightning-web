const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "/api";

export async function postApi<T>(path: string, body?: object): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(
      payload?.detail?.[0]?.msg ?? `요청에 실패했습니다. (${response.status})`,
    );
  }
  return response.json() as Promise<T>;
}

export async function getApi<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(
      payload?.detail?.[0]?.msg ?? `요청에 실패했습니다. (${response.status})`,
    );
  }
  return response.json() as Promise<T>;
}
