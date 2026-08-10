"use client";

export default function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
          {/* Image Skeleton */}
          <div className="h-48 w-full bg-gray-200" />
          
          {/* Content Skeleton */}
          <div className="p-4">
            <div className="h-6 bg-gray-200 rounded mb-2" />
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
            
            {/* Amenities Skeleton */}
            <div className="flex gap-2 mb-4">
              <div className="h-6 bg-gray-200 rounded w-16" />
              <div className="h-6 bg-gray-200 rounded w-20" />
              <div className="h-6 bg-gray-200 rounded w-14" />
            </div>
            
            {/* Price and Button Skeleton */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <div className="h-8 bg-gray-200 rounded w-24" />
              <div className="h-10 bg-gray-200 rounded w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
