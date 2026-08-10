/**
 * Helper function to get input className with error state
 */
export const getInputClassName = (
  hasError: boolean,
  isDarkMode: boolean,
  baseClassName?: string
): string => {
  const base = baseClassName || "w-full px-4 py-2.5 rounded-lg border";
  const errorStyle = hasError
    ? isDarkMode
      ? "bg-gray-800 border-red-500 text-white"
      : "bg-white border-red-500 text-gray-900"
    : isDarkMode
    ? "bg-gray-800 border-gray-700 text-white"
    : "bg-white border-gray-300 text-gray-900";
  
  return `${base} ${errorStyle}`;
};

/**
 * Error message component
 */
export const ErrorMessage = ({ message }: { message?: string }) => {
  if (!message) return null;
  return <p className="mt-1 text-sm text-red-500">{message}</p>;
};

