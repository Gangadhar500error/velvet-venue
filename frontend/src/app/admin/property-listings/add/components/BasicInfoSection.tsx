"use client";

import { motion } from "framer-motion";
import { Building2 } from "lucide-react";
import { PropertyFormData, WorkspaceType } from "@/types/property";

interface BasicInfoSectionProps {
  formData: PropertyFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  errors?: { [key: string]: string };
  isDarkMode: boolean;
}

const WORKSPACE_TYPES: WorkspaceType[] = ["Coworking", "Private Office", "Meeting Room", "Virtual Office"];

export default function BasicInfoSection({ formData, onChange, errors = {}, isDarkMode }: BasicInfoSectionProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <h2 className={`text-lg font-semibold pb-2 border-b flex items-center gap-2 ${isDarkMode ? "border-gray-800 text-white" : "border-gray-200 text-gray-900"}`}>
        <Building2 className="w-5 h-5 text-[#C89B3C]" />
        Basic Property Info
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Property Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="propertyName"
            value={formData.propertyName}
            onChange={onChange}
            required
            className={`w-full px-4 py-2.5 rounded-lg border ${
              errors.propertyName
                ? isDarkMode
                  ? "bg-gray-800 border-red-500 text-white"
                  : "bg-white border-red-500 text-gray-900"
                : isDarkMode
                ? "bg-gray-800 border-gray-700 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
          />
          {errors.propertyName && (
            <p className="mt-1 text-sm text-red-500">{errors.propertyName}</p>
          )}
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Workspace Type <span className="text-red-500">*</span>
          </label>
          <select
            name="workspaceType"
            value={formData.workspaceType}
            onChange={onChange}
            required
            className={`w-full px-4 py-2.5 rounded-lg border ${
              errors.workspaceType
                ? isDarkMode
                  ? "bg-gray-800 border-red-500 text-white"
                  : "bg-white border-red-500 text-gray-900"
                : isDarkMode
                ? "bg-gray-800 border-gray-700 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
          >
            <option value="">Select workspace type</option>
            {WORKSPACE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {errors.workspaceType && (
            <p className="mt-1 text-sm text-red-500">{errors.workspaceType}</p>
          )}
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Brand / Operator Name
          </label>
          <input
            type="text"
            name="brandOperatorName"
            value={formData.brandOperatorName}
            onChange={onChange}
            className={`w-full px-4 py-2.5 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
          />
        </div>
        <div className="md:col-span-2">
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Short Description
          </label>
          <textarea
            name="shortDescription"
            value={formData.shortDescription}
            onChange={onChange}
            rows={3}
            className={`w-full px-4 py-2.5 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
          />
        </div>
        <div className="md:col-span-2">
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Detailed Description
          </label>
          <textarea
            name="detailedDescription"
            value={formData.detailedDescription}
            onChange={onChange}
            rows={6}
            className={`w-full px-4 py-2.5 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
          />
        </div>
      </div>
    </motion.div>
  );
}

