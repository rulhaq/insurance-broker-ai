import { writable } from 'svelte/store';
import { db } from '$lib/config/firebase';
import { doc, getDoc } from 'firebase/firestore';

export interface CurrencySettings {
  defaultCurrency: string;
  currencySymbol: string;
  currencyPosition: 'before' | 'after';
  decimalPlaces: number;
  thousandSeparator: string;
  decimalSeparator: string;
  supportedCurrencies: Array<{
    code: string;
    name: string;
    symbol: string;
  }>;
}

// Default currency settings
const defaultCurrencySettings: CurrencySettings = {
  defaultCurrency: 'USD',
  currencySymbol: '$',
  currencyPosition: 'before',
  decimalPlaces: 2,
  thousandSeparator: ',',
  decimalSeparator: '.',
  supportedCurrencies: [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
    { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
    { code: 'QAR', name: 'Qatari Riyal', symbol: '﷼' },
    { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك' },
    { code: 'BHD', name: 'Bahraini Dinar', symbol: '.د.ب' },
    { code: 'OMR', name: 'Omani Rial', symbol: '﷼' },
    { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨' }
  ]
};

// Global currency settings store
export const currencySettings = writable<CurrencySettings>(defaultCurrencySettings);

// Load currency settings from Firebase
export async function loadCurrencySettings(): Promise<CurrencySettings> {
  try {
    const docRef = doc(db, 'system_settings', 'currency');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data() as CurrencySettings;
      const settings = { ...defaultCurrencySettings, ...data };
      currencySettings.set(settings);
      return settings;
    }
    
    currencySettings.set(defaultCurrencySettings);
    return defaultCurrencySettings;
  } catch (error) {
    console.error('Error loading currency settings:', error);
    currencySettings.set(defaultCurrencySettings);
    return defaultCurrencySettings;
  }
}

// Format currency based on current settings
export function formatCurrency(amount: number, settings?: CurrencySettings): string {
  // Use provided settings or get from store
  let currentSettings = settings;
  if (!currentSettings) {
    currencySettings.subscribe(s => currentSettings = s)();
  }

  if (!currentSettings) {
    currentSettings = defaultCurrencySettings;
  }

  // Format the number
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: currentSettings.decimalPlaces,
    maximumFractionDigits: currentSettings.decimalPlaces
  })
  .replace(',', currentSettings.thousandSeparator)
  .replace('.', currentSettings.decimalSeparator);

  // Add currency symbol
  if (currentSettings.currencyPosition === 'before') {
    return `${currentSettings.currencySymbol}${formatted}`;
  } else {
    return `${formatted} ${currentSettings.currencySymbol}`;
  }
}

// Get current currency settings synchronously
export function getCurrentCurrencySettings(): CurrencySettings {
  let settings = defaultCurrencySettings;
  currencySettings.subscribe(s => settings = s)();
  return settings;
}

// Initialize currency settings on app load
let initialized = false;
export function initializeCurrency() {
  if (!initialized) {
    loadCurrencySettings();
    initialized = true;
  }
} 