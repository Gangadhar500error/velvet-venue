"use client";

import { Monitor, FileText, Video } from "lucide-react";
import { PropertyFormData } from "@/types/property";

interface MeetingRoomFieldsProps {
  formData: PropertyFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onCheckboxChange: (field: string, checked: boolean) => void;
  errors?: { [key: string]: string };
  isDarkMode: boolean;
}

const ROOM_LAYOUTS = ["boardroom", "classroom", "u-shape"] as const;

export default function MeetingRoomFields({ formData, onChange, onCheckboxChange, errors = {}, isDarkMode }: MeetingRoomFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Room Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="roomName"
            value={formData.roomName}
            onChange={onChange}
            required
            className={`w-full px-4 py-2.5 rounded-lg border ${
              errors.roomName
                ? isDarkMode
                  ? "bg-gray-800 border-red-500 text-white"
                  : "bg-white border-red-500 text-gray-900"
                : isDarkMode
                ? "bg-gray-800 border-gray-700 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
          />
          {errors.roomName && <p className="mt-1 text-sm text-red-500">{errors.roomName}</p>}
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Seating Capacity <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="seatingCapacity"
            value={formData.seatingCapacity}
            onChange={onChange}
            required
            className={`w-full px-4 py-2.5 rounded-lg border ${
              errors.seatingCapacity
                ? isDarkMode
                  ? "bg-gray-800 border-red-500 text-white"
                  : "bg-white border-red-500 text-gray-900"
                : isDarkMode
                ? "bg-gray-800 border-gray-700 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
          />
          {errors.seatingCapacity && <p className="mt-1 text-sm text-red-500">{errors.seatingCapacity}</p>}
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Room Layout
          </label>
          <select
            name="roomLayout"
            value={formData.roomLayout}
            onChange={onChange}
            className={`w-full px-4 py-2.5 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
          >
            <option value="">Select layout</option>
            {ROOM_LAYOUTS.map((layout) => (
              <option key={layout} value={layout}>
                {layout.charAt(0).toUpperCase() + layout.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Hourly Price <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="hourlyPrice"
            value={formData.hourlyPrice}
            onChange={onChange}
            required
            className={`w-full px-4 py-2.5 rounded-lg border ${
              errors.hourlyPrice
                ? isDarkMode
                  ? "bg-gray-800 border-red-500 text-white"
                  : "bg-white border-red-500 text-gray-900"
                : isDarkMode
                ? "bg-gray-800 border-gray-700 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
          />
          {errors.hourlyPrice && <p className="mt-1 text-sm text-red-500">{errors.hourlyPrice}</p>}
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Half-Day Price
          </label>
          <input
            type="number"
            name="halfDayPrice"
            value={formData.halfDayPrice}
            onChange={onChange}
            className={`w-full px-4 py-2.5 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
          />
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Full-Day Price
          </label>
          <input
            type="number"
            name="fullDayPrice"
            value={formData.fullDayPrice}
            onChange={onChange}
            className={`w-full px-4 py-2.5 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label
          className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer ${
            formData.projectorTv === "yes"
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
            checked={formData.projectorTv === "yes"}
            onChange={(e) => onCheckboxChange("projectorTv", e.target.checked)}
            className="w-4 h-4"
          />
          <Monitor className={`w-4 h-4 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} />
          <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Projector / TV</span>
        </label>
        <label
          className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer ${
            formData.whiteboard === "yes"
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
            checked={formData.whiteboard === "yes"}
            onChange={(e) => onCheckboxChange("whiteboard", e.target.checked)}
            className="w-4 h-4"
          />
          <FileText className={`w-4 h-4 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} />
          <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Whiteboard</span>
        </label>
        <label
          className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer ${
            formData.videoConferencing === "yes"
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
            checked={formData.videoConferencing === "yes"}
            onChange={(e) => onCheckboxChange("videoConferencing", e.target.checked)}
            className="w-4 h-4"
          />
          <Video className={`w-4 h-4 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} />
          <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Video Conferencing</span>
        </label>
      </div>
    </div>
  );
}

