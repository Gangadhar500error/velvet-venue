"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import AdminSidebar from "./_components/AdminSidebar";
import AdminNavbar from "./_components/AdminNavbar";
import { ToastHost, ConfirmHost } from "./_components/ui/Toast";
import { useTheme } from "./_components/ThemeProvider";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLarge, setIsLarge] = useState(false);
  const { isDarkMode, setDarkMode } = useTheme();

  useEffect(() => {
    const handleResize = () => setIsLarge(window.innerWidth >= 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
