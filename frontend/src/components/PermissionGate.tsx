"use client";

import type { ReactNode } from "react";
import { usePermission } from "@/hooks/usePermission";

interface PermissionGateProps {
  permission?: string;
  anyOf?: string[];
  allOf?: string[];
  children: ReactNode;
}

/** Renders children only when the user has the required permission(s). */
export function PermissionGate({
  permission,
  anyOf,
  allOf,
  children,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission();

  let allowed = true;
  if (permission) allowed = hasPermission(permission);
  else if (anyOf?.length) allowed = hasAnyPermission(...anyOf);
  else if (allOf?.length) allowed = hasAllPermissions(...allOf);

  if (!allowed) return null;
  return <>{children}</>;
}
