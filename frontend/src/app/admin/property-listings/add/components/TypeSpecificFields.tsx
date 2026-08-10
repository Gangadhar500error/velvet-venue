"use client";

import { motion } from "framer-motion";
import { Briefcase } from "lucide-react";
import { PropertyFormData, WorkspaceType } from "@/types/property";
import CoworkingFields from "./type-specific/CoworkingFields";
import PrivateOfficeFields from "./type-specific/PrivateOfficeFields";
import MeetingRoomFields from "./type-specific/MeetingRoomFields";
import VirtualOfficeFields from "./type-specific/VirtualOfficeFields";

interface TypeSpecificFieldsProps {
  formData: PropertyFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onOfficeSizeChange: (size: string, checked: boolean) => void;
  onCheckboxChange: (field: string, checked: boolean) => void;
  errors?: { [key: string]: string };
  isDarkMode: boolean;
}

export default function TypeSpecificFields({
  formData,
  onChange,
  onOfficeSizeChange,
  onCheckboxChange,
  errors = {},
  isDarkMode,
}: TypeSpecificFieldsProps) {
  if (!formData.workspaceType) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className={`text-lg font-semibold pb-2 border-b flex items-center gap-2 ${isDarkMode ? "border-gray-800 text-white" : "border-gray-200 text-gray-900"}`}>
          <Briefcase className="w-5 h-5 text-[#C89B3C]" />
          Type-Specific Fields
        </h2>
        <div className={`p-8 text-center rounded-lg border mt-4 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Please select a workspace type first</p>
        </div>
      </motion.div>
    );
  }

  const renderFields = () => {
    switch (formData.workspaceType as WorkspaceType) {
      case "Coworking":
        return <CoworkingFields formData={formData} onChange={onChange} errors={errors} isDarkMode={isDarkMode} />;
      case "Private Office":
        return <PrivateOfficeFields formData={formData} onChange={onChange} onOfficeSizeChange={onOfficeSizeChange} errors={errors} isDarkMode={isDarkMode} />;
      case "Meeting Room":
        return <MeetingRoomFields formData={formData} onChange={onChange} onCheckboxChange={onCheckboxChange} errors={errors} isDarkMode={isDarkMode} />;
      case "Virtual Office":
        return <VirtualOfficeFields formData={formData} onChange={onChange} onCheckboxChange={onCheckboxChange} errors={errors} isDarkMode={isDarkMode} />;
      default:
        return null;
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <h2 className={`text-lg font-semibold pb-2 border-b flex items-center gap-2 ${isDarkMode ? "border-gray-800 text-white" : "border-gray-200 text-gray-900"}`}>
        <Briefcase className="w-5 h-5 text-[#C89B3C]" />
        Type-Specific Fields
      </h2>
      {renderFields()}
    </motion.div>
  );
}

