import { apiRequest } from "@/lib/api";
import type {
  AccessConfigResponse,
  DashboardResponse,
  MenusResponse,
} from "@/types/permissions";

export async function fetchMenus(): Promise<MenusResponse> {
  return apiRequest<MenusResponse>("/auth/menus");
}

export async function fetchDashboardConfig(): Promise<DashboardResponse> {
  return apiRequest<DashboardResponse>("/auth/dashboard");
}

export async function fetchAccessConfig(): Promise<AccessConfigResponse> {
  return apiRequest<AccessConfigResponse>("/auth/access-config");
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
