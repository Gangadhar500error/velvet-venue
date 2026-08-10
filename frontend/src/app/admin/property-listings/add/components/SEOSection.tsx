"use client";

import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { PropertyFormData } from "@/types/property";

interface SEOSectionProps {
  formData: PropertyFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  isDarkMode: boolean;
}

export default function SEOSection({ formData, onChange, isDarkMode }: SEOSectionProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <h2 className={`text-lg font-semibold pb-2 border-b flex items-center gap-2 ${isDarkMode ? "border-gray-800 text-white" : "border-gray-200 text-gray-900"}`}>
        <Search className="w-5 h-5 text-[#C89B3C]" />
        SEO (Optional but Recommended)
      </h2>
      <div className="space-y-4">
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            SEO Title
          </label>
          <input
            type="text"
            name="seoTitle"
            value={formData.seoTitle}
            onChange={onChange}
            className={`w-full px-4 py-2.5 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
            placeholder="Optimized title for search engines"
          />
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            SEO Description
          </label>
          <textarea
            name="seoDescription"
            value={formData.seoDescription}
            onChange={onChange}
            rows={4}
            className={`w-full px-4 py-2.5 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
            placeholder="Meta description for search engines"
          />
        </div>
      </div>
    </motion.div>
  );
}

