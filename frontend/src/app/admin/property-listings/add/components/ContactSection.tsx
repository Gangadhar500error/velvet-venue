"use client";

import { motion } from "framer-motion";
import { Phone } from "lucide-react";
import { PropertyFormData } from "@/types/property";

interface ContactSectionProps {
  formData: PropertyFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  errors?: { [key: string]: string };
  isDarkMode: boolean;
}

export default function ContactSection({ formData, onChange, errors = {}, isDarkMode }: ContactSectionProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <h2 className={`text-lg font-semibold pb-2 border-b flex items-center gap-2 ${isDarkMode ? "border-gray-800 text-white" : "border-gray-200 text-gray-900"}`}>
        <Phone className="w-5 h-5 text-[#C89B3C]" />
        Contact Details
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Contact Person Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="contactPersonName"
            value={formData.contactPersonName}
            onChange={onChange}
            required
            className={`w-full px-4 py-2.5 rounded-lg border ${
              errors.contactPersonName
                ? isDarkMode
                  ? "bg-gray-800 border-red-500 text-white"
                  : "bg-white border-red-500 text-gray-900"
                : isDarkMode
                ? "bg-gray-800 border-gray-700 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
          />
          {errors.contactPersonName && <p className="mt-1 text-sm text-red-500">{errors.contactPersonName}</p>}
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={onChange}
            required
            className={`w-full px-4 py-2.5 rounded-lg border ${
              errors.phoneNumber
                ? isDarkMode
                  ? "bg-gray-800 border-red-500 text-white"
                  : "bg-white border-red-500 text-gray-900"
                : isDarkMode
                ? "bg-gray-800 border-gray-700 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
          />
          {errors.phoneNumber && <p className="mt-1 text-sm text-red-500">{errors.phoneNumber}</p>}
        </div>
        <div className="md:col-span-2">
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Email ID <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="emailId"
            value={formData.emailId}
            onChange={onChange}
            required
            className={`w-full px-4 py-2.5 rounded-lg border ${
              errors.emailId
                ? isDarkMode
                  ? "bg-gray-800 border-red-500 text-white"
                  : "bg-white border-red-500 text-gray-900"
                : isDarkMode
                ? "bg-gray-800 border-gray-700 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
          />
          {errors.emailId && <p className="mt-1 text-sm text-red-500">{errors.emailId}</p>}
        </div>
      </div>
    </motion.div>
  );
}

