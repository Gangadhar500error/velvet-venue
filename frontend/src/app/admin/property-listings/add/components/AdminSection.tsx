"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { PropertyFormData } from "@/types/property";

interface AdminSectionProps {
  formData: PropertyFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  errors?: { [key: string]: string };
  isDarkMode: boolean;
}

export default function AdminSection({ formData, onChange, errors = {}, isDarkMode }: AdminSectionProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <h2 className={`text-lg font-semibold pb-2 border-b flex items-center gap-2 ${isDarkMode ? "border-gray-800 text-white" : "border-gray-200 text-gray-900"}`}>
        <Star className="w-5 h-5 text-[#C89B3C]" />
        Admin Controls
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Property Status <span className="text-red-500">*</span>
          </label>
          <select
            name="propertyStatus"
            value={formData.propertyStatus}
            onChange={onChange}
            required
            className={`w-full px-4 py-2.5 rounded-lg border ${
              errors.propertyStatus
                ? isDarkMode
                  ? "bg-gray-800 border-red-500 text-white"
                  : "bg-white border-red-500 text-gray-900"
                : isDarkMode
                ? "bg-gray-800 border-gray-700 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {errors.propertyStatus && <p className="mt-1 text-sm text-red-500">{errors.propertyStatus}</p>}
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Verification Status <span className="text-red-500">*</span>
          </label>
          <select
            name="verificationStatus"
            value={formData.verificationStatus}
            onChange={onChange}
            required
            className={`w-full px-4 py-2.5 rounded-lg border ${
              errors.verificationStatus
                ? isDarkMode
                  ? "bg-gray-800 border-red-500 text-white"
                  : "bg-white border-red-500 text-gray-900"
                : isDarkMode
                ? "bg-gray-800 border-gray-700 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
          </select>
          {errors.verificationStatus && <p className="mt-1 text-sm text-red-500">{errors.verificationStatus}</p>}
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Featured Property
          </label>
          <select
            name="featuredProperty"
            value={formData.featuredProperty}
            onChange={onChange}
            className={`w-full px-4 py-2.5 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Priority Ranking
          </label>
          <input
            type="number"
            name="priorityRanking"
            value={formData.priorityRanking}
            onChange={onChange}
            className={`w-full px-4 py-2.5 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
            placeholder="Lower number = higher priority"
          />
        </div>
      </div>
    </motion.div>
  );
}

