"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  clearAuth,
  getMe,
  getStoredUser,
  saveAuthSession,
  getAccessToken,
  getRefreshToken,
  refreshAccessToken,
} from "@/lib/auth";
import {
  canAccessRoute,
  fetchAccessConfig,
  fetchDashboardConfig,
  fetchMenus,
} from "@/lib/permissions";
import type { AuthUser, MeResponse } from "@/types/auth";
import type { DashboardResponse, MenuItem } from "@/types/permissions";

interface AuthContextValue {
  user: AuthUser | null;
  permissions: Set<string>;
  portal: string;
  dataScope: string;
  menus: MenuItem[];
  dashboard: DashboardResponse | null;
  routePermissions: Record<string, string>;
  isLoading: boolean;
  hasPermission: (code: string) => boolean;
  hasAnyPermission: (...codes: string[]) => boolean;
  hasAllPermissions: (...codes: string[]) => boolean;
  canAccessRoute: (pathname: string) => boolean;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function meToAuthUser(me: MeResponse): AuthUser {
  return {
    id: me.id,
    name: `${me.first_name} ${me.last_name}`.trim(),
    role: me.role,
    email: me.email,
    phone: me.phone,
    first_name: me.first_name,
    last_name: me.last_name,
    created_at: me.created_at,
    portal: me.portal,
    permissions: me.permissions,
    data_scope: me.data_scope,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [portal, setPortal] = useState("admin");
  const [dataScope, setDataScope] = useState("all");
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [routePermissions, setRoutePermissions] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  const loadAuth = useCallback(async () => {
    try {
      if (!getAccessToken()) {
        const refreshed = await refreshAccessToken();
        if (!refreshed) {
          clearAuth();
          setUser(null);
          router.replace("/signin");
          return;
        }
      }

      const [me, accessConfig, menuData, dashboardData] = await Promise.all([
        getMe(),
        fetchAccessConfig(),
        fetchMenus(),
        fetchDashboardConfig(),
      ]);

      const authUser = meToAuthUser(me);
      setUser(authUser);
      setPermissions(new Set(accessConfig.permissions));
      setPortal(accessConfig.portal);
      setDataScope(accessConfig.data_scope);
      setRoutePermissions(accessConfig.route_permissions);
      setMenus(menuData.items);
      setDashboard(dashboardData);

      const token = getAccessToken();
      const refresh = getRefreshToken();
      if (token && refresh) {
        saveAuthSession(token, refresh, authUser);
      }
    } catch {
      clearAuth();
      setUser(null);
      router.replace("/signin");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) setUser(stored);
    loadAuth();
  }, [loadAuth]);

  const hasPermission = useCallback(
    (code: string) => permissions.has(code),
    [permissions]
  );

  const hasAnyPermission = useCallback(
    (...codes: string[]) => codes.some((c) => permissions.has(c)),
    [permissions]
  );

  const hasAllPermissions = useCallback(
    (...codes: string[]) => codes.every((c) => permissions.has(c)),
    [permissions]
  );

  const checkRouteAccess = useCallback(
    (pathname: string) => canAccessRoute(pathname, permissions, routePermissions),
    [permissions, routePermissions]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      permissions,
      portal,
      dataScope,
      menus,
      dashboard,
      routePermissions,
      isLoading,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      canAccessRoute: checkRouteAccess,
      refreshAuth: loadAuth,
    }),
    [
      user,
      permissions,
      portal,
      dataScope,
      menus,
      dashboard,
      routePermissions,
      isLoading,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      checkRouteAccess,
      loadAuth,
    ]
  );

  if (isLoading || !user || !getAccessToken()) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0F172A]">
        <Loader2 className="w-8 h-8 animate-spin text-[#C89B3C]" />
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
