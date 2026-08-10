"use client";

import { PropertyFormData } from "@/types/property";

interface VirtualOfficeFieldsProps {
  formData: PropertyFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCheckboxChange: (field: string, checked: boolean) => void;
  errors?: { [key: string]: string };
  isDarkMode: boolean;
}

export default function VirtualOfficeFields({ formData, onChange, onCheckboxChange, errors = {}, isDarkMode }: VirtualOfficeFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Business Address <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="businessAddress"
            value={formData.businessAddress}
            onChange={onChange}
            required
            className={`w-full px-4 py-2.5 rounded-lg border ${
              errors.businessAddress
                ? isDarkMode
                  ? "bg-gray-800 border-red-500 text-white"
                  : "bg-white border-red-500 text-gray-900"
                : isDarkMode
                ? "bg-gray-800 border-gray-700 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
          />
          {errors.businessAddress && <p className="mt-1 text-sm text-red-500">{errors.businessAddress}</p>}
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            City <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="virtualOfficeCity"
            value={formData.virtualOfficeCity}
            onChange={onChange}
            required
            className={`w-full px-4 py-2.5 rounded-lg border ${
              errors.virtualOfficeCity
                ? isDarkMode
                  ? "bg-gray-800 border-red-500 text-white"
                  : "bg-white border-red-500 text-gray-900"
                : isDarkMode
                ? "bg-gray-800 border-gray-700 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
          />
          {errors.virtualOfficeCity && <p className="mt-1 text-sm text-red-500">{errors.virtualOfficeCity}</p>}
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Monthly Price <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="virtualOfficeMonthlyPrice"
            value={formData.virtualOfficeMonthlyPrice}
            onChange={onChange}
            required
            className={`w-full px-4 py-2.5 rounded-lg border ${
              errors.virtualOfficeMonthlyPrice
                ? isDarkMode
                  ? "bg-gray-800 border-red-500 text-white"
                  : "bg-white border-red-500 text-gray-900"
                : isDarkMode
                ? "bg-gray-800 border-gray-700 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
          />
          {errors.virtualOfficeMonthlyPrice && <p className="mt-1 text-sm text-red-500">{errors.virtualOfficeMonthlyPrice}</p>}
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Yearly Price
          </label>
          <input
            type="number"
            name="yearlyPrice"
            value={formData.yearlyPrice}
            onChange={onChange}
            className={`w-full px-4 py-2.5 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label
          className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer ${
            formData.addressProofProvided === "yes"
              ? isDarkMode
                ? "bg-blue-500/10 border-blue-500"
                : "bg-blue-50 border-blue-500"
              : isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-300"
          }`}
        >
          <input
            type="checkbox"
            checked={formData.addressProofProvided === "yes"}
            onChange={(e) => onCheckboxChange("addressProofProvided", e.target.checked)}
            className="w-4 h-4"
          />
          <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Address Proof Provided</span>
        </label>
        <label
          className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer ${
            formData.gstRegistrationSupport === "yes"
              ? isDarkMode
                ? "bg-blue-500/10 border-blue-500"
                : "bg-blue-50 border-blue-500"
              : isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-300"
          }`}
        >
          <input
            type="checkbox"
            checked={formData.gstRegistrationSupport === "yes"}
            onChange={(e) => onCheckboxChange("gstRegistrationSupport", e.target.checked)}
            className="w-4 h-4"
          />
          <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>GST Registration Support</span>
        </label>
        <label
          className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer ${
            formData.mailHandling === "yes"
              ? isDarkMode
                ? "bg-blue-500/10 border-blue-500"
                : "bg-blue-50 border-blue-500"
              : isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-300"
          }`}
        >
          <input
            type="checkbox"
            checked={formData.mailHandling === "yes"}
            onChange={(e) => onCheckboxChange("mailHandling", e.target.checked)}
            className="w-4 h-4"
          />
          <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Mail Handling</span>
        </label>
      </div>
    </div>
  );
}

