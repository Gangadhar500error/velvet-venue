/**
 * Currencies Data
 */

import { Currency } from "../types/currency";

export const mockCurrencies: Currency[] = [
  {
    id: 1,
    code: "USD",
    name: "US Dollar",
    symbol: "$",
    symbolPosition: "before",
    decimalPlaces: 2,
    exchangeRate: 1.0,
    isBase: true,
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: 2,
    code: "EUR",
    name: "Euro",
    symbol: "€",
    symbolPosition: "before",
    decimalPlaces: 2,
    exchangeRate: 0.92,
    isBase: false,
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z",
  },
  {
    id: 3,
    code: "GBP",
    name: "British Pound",
    symbol: "£",
    symbolPosition: "before",
    decimalPlaces: 2,
    exchangeRate: 0.79,
    isBase: false,
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-10T00:00:00Z",
  },
  {
    id: 4,
    code: "INR",
    name: "Indian Rupee",
    symbol: "₹",
    symbolPosition: "before",
    decimalPlaces: 2,
    exchangeRate: 83.12,
    isBase: false,
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-02-01T00:00:00Z",
  },
  {
    id: 5,
    code: "JPY",
    name: "Japanese Yen",
    symbol: "¥",
    symbolPosition: "before",
    decimalPlaces: 0,
    exchangeRate: 149.50,
    isBase: false,
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-05T00:00:00Z",
  },
  {
    id: 6,
    code: "AUD",
    name: "Australian Dollar",
    symbol: "A$",
    symbolPosition: "before",
    decimalPlaces: 2,
    exchangeRate: 1.52,
    isBase: false,
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-20T00:00:00Z",
  },
  {
    id: 7,
    code: "CAD",
    name: "Canadian Dollar",
    symbol: "C$",
    symbolPosition: "before",
    decimalPlaces: 2,
    exchangeRate: 1.35,
    isBase: false,
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-12T00:00:00Z",
  },
  {
    id: 8,
    code: "CHF",
    name: "Swiss Franc",
    symbol: "CHF",
    symbolPosition: "after",
    decimalPlaces: 2,
    exchangeRate: 0.88,
    isBase: false,
    isActive: false,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-03-01T00:00:00Z",
  },
];

export const filterCurrencies = (
  currencies: Currency[],
  searchTerm: string,
  filters?: {
    isActive?: string;
    isBase?: string;
  }
): Currency[] => {
  let filtered = currencies;
  
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(
      (currency) =>
        currency.code.toLowerCase().includes(term) ||
        currency.name.toLowerCase().includes(term) ||
        currency.symbol.toLowerCase().includes(term)
    );
  }
  
  if (filters) {
    if (filters.isActive === "active") {
      filtered = filtered.filter((currency) => currency.isActive === true);
    } else if (filters.isActive === "inactive") {
      filtered = filtered.filter((currency) => currency.isActive === false);
    }
    
    if (filters.isBase === "base") {
      filtered = filtered.filter((currency) => currency.isBase === true);
    } else if (filters.isBase === "non-base") {
      filtered = filtered.filter((currency) => currency.isBase === false);
    }
  }
  
  return filtered;
};

