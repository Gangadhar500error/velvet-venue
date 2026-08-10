"use client";

import { PropertyFormData } from "@/types/property";

interface CoworkingFieldsProps {
  formData: PropertyFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  errors?: { [key: string]: string };
  isDarkMode: boolean;
}

export default function CoworkingFields({ formData, onChange, errors = {}, isDarkMode }: CoworkingFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Total Seats <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="totalSeats"
            value={formData.totalSeats}
            onChange={onChange}
            required
            className={`w-full px-4 py-2.5 rounded-lg border ${
              errors.totalSeats
                ? isDarkMode
                  ? "bg-gray-800 border-red-500 text-white"
                  : "bg-white border-red-500 text-gray-900"
                : isDarkMode
                ? "bg-gray-800 border-gray-700 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
          />
          {errors.totalSeats && <p className="mt-1 text-sm text-red-500">{errors.totalSeats}</p>}
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Hot Desks Count
          </label>
          <input
            type="number"
            name="hotDesksCount"
            value={formData.hotDesksCount}
            onChange={onChange}
            className={`w-full px-4 py-2.5 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
          />
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Dedicated Desks Count
          </label>
          <input
            type="number"
            name="dedicatedDesksCount"
            value={formData.dedicatedDesksCount}
            onChange={onChange}
            className={`w-full px-4 py-2.5 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
          />
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Minimum Booking Duration
          </label>
          <select
            name="minimumBookingDuration"
            value={formData.minimumBookingDuration}
            onChange={onChange}
            className={`w-full px-4 py-2.5 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
          >
            <option value="">Select duration</option>
            <option value="1 day">1 Day</option>
            <option value="1 week">1 Week</option>
            <option value="1 month">1 Month</option>
          </select>
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Daily Price <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="dailyPrice"
            value={formData.dailyPrice}
            onChange={onChange}
            required
            className={`w-full px-4 py-2.5 rounded-lg border ${
              errors.dailyPrice
                ? isDarkMode
                  ? "bg-gray-800 border-red-500 text-white"
                  : "bg-white border-red-500 text-gray-900"
                : isDarkMode
                ? "bg-gray-800 border-gray-700 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
          />
          {errors.dailyPrice && <p className="mt-1 text-sm text-red-500">{errors.dailyPrice}</p>}
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Weekly Price
          </label>
          <input
            type="number"
            name="weeklyPrice"
            value={formData.weeklyPrice}
            onChange={onChange}
            className={`w-full px-4 py-2.5 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
          />
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Monthly Price <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="monthlyPrice"
            value={formData.monthlyPrice}
            onChange={onChange}
            required
            className={`w-full px-4 py-2.5 rounded-lg border ${
              errors.monthlyPrice
                ? isDarkMode
                  ? "bg-gray-800 border-red-500 text-white"
                  : "bg-white border-red-500 text-gray-900"
                : isDarkMode
                ? "bg-gray-800 border-gray-700 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
          />
          {errors.monthlyPrice && <p className="mt-1 text-sm text-red-500">{errors.monthlyPrice}</p>}
        </div>
      </div>
    </div>
  );
}

