"use client";

import { motion } from "framer-motion";
import { ImageIcon, Upload, X, Video } from "lucide-react";
import Image from "next/image";
import { PropertyFormData } from "@/types/property";

interface MediaSectionProps {
  formData: PropertyFormData;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>, type: "coverImage" | "galleryImages" | "floorPlan") => void;
  onRemoveGalleryImage: (index: number) => void;
  onRemoveCoverImage: () => void;
  onRemoveFloorPlan: () => void;
  onVideoLinkChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  coverImagePreview: string | null;
  galleryPreviews: string[];
  floorPlanPreview: string | null;
  isDarkMode: boolean;
}

export default function MediaSection({
  formData,
  onFileChange,
  onRemoveGalleryImage,
  onRemoveCoverImage,
  onRemoveFloorPlan,
  onVideoLinkChange,
  coverImagePreview,
  galleryPreviews,
  floorPlanPreview,
  isDarkMode,
}: MediaSectionProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <h2 className={`text-lg font-semibold pb-2 border-b flex items-center gap-2 ${isDarkMode ? "border-gray-800 text-white" : "border-gray-200 text-gray-900"}`}>
        <ImageIcon className="w-5 h-5 text-[#C89B3C]" />
        Media Uploads
      </h2>
      <div className="space-y-4">
        {/* Cover Image */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Cover Image
          </label>
          {coverImagePreview ? (
            <div className="relative w-full max-w-md">
              <div className="aspect-video rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-700">
                <Image src={coverImagePreview} alt="Cover" width={600} height={400} className="w-full h-full object-cover" unoptimized />
              </div>
              <button
                type="button"
                onClick={onRemoveCoverImage}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <label className="flex w-full max-w-md aspect-video rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 flex-col items-center justify-center cursor-pointer hover:border-[#C89B3C] transition-colors">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Upload Cover Image</span>
              <input type="file" accept="image/*" onChange={(e) => onFileChange(e, "coverImage")} className="hidden" />
            </label>
          )}
        </div>

        {/* Gallery Images */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Gallery Images (Multiple Upload)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {galleryPreviews.map((preview, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-700">
                  <Image src={preview} alt={`Gallery ${index + 1}`} width={200} height={200} className="w-full h-full object-cover" unoptimized />
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveGalleryImage(index)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {galleryPreviews.length < 20 && (
              <label className="flex aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 flex-col items-center justify-center cursor-pointer hover:border-[#C89B3C] transition-colors">
                <Upload className="w-6 h-6 text-gray-400 mb-1" />
                <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Add Image</span>
                <input type="file" accept="image/*" multiple onChange={(e) => onFileChange(e, "galleryImages")} className="hidden" />
              </label>
            )}
          </div>
        </div>

        {/* Floor Plan */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Floor Plan (Optional)
          </label>
          {floorPlanPreview ? (
            <div className="relative w-full max-w-md">
              <div className="aspect-video rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-700">
                <Image src={floorPlanPreview} alt="Floor Plan" width={600} height={400} className="w-full h-full object-cover" unoptimized />
              </div>
              <button
                type="button"
                onClick={onRemoveFloorPlan}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <label className="flex w-full max-w-md aspect-video rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 flex-col items-center justify-center cursor-pointer hover:border-[#C89B3C] transition-colors">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Upload Floor Plan</span>
              <input type="file" accept="image/*" onChange={(e) => onFileChange(e, "floorPlan")} className="hidden" />
            </label>
          )}
        </div>

        {/* Video Link */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Video Link (Optional)
          </label>
          <div className="flex items-center gap-2">
            <Video className={`w-5 h-5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} />
            <input
              type="url"
              name="videoLink"
              value={formData.videoLink}
              onChange={onVideoLinkChange}
              placeholder="https://example.com/video"
              className={`flex-1 px-4 py-2.5 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

