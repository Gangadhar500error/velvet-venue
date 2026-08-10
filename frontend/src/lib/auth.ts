import type {
  AuthUser,
  LoginResponse,
  MeResponse,
  MessageResponse,
  SignupPayload,
} from "@/types/auth";

export const AUTH_TOKEN_KEY = "auth_token";
export const REFRESH_TOKEN_KEY = "refresh_token";
export const AUTH_USER_KEY = "auth_user";

const getApiBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api/v1";
};

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken());
}

export function clearAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem("login_success");
  localStorage.removeItem("is_authenticated");
}

export function saveAuthSession(
  accessToken: string,
  refreshToken: string,
  user: AuthUser
): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  localStorage.setItem("login_success", "true");
  localStorage.setItem("is_authenticated", "true");
}

export function getRedirectPathForRole(_role: string): string {
  return "/admin";
}

async function parseApiError(response: Response): Promise<string> {
  const data = await response.json().catch(() => ({}));
  if (typeof data.message === "string") return data.message;
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    const first = data.errors[0];
    if (typeof first?.msg === "string") return first.msg;
  }
  return "Request failed";
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${getApiBaseUrl()}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const data = (await response.json()) as LoginResponse;
  saveAuthSession(data.access_token, data.refresh_token, {
    id: data.user.id,
    name: data.user.name,
    role: data.user.role,
    email: email.trim().toLowerCase(),
    portal: data.user.portal,
    permissions: data.user.permissions,
  });
  return data;
}

export async function signup(payload: SignupPayload): Promise<MessageResponse> {
  const response = await fetch(`${getApiBaseUrl()}/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json();
}

export async function getMe(): Promise<MeResponse> {
  const token = getAccessToken();
  if (!token) throw new Error("Not authenticated");

  const response = await fetch(`${getApiBaseUrl()}/auth/me`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const data = (await response.json()) as MeResponse;
  const user: AuthUser = {
    id: data.id,
    name: `${data.first_name} ${data.last_name}`.trim(),
    role: data.role,
    email: data.email,
    phone: data.phone,
    first_name: data.first_name,
    last_name: data.last_name,
    created_at: data.created_at,
    portal: data.portal,
    permissions: data.permissions,
    data_scope: data.data_scope,
  };
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  return data;
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) return null;

  const data = await response.json();
  if (data.access_token) {
    localStorage.setItem(AUTH_TOKEN_KEY, data.access_token);
    return data.access_token;
  }
  return null;
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  try {
    if (refreshToken) {
      await fetch(`${getApiBaseUrl()}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    }
  } finally {
    clearAuth();
  }
}

export async function forgotPassword(email: string): Promise<MessageResponse> {
  const response = await fetch(`${getApiBaseUrl()}/auth/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json();
}
