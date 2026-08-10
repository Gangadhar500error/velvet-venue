"use client";

import { X, User, Phone, HelpCircle, Package, Settings, LogOut, ChevronRight, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AllCitiesModal from "./AllCitiesModal";

interface ProfileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileSidebar({ isOpen, onClose }: ProfileSidebarProps) {
  const router = useRouter();
  const [allCitiesModalOpen, setAllCitiesModalOpen] = useState(false);

  const menuItems = [
    { name: "All Cities", icon: MapPin, href: "#", action: () => setAllCitiesModalOpen(true) },
    { name: "Help & Support", icon: HelpCircle, href: "/help" },
    { name: "Products", icon: Package, href: "/products" },
    { name: "Settings", icon: Settings, href: "/settings" },
  ];

  const handleItemClick = (item: typeof menuItems[0]) => {
    if (item.action) {
      item.action();
    } else if (item.href && item.href !== "#") {
      router.push(item.href);
    }
    onClose();
  };

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Overlay - Desktop and Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-md z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-72 lg:w-[370px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Menu Items */}
        <div className="flex flex-col py-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                onClick={() => handleItemClick(item)}
                className="flex items-center justify-between px-4 py-4 text-left hover:bg-gray-50 hover:text-orange-500 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                  <span className="text-base lg:text-[32px] leading-normal lg:leading-[32px] text-[rgb(97,97,97)] font-medium">{item.name}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-orange-500 transition-colors" />
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-2" />

        {/* Phone Number */}
        <div className="px-4 py-3">
          <a
            href="tel:+919876543210"
            className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors group"
          >
            <Phone className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-xs text-gray-500">Call us</p>
              <p className="text-sm font-semibold text-orange-600">+91 98765 43210</p>
            </div>
          </a>
        </div>

        {/* Footer Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50 space-y-2">
          <button
            onClick={() => {
              router.push("/signin");
              onClose();
            }}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-white transition-colors font-medium"
          >
            <LogOut className="h-4 w-4" />
            <span>Login</span>
          </button>
          <button
            onClick={() => {
              router.push("/register");
              onClose();
            }}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors font-medium"
          >
            <span>Register</span>
          </button>
        </div>
      </div>

      {/* All Cities Modal */}
      <AllCitiesModal
        isOpen={allCitiesModalOpen}
        onClose={() => {
          setAllCitiesModalOpen(false);
          onClose();
        }}
      />
    </>
  );
}
