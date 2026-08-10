/**
 * Language Type Definition
 */

export interface Language {
  id: number;
  code: string; // ISO 639-1 code (e.g., en, es, fr)
  name: string; // Full name (e.g., English, Spanish, French)
  nativeName: string; // Native name (e.g., English, Español, Français)
  flag?: string; // Flag emoji or icon URL
  isRTL: boolean; // Is right-to-left language?
  isActive: boolean; // Is this language active?
  isDefault: boolean; // Is this the default language?
  createdAt: string;
  updatedAt: string;
}

