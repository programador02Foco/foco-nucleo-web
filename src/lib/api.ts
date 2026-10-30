const SESSION_KEY = "foco-nucleo.session";

export type NucleoSession = {
  app: "foco-nucleo";
  token: string;
  userId: number;
  name: string;
  email: string;
};

export function readSession(): NucleoSession | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<NucleoSession>;
    if (data.app !== "foco-nucleo" || typeof data.token !== "string" || !data.token) return null;
    if (typeof data.userId !== "number") return null;
    return {
      app: "foco-nucleo",
      token: data.token,
      userId: data.userId,
      name: data.name ?? "",
      email: data.email ?? "",
    };
  } catch {
    return null;
  }
}

export function saveSession(session: Omit<NucleoSession, "app">) {
  const data: NucleoSession = { app: "foco-nucleo", ...session };
  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

export function getToken() {
  return readSession()?.token ?? null;
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
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
