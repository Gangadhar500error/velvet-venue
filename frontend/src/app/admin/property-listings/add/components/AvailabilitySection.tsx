"use client";

import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { PropertyFormData } from "@/types/property";

interface AvailabilitySectionProps {
  formData: PropertyFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onWorkingDayChange: (day: string, checked: boolean) => void;
  isDarkMode: boolean;
}

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

const lineInput = (isDarkMode: boolean) =>
  `w-full bg-transparent border-0 border-b px-0 py-2.5 text-sm outline-none transition-colors focus:ring-0 ${
    isDarkMode
      ? "border-gray-700 text-white focus:border-[#C89B3C] placeholder:text-gray-500"
      : "border-gray-300 text-gray-900 focus:border-[#C89B3C] placeholder:text-gray-400"
  }`;

const lineSelect = (isDarkMode: boolean) =>
  `w-full bg-transparent border-0 border-b px-0 py-2.5 text-sm outline-none transition-colors focus:ring-0 appearance-none cursor-pointer ${
    isDarkMode
      ? "border-gray-700 text-white focus:border-[#C89B3C]"
      : "border-gray-300 text-gray-900 focus:border-[#C89B3C]"
  }`;

export default function AvailabilitySection({ formData, onChange, onWorkingDayChange, isDarkMode }: AvailabilitySectionProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <h2 className={`text-lg font-semibold pb-2 border-b flex items-center gap-2 ${isDarkMode ? "border-gray-800 text-white" : "border-gray-200 text-gray-900"}`}>
        <Clock className="w-5 h-5 text-[#C89B3C]" />
        Availability & Timings
      </h2>

      {/* Opening / Closing — simple line inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
        <div className="space-y-1.5">
          <label className={`block text-xs font-medium tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            Opening Time
          </label>
          <input
            type="time"
            name="openingTime"
            value={formData.openingTime}
            onChange={onChange}
            className={lineInput(isDarkMode)}
          />
        </div>
        <div className="space-y-1.5">
          <label className={`block text-xs font-medium tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            Closing Time
          </label>
          <input
            type="time"
            name="closingTime"
            value={formData.closingTime}
            onChange={onChange}
            className={lineInput(isDarkMode)}
          />
        </div>
      </div>

      {/* Working Days — light text toggles */}
      <div className="space-y-3">
        <label className={`block text-xs font-medium tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
          Working Days
        </label>
        <div className="flex flex-wrap gap-x-1 gap-y-2">
          {DAYS_OF_WEEK.map((day) => {
            const dayKey = day.toLowerCase() as keyof typeof formData.workingDays;
            const active = formData.workingDays[dayKey];
            return (
              <button
                key={day}
                type="button"
                onClick={() => onWorkingDayChange(dayKey, !active)}
                className={`px-3 py-1.5 text-sm transition-colors border-b-2 ${
                  active
                    ? "border-[#C89B3C] text-[#C89B3C] font-medium"
                    : isDarkMode
                    ? "border-transparent text-gray-500 hover:text-gray-300"
                    : "border-transparent text-gray-400 hover:text-gray-700"
                }`}
              >
                {day.slice(0, 3)}
              </button>
            );
          })}
        </div>
      </div>

      {/* 24×7 — simple line select */}
      <div className="max-w-xs space-y-1.5">
        <label className={`block text-xs font-medium tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
          24×7 Available
        </label>
        <select
          name="available24x7"
          value={formData.available24x7}
          onChange={onChange}
          className={lineSelect(isDarkMode)}
        >
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </select>
      </div>
    </motion.div>
  );
}
