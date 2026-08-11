/**
 * API utility functions for making authenticated requests
 */

import { getAccessToken, getRefreshToken, refreshAccessToken, clearAuth } from "@/lib/auth";

const getApiBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api/v1";
};

interface ApiRequestOptions extends RequestInit {
  params?: Record<string, string | number | null | undefined>;
  retry?: boolean;
}

async function parseApiError(response: Response): Promise<string> {
  const errorData = await response.json().catch(() => ({
    message: `HTTP error! status: ${response.status}`,
  }));
  if (typeof errorData.message === "string") return errorData.message;
  if (typeof errorData.detail === "string") return errorData.detail;
  if (Array.isArray(errorData.detail) && errorData.detail[0]?.msg) {
    return String(errorData.detail[0].msg);
  }
  return errorData.error || "API request failed";
}

const inflightGets = new Map<string, Promise<unknown>>();

/**
 * Make an authenticated API request with automatic token refresh on 401.
 * Identical in-flight GET requests share one network call (React Strict Mode, parallel mounts).
 */
export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { params, retry = true, ...fetchOptions } = options;
  const method = String(fetchOptions.method || "GET").toUpperCase();
  const baseUrl = getApiBaseUrl();

  let url = `${baseUrl}${endpoint}`;
  if (params) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        queryParams.append(key, String(value));
      }
    });
    const queryString = queryParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  if (method === "GET") {
    const pending = inflightGets.get(url);
    if (pending) return pending as Promise<T>;
  }

  const request = executeApiRequest<T>(url, { ...fetchOptions, retry });
  if (method === "GET") {
    inflightGets.set(url, request);
    request.finally(() => {
      if (inflightGets.get(url) === request) inflightGets.delete(url);
    });
  }
  return request;
}

async function executeApiRequest<T>(
  url: string,
  options: RequestInit & { retry?: boolean }
): Promise<T> {
  const { retry = true, ...fetchOptions } = options;
  let token = getAuthToken();
  if (!token && getRefreshToken()) {
    token = await refreshAccessToken();
  }

  const makeRequest = async (accessToken: string | null) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(fetchOptions.headers as Record<string, string>),
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    return fetch(url, {
      ...fetchOptions,
      headers,
    });
  };

  let response = await makeRequest(token);

  if (response.status === 401 && retry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      token = newToken;
      response = await makeRequest(newToken);
    } else {
      clearAuth();
    }
  }

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json();
}

function getAuthToken(): string | null {
  return getAccessToken();
}

export interface FetchUsersParams {
  search?: string;
  column?: string;
  dir?: "asc" | "desc";
  length?: number;
  draw?: number;
  page?: number;
}

export interface UserData {
  id: number;
  name: string;
  user_name: string;
  email: string;
  status: string;
  slug: string;
  role?: {
    id?: number;
    title?: string;
    slug?: string;
  };
  contact_type?: {
    id?: number;
    title?: string;
  };
}

export interface UsersResponse {
  data: UserData[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
    links: Array<{
      url: string | null;
      label: string;
      active: boolean;
    }>;
  };
  payload: Record<string, unknown>;
}

export async function fetchUsers(
  params: FetchUsersParams = {}
): Promise<UsersResponse> {
  const {
    search = "",
    column = "id",
    dir = "desc",
    length = 10,
    draw = 1,
    page = 1,
  } = params;

  return apiRequest<UsersResponse>("/users", {
    params: {
      search: search || undefined,
      column,
      dir,
      length,
      draw,
      page,
    },
  });
}
