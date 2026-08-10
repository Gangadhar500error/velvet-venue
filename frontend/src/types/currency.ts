/**
 * Currency Type Definition
 */

export interface Currency {
  id: number;
  code: string; // ISO 4217 code (e.g., USD, EUR, GBP)
  name: string; // Full name (e.g., US Dollar, Euro)
  symbol: string; // Currency symbol (e.g., $, €, £)
  symbolPosition: "before" | "after"; // Position of symbol relative to amount
  decimalPlaces: number; // Number of decimal places (usually 2)
  exchangeRate: number; // Exchange rate relative to base currency
  isBase: boolean; // Is this the base currency?
  isActive: boolean; // Is this currency active?
  createdAt: string;
  updatedAt: string;
}

