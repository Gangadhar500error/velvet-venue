"use client";

import { motion } from "framer-motion";
import { CheckSquare } from "lucide-react";
import { PropertyFormData } from "@/types/property";

interface AmenitiesSectionProps {
  formData: PropertyFormData;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  isDarkMode: boolean;
}

export default function AmenitiesSection({ formData, onChange, isDarkMode }: AmenitiesSectionProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <h2 className={`text-lg font-semibold pb-2 border-b flex items-center gap-2 ${isDarkMode ? "border-gray-800 text-white" : "border-gray-200 text-gray-900"}`}>
        <CheckSquare className="w-5 h-5 text-[#C89B3C]" />
        Common Amenities
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            WiFi
          </label>
          <select
            name="wifi"
            value={formData.wifi}
            onChange={onChange}
            className={`w-full px-4 py-2.5 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            AC / Non-AC
          </label>
          <select
            name="acNonAc"
            value={formData.acNonAc}
            onChange={onChange}
            className={`w-full px-4 py-2.5 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
          >
            <option value="">Select</option>
            <option value="ac">AC</option>
            <option value="non-ac">Non-AC</option>
          </select>
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Power Backup
          </label>
          <select
            name="powerBackup"
            value={formData.powerBackup}
            onChange={onChange}
            className={`w-full px-4 py-2.5 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Lift
          </label>
          <select
            name="lift"
            value={formData.lift}
            onChange={onChange}
            className={`w-full px-4 py-2.5 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Parking
          </label>
          <select
            name="parking"
            value={formData.parking}
            onChange={onChange}
            className={`w-full px-4 py-2.5 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Security / CCTV
          </label>
          <select
            name="securityCctv"
            value={formData.securityCctv}
            onChange={onChange}
            className={`w-full px-4 py-2.5 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Pantry / Cafeteria
          </label>
          <select
            name="pantryCafeteria"
            value={formData.pantryCafeteria}
            onChange={onChange}
            className={`w-full px-4 py-2.5 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>
      </div>
    </motion.div>
  );
}

