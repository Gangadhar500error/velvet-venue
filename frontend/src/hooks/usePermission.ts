"use client";

import { useAuth } from "@/contexts/AuthContext";

export function usePermission() {
  const {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessRoute,
    portal,
    dataScope,
  } = useAuth();

  return {
    permissions,
    portal,
    dataScope,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessRoute,
  };
}
