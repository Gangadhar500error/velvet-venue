"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  X,
  ChevronDown,
  Users,
  UserRound,
  Building2,
  Briefcase,
  CalendarDays,
  Calendar,
  Wallet,
  Banknote,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Loader2,
  Heart,
  Star,
  Bell,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getInitials, getRoleLabel } from "@/lib/auth-display";
import { useLogout } from "@/hooks/useLogout";
import type { MenuItem } from "@/types/permissions";

const SIDEBAR_W = 260;
const SIDEBAR_COLLAPSED_W = 72;
const ACCENT = "#C89B3C";

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  UserRound,
  Building2,
  Briefcase,
  CalendarDays,
  Calendar,
  Wallet,
  Banknote,
  FileText,
  BarChart3,
  Settings,
  Heart,
  Star,
  Bell,
};

type NavItem = Omit<MenuItem, "children"> & {
  iconComponent: LucideIcon;
  children?: NavItem[];
};

function mapMenus(items: MenuItem[]): NavItem[] {
  return items.map((item) => ({
    ...item,
    iconComponent: ICON_MAP[item.icon || ""] || LayoutDashboard,
    children: mapMenus(item.children || []),
  }));
}

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
  isDarkMode: boolean;
}

export default function AdminSidebar({
  isCollapsed,
  isMobileOpen,
  onMobileClose,
  isDarkMode,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const { user, menus } = useAuth();
  const { handleLogout, isLoggingOut } = useLogout();
  const navItems = useMemo(() => mapMenus(menus), [menus]);
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [tooltipVisible, setTooltipVisible] = useState<string | null>(null);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    const activeParents = navItems.filter((item) => {
      if (!item.children?.length) return false;
      return item.children.some(
        (child) =>
          child.href &&
          (pathname === child.href || pathname.startsWith(`${child.href}/`))
      );
    });
    if (activeParents.length) {
      setOpenItems((prev) => {
        const next = new Set(prev);
        activeParents.forEach((p) => next.add(p.label));
        return Array.from(next);
      });
    }
  }, [pathname, navItems]);

  useEffect(() => {
    const checkScreenSize = () => setIsLargeScreen(window.innerWidth >= 1024);
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() => {
    if (!isMobileOpen || isLargeScreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMobileOpen, isLargeScreen]);

  const toggleItem = (label: string) => {
    setOpenItems((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const displayName = user?.name || "User";
  const displayRole = getRoleLabel(user?.role);
  const initials = getInitials(displayName);

  const isChildActive = (children?: NavItem[]) => {
    if (!children?.length) return false;
    return children.some((child) => child.href && isActive(child.href));
  };

  const showLabels = !isCollapsed || isMobileOpen;

  const NavItemComponent = ({
    item,
    level = 0,
    forceLabels = false,
  }: {
    item: NavItem;
    level?: number;
    forceLabels?: boolean;
  }) => {
    const Icon = item.iconComponent;
    const hasChildren = Boolean(item.children?.length);
    const isOpen = openItems.includes(item.label);
    const childActive = isChildActive(item.children);
    const selfActive = !hasChildren && item.href ? isActive(item.href) : false;
    const active = selfActive;
    const isSection = hasChildren && level === 0;
    const labelsVisible = showLabels || forceLabels;

    const handleClick = (e: React.MouseEvent) => {
      if (hasChildren) {
        e.preventDefault();
        toggleItem(item.label);
      } else {
        onMobileClose();
      }
    };

    if (isSection && showLabels) {
      return (
        <div className="relative pt-5 first:pt-1">
          <button
            type="button"
            onClick={handleClick}
            className="group w-full flex items-center gap-2 px-3 py-2 mb-1.5 transition-colors duration-200"
            aria-expanded={isOpen}
            aria-label={item.label}
          >
            <span className="grow text-left text-[11px] font-bold uppercase tracking-[0.12em] text-[#B8C1CC]">
              {item.label}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#AAB4C4] shrink-0 transition-transform duration-[250ms] ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.div
                key="dropdown"
                className="overflow-hidden"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              >
                <div className="space-y-1 pb-1">
                  {item.children!.map((child) => (
                    <NavItemComponent key={child.id} item={child} level={level + 1} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    return (
      <div className="relative">
        <Link
          href={hasChildren ? "#" : item.href || "#"}
          onClick={handleClick}
          className={`
            group relative flex items-center gap-3 rounded-[12px] overflow-hidden transition-all duration-200
            ${level > 0 ? "pl-5 pr-4 py-3" : "px-4 py-3"}
            ${
              active
                ? "text-white shadow-[0_4px_20px_rgba(200, 155, 60,0.18)] hover:-translate-y-px"
                : "text-[#D6DCE5] hover:bg-white/[0.05] hover:text-white hover:-translate-y-px"
            }
            ${isCollapsed && !isMobileOpen && !forceLabels ? "justify-center px-2" : ""}
          `}
          style={
            active
              ? {
                  background:
                    "linear-gradient(90deg, rgba(200, 155, 60,.16), rgba(200, 155, 60,.05))",
                }
              : undefined
          }
          onMouseEnter={() => isCollapsed && !forceLabels && setTooltipVisible(item.label)}
          onMouseLeave={() => setTooltipVisible(null)}
          aria-label={item.label}
          aria-expanded={hasChildren ? isOpen : undefined}
        >
          {active && (
            <span
              className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full"
              style={{ backgroundColor: ACCENT }}
            />
          )}

          <Icon
            strokeWidth={1.75}
            className={`shrink-0 w-5 h-5 transition-colors duration-200 ${
              active
                ? "text-[#FB923C]"
                : childActive
                  ? "text-[#FB923C]"
                  : "text-[#AAB4C4] group-hover:text-white"
            }`}
          />

          {labelsVisible && (
            <>
              <span
                className={`grow truncate leading-snug ${
                  level > 0 ? "text-[15px] font-medium" : "text-[15px] font-semibold"
                }`}
              >
                {item.label}
              </span>
              {hasChildren && (
                <ChevronDown
                  className={`w-4 h-4 shrink-0 transition-transform duration-[250ms] ${
                    isOpen ? "rotate-180" : ""
                  } ${active ? "text-[#FB923C]" : "text-[#AAB4C4] group-hover:text-white"}`}
                />
              )}
            </>
          )}
        </Link>

        {isCollapsed && tooltipVisible === item.label && !isMobileOpen && !forceLabels && (
          <div className="absolute left-full ml-2 px-3 py-2 text-[15px] rounded-[12px] shadow-lg z-50 pointer-events-none whitespace-nowrap bg-[#1A1F28] text-white border border-white/10">
            {item.label}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full w-0 h-0 border-4 border-transparent border-r-[#1A1F28]" />
          </div>
        )}

        {hasChildren && isCollapsed && !isMobileOpen && level === 0 && (
          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.div
                key="collapsed-flyout"
                className="absolute left-full top-0 ml-2 w-56 rounded-[12px] bg-[#252B36] border border-white/[0.08] shadow-xl z-50 p-2"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.2 }}
              >
                <p className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#B8C1CC]">
                  {item.label}
                </p>
                {item.children!.map((child) => (
                  <NavItemComponent key={child.id} item={child} level={1} forceLabels />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    );
  };

  return (
    <>
      <style>{`
        .vv-sidebar-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,.15) transparent;
        }
        .vv-sidebar-scroll::-webkit-scrollbar { width: 5px; }
        .vv-sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .vv-sidebar-scroll::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,.15);
          border-radius: 999px;
        }
        .vv-sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,.30);
        }
      `}</style>

      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-[1px]"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <motion.aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r backdrop-blur-md ${
          isDarkMode
            ? "bg-[#111827]/95 border-[#334155]/80"
            : "bg-[#252B36] border-white/[0.06]"
        } ${!isLargeScreen && !isMobileOpen ? "pointer-events-none" : ""}`}
        initial={false}
        animate={{
          width: !isLargeScreen || !isCollapsed ? SIDEBAR_W : SIDEBAR_COLLAPSED_W,
          x: isLargeScreen ? 0 : isMobileOpen ? 0 : -SIDEBAR_W,
        }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-[72px] shrink-0 flex items-center justify-between border-b border-white/[0.08] px-4">
          {showLabels ? (
            <div className="flex items-center grow min-w-0">
              <Image
                src="/assets/valvetvenue.png"
                alt="VelvetVenues logo"
                width={180}
                height={48}
                className="h-10 w-auto object-contain"
                priority
                unoptimized
              />
            </div>
          ) : (
            <div className="mx-auto">
              <Image
                src="/assets/valvetvenue.png"
                alt="VelvetVenues logo"
                width={36}
                height={36}
                className="w-8 h-8 object-contain"
                priority
                unoptimized
              />
            </div>
          )}

          <button
            onClick={onMobileClose}
            className="lg:hidden p-2 rounded-[12px] text-[#AAB4C4] hover:text-white hover:bg-white/[0.05] transition-colors duration-200"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="vv-sidebar-scroll grow overflow-y-auto overflow-x-hidden px-3.5 py-5 space-y-1.5">
          {navItems.map((item) => (
            <NavItemComponent key={item.id} item={item} />
          ))}
        </nav>

        {showLabels ? (
          <div className="shrink-0 border-t border-white/[0.08] px-3 py-3.5 space-y-2">
            <div className="flex items-center gap-3 px-2 py-1.5 rounded-[12px]">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C89B3C] to-[#B8862B] flex items-center justify-center text-white text-sm font-semibold shrink-0">
                {initials}
              </div>
              <div className="min-w-0 grow">
                <p className="text-[15px] font-semibold text-white truncate leading-snug">
                  {displayName}
                </p>
                <p className="text-xs text-[#AAB4C4] truncate mt-0.5">{displayRole}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-[12px] text-sm font-medium text-[#E2E8F0] bg-white/[0.06] hover:bg-white/[0.1] hover:text-white border border-white/[0.08] transition-all duration-200 disabled:opacity-60"
            >
              {isLoggingOut ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" strokeWidth={1.75} />
              )}
              {isLoggingOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
        ) : (
          <div className="shrink-0 border-t border-white/[0.08] py-3 flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C89B3C] to-[#B8862B] flex items-center justify-center text-white text-sm font-semibold">
              {initials}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              title="Sign out"
              aria-label="Sign out"
              className="p-2 rounded-[12px] text-[#AAB4C4] hover:text-white hover:bg-white/[0.08] transition-colors duration-200 disabled:opacity-60"
            >
              {isLoggingOut ? (
                <Loader2 className="w-[18px] h-[18px] animate-spin" />
              ) : (
                <LogOut className="w-[18px] h-[18px]" strokeWidth={1.75} />
              )}
            </button>
          </div>
        )}
      </motion.aside>
    </>
  );
}
