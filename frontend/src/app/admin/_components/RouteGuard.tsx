"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ForbiddenPage } from "./ForbiddenPage";

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { canAccessRoute, isLoading } = useAuth();

  if (isLoading) return null;

  if (pathname.startsWith("/admin") && !canAccessRoute(pathname)) {
    return <ForbiddenPage />;
  }

  return <>{children}</>;
}
