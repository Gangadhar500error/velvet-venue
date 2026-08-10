/**
 * Languages Data
 */

import { Language } from "../types/language";

export const mockLanguages: Language[] = [
  {
    id: 1,
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇺🇸",
    isRTL: false,
    isActive: true,
    isDefault: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: 2,
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    flag: "🇪🇸",
    isRTL: false,
    isActive: true,
    isDefault: false,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-05T00:00:00Z",
  },
  {
    id: 3,
    code: "fr",
    name: "French",
    nativeName: "Français",
    flag: "🇫🇷",
    isRTL: false,
    isActive: true,
    isDefault: false,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-10T00:00:00Z",
  },
  {
    id: 4,
    code: "de",
    name: "German",
    nativeName: "Deutsch",
    flag: "🇩🇪",
    isRTL: false,
    isActive: true,
    isDefault: false,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z",
  },
  {
    id: 5,
    code: "it",
    name: "Italian",
    nativeName: "Italiano",
    flag: "🇮🇹",
    isRTL: false,
    isActive: true,
    isDefault: false,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-20T00:00:00Z",
  },
  {
    id: 6,
    code: "pt",
    name: "Portuguese",
    nativeName: "Português",
    flag: "🇵🇹",
    isRTL: false,
    isActive: true,
    isDefault: false,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-02-01T00:00:00Z",
  },
  {
    id: 7,
    code: "ar",
    name: "Arabic",
    nativeName: "العربية",
    flag: "🇸🇦",
    isRTL: true,
    isActive: true,
    isDefault: false,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-02-05T00:00:00Z",
  },
  {
    id: 8,
    code: "zh",
    name: "Chinese",
    nativeName: "中文",
    flag: "🇨🇳",
    isRTL: false,
    isActive: true,
    isDefault: false,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-02-10T00:00:00Z",
  },
  {
    id: 9,
    code: "ja",
    name: "Japanese",
    nativeName: "日本語",
    flag: "🇯🇵",
    isRTL: false,
    isActive: true,
    isDefault: false,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-02-15T00:00:00Z",
  },
  {
    id: 10,
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    flag: "🇮🇳",
    isRTL: false,
    isActive: true,
    isDefault: false,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-02-20T00:00:00Z",
  },
  {
    id: 11,
    code: "ru",
    name: "Russian",
    nativeName: "Русский",
    flag: "🇷🇺",
    isRTL: false,
    isActive: false,
    isDefault: false,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-03-01T00:00:00Z",
  },
];

export const filterLanguages = (
  languages: Language[],
  searchTerm: string,
  filters?: {
    isActive?: string;
    isDefault?: string;
    isRTL?: string;
  }
): Language[] => {
  let filtered = languages;
  
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(
      (language) =>
        language.code.toLowerCase().includes(term) ||
        language.name.toLowerCase().includes(term) ||
        language.nativeName.toLowerCase().includes(term)
    );
  }
  
  if (filters) {
    if (filters.isActive === "active") {
      filtered = filtered.filter((language) => language.isActive === true);
    } else if (filters.isActive === "inactive") {
      filtered = filtered.filter((language) => language.isActive === false);
    }
    
    if (filters.isDefault === "default") {
      filtered = filtered.filter((language) => language.isDefault === true);
    } else if (filters.isDefault === "non-default") {
      filtered = filtered.filter((language) => language.isDefault === false);
    }
    
    if (filters.isRTL === "rtl") {
      filtered = filtered.filter((language) => language.isRTL === true);
    } else if (filters.isRTL === "ltr") {
      filtered = filtered.filter((language) => language.isRTL === false);
    }
  }
  
  return filtered;
};

