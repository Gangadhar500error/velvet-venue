"use client";

import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { PropertyFormData } from "@/types/property";

interface LegalSectionProps {
  formData: PropertyFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  errors?: { [key: string]: string };
  isDarkMode: boolean;
}

export default function LegalSection({ formData, onChange, errors = {}, isDarkMode }: LegalSectionProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <h2 className={`text-lg font-semibold pb-2 border-b flex items-center gap-2 ${isDarkMode ? "border-gray-800 text-white" : "border-gray-200 text-gray-900"}`}>
        <Shield className="w-5 h-5 text-[#C89B3C]" />
        Legal & Compliance
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            GST Registered
          </label>
          <select
            name="gstRegistered"
            value={formData.gstRegistered}
            onChange={onChange}
            className={`w-full px-4 py-2.5 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>
        {formData.gstRegistered === "yes" && (
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              GST Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="gstNumber"
              value={formData.gstNumber}
              onChange={onChange}
              required={formData.gstRegistered === "yes"}
              className={`w-full px-4 py-2.5 rounded-lg border ${
                errors.gstNumber
                  ? isDarkMode
                    ? "bg-gray-800 border-red-500 text-white"
                    : "bg-white border-red-500 text-gray-900"
                  : isDarkMode
                  ? "bg-gray-800 border-gray-700 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
            />
            {errors.gstNumber && <p className="mt-1 text-sm text-red-500">{errors.gstNumber}</p>}
          </div>
        )}
      </div>
    </motion.div>
  );
}

