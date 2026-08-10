"use client";

interface LocationChipsProps {
  areas: string[];
  selectedArea: string | null;
  onAreaSelect: (area: string | null) => void;
}

export default function LocationChips({ areas, selectedArea, onAreaSelect }: LocationChipsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-2">
      <button
        type="button"
        onClick={() => onAreaSelect(null)}
        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
          selectedArea === null
            ? "bg-[#C89B3C] text-white shadow-md"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        All Areas
      </button>
      {areas.map((area) => (
        <button
          key={area}
          type="button"
          onClick={() => onAreaSelect(area)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
            selectedArea === area
              ? "bg-[#C89B3C] text-white shadow-md"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {area}
        </button>
      ))}
    </div>
  );
}
