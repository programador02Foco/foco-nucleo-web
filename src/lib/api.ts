export function getToken() {
  const raw = localStorage.getItem("authToken");
  if (!raw) return null;
  try {
    return JSON.parse(raw).token as string;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("userId");
  localStorage.removeItem("userProfile");
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...init,
    headers,
  });
  if (response.status === 401) {
    clearSession();
    if (!window.location.pathname.startsWith("/login")) {
      window.location.assign("/login");
    }
    throw new Error("Sessão encerrada");
  }
  if (!response.ok) {
    let detail = `Erro ${response.status}`;
    try {
      const body = (await response.json()) as { message?: string | string[] };
      if (typeof body.message === "string") detail = body.message;
      else if (Array.isArray(body.message)) detail = body.message.join(" ");
    } catch {
      detail = `Erro ${response.status}`;
    }
    throw new Error(detail);
  }
  return response.json() as Promise<T>;
}
