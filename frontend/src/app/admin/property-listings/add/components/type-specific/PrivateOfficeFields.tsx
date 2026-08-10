"use client";

import { PropertyFormData } from "@/types/property";

interface PrivateOfficeFieldsProps {
  formData: PropertyFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onOfficeSizeChange: (size: string, checked: boolean) => void;
  errors?: { [key: string]: string };
  isDarkMode: boolean;
}

const OFFICE_SIZES = ["2 seats", "4 seats", "6 seats", "10+ seats"] as const;

export default function PrivateOfficeFields({ formData, onChange, onOfficeSizeChange, errors = {}, isDarkMode }: PrivateOfficeFieldsProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
          Office Sizes Available
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {OFFICE_SIZES.map((size) => (
            <label
              key={size}
              className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer ${
                formData.officeSizes.includes(size)
                  ? isDarkMode
                    ? "bg-[#C89B3C]/10 border-[#C89B3C]"
                    : "bg-[#C89B3C]/5 border-[#C89B3C]"
                  : isDarkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-300"
              }`}
            >
              <input
                type="checkbox"
                checked={formData.officeSizes.includes(size)}
                onChange={(e) => onOfficeSizeChange(size, e.target.checked)}
                className="w-4 h-4"
              />
              <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>{size}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Number of Cabins
          </label>
          <input
            type="number"
            name="numberOfCabins"
            value={formData.numberOfCabins}
            onChange={onChange}
            className={`w-full px-4 py-2.5 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
          />
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Monthly Rent <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="privateOfficeMonthlyRent"
            value={formData.privateOfficeMonthlyRent}
            onChange={onChange}
            required
            className={`w-full px-4 py-2.5 rounded-lg border ${
              errors.privateOfficeMonthlyRent
                ? isDarkMode
                  ? "bg-gray-800 border-red-500 text-white"
                  : "bg-white border-red-500 text-gray-900"
                : isDarkMode
                ? "bg-gray-800 border-gray-700 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
          />
          {errors.privateOfficeMonthlyRent && <p className="mt-1 text-sm text-red-500">{errors.privateOfficeMonthlyRent}</p>}
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Security Deposit
          </label>
          <input
            type="number"
            name="securityDeposit"
            value={formData.securityDeposit}
            onChange={onChange}
            className={`w-full px-4 py-2.5 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
          />
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Furnished
          </label>
          <select
            name="furnished"
            value={formData.furnished}
            onChange={onChange}
            className={`w-full px-4 py-2.5 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Private Access
          </label>
          <select
            name="privateAccess"
            value={formData.privateAccess}
            onChange={onChange}
            className={`w-full px-4 py-2.5 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>
      </div>
    </div>
  );
}

