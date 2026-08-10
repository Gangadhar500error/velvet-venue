"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { PropertyFormData } from "@/types/property";

interface LocationSectionProps {
  formData: PropertyFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  errors?: { [key: string]: string };
  isDarkMode: boolean;
}

export default function LocationSection({ formData, onChange, errors = {}, isDarkMode }: LocationSectionProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <h2 className={`text-lg font-semibold pb-2 border-b flex items-center gap-2 ${isDarkMode ? "border-gray-800 text-white" : "border-gray-200 text-gray-900"}`}>
        <MapPin className="w-5 h-5 text-[#C89B3C]" />
        Location Details
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Country <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="country"
            value={formData.country}
            onChange={onChange}
            required
            className={`w-full px-4 py-2.5 rounded-lg border ${
              errors.country
                ? isDarkMode
                  ? "bg-gray-800 border-red-500 text-white"
                  : "bg-white border-red-500 text-gray-900"
                : isDarkMode
                ? "bg-gray-800 border-gray-700 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
          />
          {errors.country && <p className="mt-1 text-sm text-red-500">{errors.country}</p>}
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            State <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={onChange}
            required
            className={`w-full px-4 py-2.5 rounded-lg border ${
              errors.state
                ? isDarkMode
                  ? "bg-gray-800 border-red-500 text-white"
                  : "bg-white border-red-500 text-gray-900"
                : isDarkMode
                ? "bg-gray-800 border-gray-700 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
          />
          {errors.state && <p className="mt-1 text-sm text-red-500">{errors.state}</p>}
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            City <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={onChange}
            required
            className={`w-full px-4 py-2.5 rounded-lg border ${
              errors.city
                ? isDarkMode
                  ? "bg-gray-800 border-red-500 text-white"
                  : "bg-white border-red-500 text-gray-900"
                : isDarkMode
                ? "bg-gray-800 border-gray-700 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
          />
          {errors.city && <p className="mt-1 text-sm text-red-500">{errors.city}</p>}
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Area / Locality <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="areaLocality"
            value={formData.areaLocality}
            onChange={onChange}
            required
            className={`w-full px-4 py-2.5 rounded-lg border ${
              errors.areaLocality
                ? isDarkMode
                  ? "bg-gray-800 border-red-500 text-white"
                  : "bg-white border-red-500 text-gray-900"
                : isDarkMode
                ? "bg-gray-800 border-gray-700 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
          />
          {errors.areaLocality && <p className="mt-1 text-sm text-red-500">{errors.areaLocality}</p>}
        </div>
        <div className="md:col-span-2">
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Full Address <span className="text-red-500">*</span>
          </label>
          <textarea
            name="fullAddress"
            value={formData.fullAddress}
            onChange={onChange}
            required
            rows={2}
            className={`w-full px-4 py-2.5 rounded-lg border ${
              errors.fullAddress
                ? isDarkMode
                  ? "bg-gray-800 border-red-500 text-white"
                  : "bg-white border-red-500 text-gray-900"
                : isDarkMode
                ? "bg-gray-800 border-gray-700 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
          />
          {errors.fullAddress && <p className="mt-1 text-sm text-red-500">{errors.fullAddress}</p>}
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Pincode
          </label>
          <input
            type="text"
            name="pincode"
            value={formData.pincode}
            onChange={onChange}
            className={`w-full px-4 py-2.5 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
          />
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Google Map Link
          </label>
          <input
            type="url"
            name="googleMapLink"
            value={formData.googleMapLink}
            onChange={onChange}
            className={`w-full px-4 py-2.5 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
          />
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Latitude
          </label>
          <input
            type="text"
            name="latitude"
            value={formData.latitude}
            onChange={onChange}
            className={`w-full px-4 py-2.5 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
          />
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Longitude
          </label>
          <input
            type="text"
            name="longitude"
            value={formData.longitude}
            onChange={onChange}
            className={`w-full px-4 py-2.5 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
          />
        </div>
      </div>
    </motion.div>
  );
}

