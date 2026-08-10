"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import AdminSidebar from "./_components/AdminSidebar";
import AdminNavbar from "./_components/AdminNavbar";
import { ToastHost, ConfirmHost } from "./_components/ui/Toast";
import { useTheme } from "./_components/ThemeProvider";
import {
  clearAuth,
  getMe,
  isAuthenticated,
} from "@/lib/auth";
import type { AuthUser } from "@/types/auth";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLarge, setIsLarge] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const { isDarkMode, setDarkMode } = useTheme();

  useEffect(() => {
    const handleResize = () => setIsLarge(window.innerWidth >= 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const verifyAuth = async () => {
      if (!isAuthenticated()) {
        router.replace("/signin");
        return;
      }

      try {
        const me = await getMe();

        if (me.role === "customer") {
          clearAuth();
          router.replace("/signin");
          return;
        }

        setCurrentUser({
          id: me.id,
          name: `${me.first_name} ${me.last_name}`.trim(),
          role: me.role,
          email: me.email,
          phone: me.phone,
          first_name: me.first_name,
          last_name: me.last_name,
          created_at: me.created_at,
        });
      } catch {
        clearAuth();
        router.replace("/signin");
      } finally {
        setAuthChecking(false);
      }
    };

    verifyAuth();
  }, [router]);

  if (authChecking) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0F172A]">
        <Loader2 className="w-8 h-8 animate-spin text-[#C89B3C]" />
      </div>
    );
  }

  return (
    <div
      className={`vv-admin h-full flex overflow-hidden transition-colors duration-150 ${
        isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"
      }`}
    >
      <AdminSidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((p) => !p)}
        isMobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        isDarkMode={isDarkMode}
        currentUser={currentUser}
      />
      <motion.div
        className="flex-1 flex flex-col min-w-0 min-h-0 h-full overflow-hidden"
        initial={false}
        animate={{ marginLeft: isLarge ? (sidebarCollapsed ? 72 : 260) : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
      >
        <AdminNavbar
          onMenuClick={() => setMobileOpen(true)}
          onToggleSidebar={() => setSidebarCollapsed((p) => !p)}
          isSidebarCollapsed={sidebarCollapsed}
          isDarkMode={isDarkMode}
          onDarkModeToggle={setDarkMode}
          currentUser={currentUser}
        />
        <main
          className={`flex-1 min-h-0 p-4 md:p-6 overflow-y-auto overflow-x-hidden transition-colors duration-150 vv-admin-scroll ${
            isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"
          }`}
        >
          <div className="max-w-[1600px] mx-auto w-full">{children}</div>
        </main>
        <ToastHost />
        <ConfirmHost />
      </motion.div>
    </div>
  );
}
