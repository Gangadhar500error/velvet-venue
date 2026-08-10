/**
 * Translation Type Definition
 */

export interface Translation {
  id: number;
  key: string; // Translation key (e.g., "common.welcome", "errors.not_found")
  languageCode: string; // Language code (e.g., "en", "es", "fr")
  languageName: string; // Language name for display
  value: string; // Translated text
  group: string; // Translation group/category (e.g., "common", "errors", "navigation")
  description?: string; // Optional description of the translation
  isActive: boolean; // Is this translation active?
  createdAt: string;
  updatedAt: string;
}

