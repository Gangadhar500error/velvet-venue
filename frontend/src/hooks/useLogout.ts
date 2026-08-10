"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { clearAuth, logout } from "@/lib/auth";
import { confirmAction } from "@/app/admin/_components/ui/Toast";

export function useLogout() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = useCallback(async () => {
    const confirmed = await confirmAction({
      title: "Sign out?",
      message: "You will be signed out and redirected to the login page.",
      confirmLabel: "Sign out",
      cancelLabel: "Cancel",
      danger: false,
    });

    if (!confirmed) return;

    setIsLoggingOut(true);
    try {
      await logout();
    } catch {
      clearAuth();
    } finally {
      router.replace("/signin");
      setIsLoggingOut(false);
    }
  }, [router]);

  return { handleLogout, isLoggingOut };
}
