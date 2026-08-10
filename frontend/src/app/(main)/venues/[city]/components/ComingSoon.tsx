"use client";

import { Clock } from "lucide-react";

interface ComingSoonProps {
  workspaceType: string;
  cityName: string;
}

export default function ComingSoon({ workspaceType, cityName }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-6">
        <Clock className="w-12 h-12 text-orange-500" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-3 font-display">
        Coming Soon
      </h3>
      <p className="text-gray-600 text-center max-w-md font-body text-lg mb-2">
        {workspaceType} listings for <span className="font-semibold text-orange-500">{cityName}</span> are coming soon!
      </p>
      <p className="text-sm text-gray-500 text-center max-w-md font-body">
        We're working hard to bring you the best {workspaceType.toLowerCase()} options in this area. Check back soon!
      </p>
    </div>
  );
}
