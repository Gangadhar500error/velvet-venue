"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  PanelLeftOpen,
  PanelLeftClose,
  Search,
  Bell,
  X,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
  User,
  Settings,
  LogOut,
  CalendarClock,
  ClipboardCheck,
  Loader2,
} from "lucide-react";
import { getInitials, getRoleLabel } from "@/lib/auth-display";
import { useLogout } from "@/hooks/useLogout";
import type { AuthUser } from "@/types/auth";

interface AdminNavbarProps {
  onMenuClick: () => void;
  onToggleSidebar: () => void;
  isSidebarCollapsed: boolean;
  isDarkMode: boolean;
  onDarkModeToggle: (value: boolean) => void;
  currentUser?: AuthUser | null;
}

const iconBtn =
  "p-2.5 rounded-[12px] transition-all duration-200 text-[#64748B] hover:text-[#C89B3C] hover:bg-[#FCFAF8]";

export default function AdminNavbar({
  onMenuClick,
  onToggleSidebar,
  isSidebarCollapsed,
  isDarkMode,
  onDarkModeToggle,
  currentUser,
}: AdminNavbarProps) {
  const { handleLogout, isLoggingOut } = useLogout();
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const notifRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSearchModalOpen(false);
      }
    };
    if (isSearchModalOpen) {
      const id = setTimeout(() => searchInputRef.current?.focus(), 150);
      window.addEventListener("keydown", handler);
      return () => {
        clearTimeout(id);
        window.removeEventListener("keydown", handler);
      };
    }
  }, [isSearchModalOpen]);

  useEffect(() => {
    const handler = () => {
      const fs = !!(
        document.fullscreenElement ||
        // @ts-ignore - vendor prefixes
        (document as any).webkitFullscreenElement ||
        // @ts-ignore
        (document as any).mozFullScreenElement ||
        // @ts-ignore
        (document as any).msFullscreenElement
      );
      setIsFullscreen(fs);
    };
    document.addEventListener("fullscreenchange", handler);
    // @ts-ignore
    document.addEventListener("webkitfullscreenchange", handler);
    // @ts-ignore
    document.addEventListener("mozfullscreenchange", handler);
    // @ts-ignore
    document.addEventListener("MSFullscreenChange", handler);
    return () => {
      document.removeEventListener("fullscreenchange", handler);
      // @ts-ignore
      document.removeEventListener("webkitfullscreenchange", handler);
      // @ts-ignore
      document.removeEventListener("mozfullscreenchange", handler);
      // @ts-ignore
      document.removeEventListener("MSFullscreenChange", handler);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        const root: any = document.documentElement as any;
        if (root.requestFullscreen) await root.requestFullscreen();
        else if (root.webkitRequestFullscreen) await root.webkitRequestFullscreen();
        else if (root.mozRequestFullScreen) await root.mozRequestFullScreen();
        else if (root.msRequestFullscreen) await root.msRequestFullscreen();
        setIsFullscreen(true);
      } else {
        const doc: any = document as any;
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
        else if (doc.mozCancelFullScreen) await doc.mozCancelFullScreen();
        else if (doc.msExitFullscreen) await doc.msExitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // ignore
    }
  };

  const notifications = [
    { id: 1, title: "New appointment booked", time: "2m ago", icon: CalendarClock },
    { id: 2, title: "Task completed: Sunday prep", time: "45m ago", icon: ClipboardCheck },
    { id: 3, title: "System maintenance tonight", time: "1h ago", icon: Settings },
  ];

  const displayName = currentUser?.name || "Admin User";
  const displayEmail = currentUser?.email || "admin@velvetvenues.com";
  const displayRole = getRoleLabel(currentUser?.role);
  const initials = getInitials(displayName);

  const darkIconBtn = isDarkMode
    ? "p-2.5 rounded-[12px] transition-all duration-200 text-gray-300 hover:text-[#FB923C] hover:bg-white/[0.06]"
    : iconBtn;

  return (
    <nav
      className={`relative h-[72px] flex items-center justify-between px-4 md:px-6 transition-colors duration-150 ${
        isDarkMode
          ? "bg-[#111827] border-b border-[#334155]"
          : "bg-white border-b border-[#ECEEF2] shadow-[0_4px_18px_rgba(15,23,42,0.05)]"
      }`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          onClick={() => {
            if (window.innerWidth >= 1024) {
              onToggleSidebar();
            } else {
              onMenuClick();
            }
          }}
          className={darkIconBtn}
          aria-label="Toggle sidebar"
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="w-5 h-5" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
        </button>

        <div className="relative flex items-center min-w-0">
          <button
            onClick={() => setIsSearchModalOpen(true)}
            className={`sm:hidden ${darkIconBtn}`}
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          <div className="hidden sm:flex items-center">
            <div
              className={`flex items-center gap-2 rounded-[14px] px-3.5 py-1.5 w-[360px] border transition-colors duration-150 ${
                isDarkMode
                  ? "bg-[#1E293B] border-[#334155] focus-within:border-[#C89B3C]"
                  : "bg-[#F8FAFC] border-[#E5E7EB]"
              }`}
            >
              <Search
                className={`w-4 h-4 shrink-0 ${isDarkMode ? "text-gray-400" : "text-[#94A3B8]"}`}
              />
              <input
                type="text"
                placeholder="Search venues, bookings, customers..."
                className={`flex-1 h-9 bg-transparent border-none outline-none ring-0 focus:ring-0 focus:border-none text-sm ${
                  isDarkMode
                    ? "text-white placeholder-gray-400"
                    : "text-[#111827] placeholder-[#94A3B8]"
                }`}
              />
              <span
                className={`hidden md:inline-flex items-center justify-center px-2 py-0.5 text-[11px] font-medium rounded-md border ${
                  isDarkMode
                    ? "text-gray-300 bg-gray-900 border-gray-700"
                    : "text-[#64748B] bg-white border-[#E5E7EB]"
                }`}
              >
                /
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onDarkModeToggle(!isDarkMode)}
          className={darkIconBtn}
          aria-label={isDarkMode ? "Switch to light" : "Switch to dark"}
          title={isDarkMode ? "Light mode" : "Dark mode"}
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5 text-yellow-400" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>

        <button
          onClick={toggleFullscreen}
          className={darkIconBtn}
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen((v) => !v)}
            className={`${darkIconBtn} relative`}
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#C89B3C] text-white text-[10px] rounded-full flex items-center justify-center font-semibold">
              {notifications.length}
            </span>
          </button>
          {isNotifOpen && (
            <div
              className={`sm:absolute sm:right-0 sm:top-full sm:mt-2 sm:w-80 fixed left-2 right-2 top-[72px] w-auto rounded-[14px] shadow-xl overflow-hidden animate-[fadeIn_.2s_ease-out_forwards] z-50 border ${
                isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white border-[#E8EBEF]"
              }`}
            >
              <div
                className={`px-4 py-3 border-b font-semibold text-sm ${
                  isDarkMode ? "border-gray-800 text-white" : "border-[#ECEEF2] text-[#111827]"
                }`}
              >
                Notifications
              </div>
              <ul
                className={`max-h-[70vh] overflow-auto divide-y ${
                  isDarkMode ? "divide-gray-800" : "divide-[#F1F5F9]"
                }`}
              >
                {notifications.map((n) => {
                  const Icon = n.icon;
                  return (
                    <li
                      key={n.id}
                      className={`flex items-start gap-3 px-4 py-3 ${
                        isDarkMode ? "hover:bg-gray-800" : "hover:bg-[#F8FAFC]"
                      }`}
                    >
                      <div className="mt-0.5 p-2 rounded-[10px] bg-[#FCFAF8] text-[#C89B3C]">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p
                          className={`text-sm truncate ${
                            isDarkMode ? "text-white" : "text-[#111827]"
                          }`}
                        >
                          {n.title}
                        </p>
                        <p
                          className={`text-xs ${
                            isDarkMode ? "text-gray-400" : "text-[#94A3B8]"
                          }`}
                        >
                          {n.time}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <div className="relative ml-1" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen((v) => !v)}
            className={`flex items-center gap-2.5 pl-1.5 pr-2.5 py-1.5 rounded-[14px] transition-all duration-200 ${
              isDarkMode ? "hover:bg-white/[0.06]" : "hover:bg-[#F8FAFC]"
            }`}
            aria-label="Open profile menu"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C89B3C] to-[#B8862B] text-white flex items-center justify-center text-sm font-semibold shrink-0 shadow-sm">
              {initials}
            </div>
            <div className="hidden sm:block text-left min-w-0">
              <p
                className={`text-sm font-semibold leading-tight truncate ${
                  isDarkMode ? "text-white" : "text-[#111827]"
                }`}
              >
                {displayName}
              </p>
              <p
                className={`text-[11px] leading-tight truncate ${
                  isDarkMode ? "text-gray-400" : "text-[#94A3B8]"
                }`}
              >
                {displayRole}
              </p>
            </div>
          </button>
          {isProfileOpen && (
            <div
              className={`absolute right-0 mt-2 w-52 rounded-[14px] shadow-xl overflow-hidden animate-[fadeIn_.2s_ease-out_forwards] border z-50 ${
                isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white border-[#E8EBEF]"
              }`}
            >
              <div
                className={`px-4 py-3 border-b ${
                  isDarkMode ? "border-gray-800" : "border-[#ECEEF2]"
                }`}
              >
                <p
                  className={`text-sm font-semibold ${
                    isDarkMode ? "text-white" : "text-[#111827]"
                  }`}
                >
                  {displayName}
                </p>
                <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-[#94A3B8]"}`}>
                  {displayEmail}
                </p>
              </div>
              <Link
                href="/admin/settings/profile"
                onClick={() => setIsProfileOpen(false)}
                className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm ${
                  isDarkMode
                    ? "hover:bg-gray-800 text-white"
                    : "hover:bg-[#F8FAFC] text-[#374151]"
                }`}
              >
                <User className="w-4 h-4" /> Profile
              </Link>
              <Link
                href="/admin/settings"
                onClick={() => setIsProfileOpen(false)}
                className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm ${
                  isDarkMode
                    ? "hover:bg-gray-800 text-white"
                    : "hover:bg-[#F8FAFC] text-[#374151]"
                }`}
              >
                <Settings className="w-4 h-4" /> Settings
              </Link>
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={async () => {
                  setIsProfileOpen(false);
                  await handleLogout();
                }}
                className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm border-t ${
                  isDarkMode
                    ? "border-gray-800 hover:bg-red-500/10 text-red-400"
                    : "border-[#ECEEF2] hover:bg-red-50 text-red-600"
                } disabled:opacity-60`}
              >
                {isLoggingOut ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
                {isLoggingOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          )}
        </div>
      </div>

      {isSearchModalOpen && (
        <div className="sm:hidden fixed inset-0 z-[100]">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
            onClick={() => setIsSearchModalOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-0 flex items-start justify-center pt-16 px-4 z-[101]">
            <div
              className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border transform transition-all duration-200 ${
                isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white border-[#E8EBEF]"
              }`}
            >
              <div
                className={`relative p-4 border-b ${
                  isDarkMode ? "border-gray-800" : "border-[#ECEEF2]"
                }`}
              >
                <div
                  className={`flex items-center gap-2 rounded-[14px] px-3 py-2.5 border ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-700"
                      : "bg-[#F8FAFC] border-[#E5E7EB]"
                  }`}
                >
                  <Search
                    className={`w-5 h-5 shrink-0 ${
                      isDarkMode ? "text-gray-400" : "text-[#94A3B8]"
                    }`}
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search modules, appointments, tasks..."
                    className={`flex-1 h-9 bg-transparent outline-none text-sm ${
                      isDarkMode
                        ? "text-white placeholder-gray-400"
                        : "text-[#111827] placeholder-[#94A3B8]"
                    }`}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setIsSearchModalOpen(false);
                    }}
                  />
                  <button
                    onClick={() => setIsSearchModalOpen(false)}
                    className={`p-1.5 rounded-md transition-colors ${
                      isDarkMode
                        ? "hover:bg-gray-700 text-gray-400"
                        : "hover:bg-[#FCFAF8] text-[#C89B3C]"
                    }`}
                    aria-label="Close search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-4 max-h-[60vh] overflow-y-auto">
                <p
                  className={`text-[11px] uppercase tracking-[0.12em] mb-3 font-bold ${
                    isDarkMode ? "text-gray-400" : "text-[#94A3B8]"
                  }`}
                >
                  Quick Actions
                </p>
                <ul className="space-y-1">
                  {[
                    "View all appointments",
                    "Create new task",
                    "Open communications",
                    "Go to colleges",
                  ].map((label) => (
                    <li key={label}>
                      <button
                        className={`w-full text-left py-2.5 px-3 rounded-[12px] text-sm transition-colors ${
                          isDarkMode
                            ? "text-white hover:bg-gray-800"
                            : "text-[#374151] hover:bg-[#F8FAFC]"
                        }`}
                      >
                        {label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
