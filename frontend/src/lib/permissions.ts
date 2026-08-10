import { getAccessToken } from "@/lib/auth";
import type {
  AccessConfigResponse,
  DashboardResponse,
  MenusResponse,
} from "@/types/permissions";

const getApiBaseUrl = (): string =>
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api/v1";

async function authFetch<T>(path: string): Promise<T> {
  const token = getAccessToken();
  if (!token) throw new Error("Not authenticated");

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Request failed");
  }

  return response.json();
}

export async function fetchMenus(): Promise<MenusResponse> {
  return authFetch<MenusResponse>("/auth/menus");
}

export async function fetchDashboardConfig(): Promise<DashboardResponse> {
  return authFetch<DashboardResponse>("/auth/dashboard");
}

export async function fetchAccessConfig(): Promise<AccessConfigResponse> {
  return authFetch<AccessConfigResponse>("/auth/access-config");
}

/** Longest-prefix match for route → required permission code */
export function resolveRoutePermission(
  pathname: string,
  routePermissions: Record<string, string>
): string | null {
  if (routePermissions[pathname]) return routePermissions[pathname];

  const sorted = Object.keys(routePermissions).sort((a, b) => b.length - a.length);
  for (const route of sorted) {
    if (route !== "/admin" && pathname.startsWith(`${route}/`)) {
      return routePermissions[route];
    }
  }
  return null;
}

export function canAccessRoute(
  pathname: string,
  permissions: Set<string>,
  routePermissions: Record<string, string>
): boolean {
  const required = resolveRoutePermission(pathname, routePermissions);
  if (!required) return true;
  return permissions.has(required);
}
