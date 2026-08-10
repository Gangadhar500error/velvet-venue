"use client";

import {
  Building2,
  MapPin,
  ImageIcon,
  Clock,
  Phone,
  Shield,
  CheckSquare,
  Briefcase,
  Star,
  Search,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

interface FormSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isDarkMode: boolean;
}

interface Section {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const sections: Section[] = [
  { id: "basic", label: "Basic Info", icon: Building2 },
  { id: "location", label: "Location", icon: MapPin },
  { id: "media", label: "Media", icon: ImageIcon },
  { id: "availability", label: "Availability", icon: Clock },
  { id: "contact", label: "Contact", icon: Phone },
  { id: "legal", label: "Legal", icon: Shield },
  { id: "amenities", label: "Amenities", icon: CheckSquare },
  { id: "typeSpecific", label: "Type Specific", icon: Briefcase },
  { id: "admin", label: "Admin", icon: Star },
  { id: "seo", label: "SEO", icon: Search },
];

export default function FormSidebar({ activeSection, onSectionChange, isDarkMode }: FormSidebarProps) {
  return (
    <div className={`w-full md:w-64 lg:w-72 border-r ${isDarkMode ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-white"} p-4 space-y-2`}>
      <h3 className={`text-sm font-semibold uppercase tracking-wide mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
        Form Sections
      </h3>
      {sections.map((section) => {
        const Icon = section.icon;
        const isActive = activeSection === section.id;
        return (
          <button
            key={section.id}
            type="button"
            onClick={() => onSectionChange(section.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              isActive
                ? isDarkMode
                  ? "bg-[#C89B3C] text-white shadow-lg"
                  : "bg-[#C89B3C] text-white shadow-md"
                : isDarkMode
                ? "text-gray-400 hover:bg-gray-800 hover:text-white"
                : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{section.label}</span>
          </button>
        );
      })}
    </div>
  );
}

