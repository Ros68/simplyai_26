import { API_BASE_URL } from '@/config/api';

export interface PaymentSettings {
  enable_payments: boolean;
  currency: string;
  vat_percentage: number;
  stripe_public_key: string;
}

export const fetchPaymentSettings = async (): Promise<PaymentSettings | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/payment-settings`);
    if (!response.ok) {
      throw new Error('Failed to fetch payment settings');
    }
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching payment settings:', error);
    return null;
  }
};

// Currency display utilities
export const getCurrencySymbol = (currency: string): string => {
  switch (currency.toUpperCase()) {
    case 'EUR': return '€';
    case 'USD': return '$';
    case 'GBP': return '£';
    case 'CHF': return 'CHF ';
    case 'CAD': return 'CA$';
    default: return currency + ' ';
  }
};

/**
 * FIX 6.2.3 — formatCurrency now accepts amounts in EUROS (not cents).
 * Previously callers were multiplying by 100 before passing in, which combined
 * with the /100 inside this function caused a 100× display error (e.g. €50
 * instead of €0.50, or vice-versa depending on DB storage format).
 *
 * Rule: plan prices in DB are stored in EUROS (e.g. 1.00, 9.99).
 * Pass the euro amount directly — no pre-multiplication needed.
 *
 * Decimal separator uses comma as per Italian locale (e.g. "€1,00").
 */
export const formatCurrency = (amountEuros: number, currency: string): string => {
  const symbol = getCurrencySymbol(currency);
  // Format with Italian locale so decimals use comma: 1,00
  const value = amountEuros.toLocaleString('it-IT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (currency.toUpperCase() === 'CHF') {
    return `${value} ${currency}`;
  }

  return `${symbol}${value}`;
};

/**
 * Convert a euro amount to the unit Stripe expects.
 * For standard currencies: multiply by 100 to get cents.
 * For zero-decimal currencies: pass as-is.
 */
const ZERO_DECIMAL_CURRENCIES = new Set([
  'BIF','CLP','DJF','GNF','JPY','KMF','KRW','MGA',
  'PYG','RWF','UGX','VND','VUV','XAF','XOF','XPF',
]);

export const toStripeAmount = (amountEuros: number, currency: string): number => {
  if (ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase())) {
    return Math.round(amountEuros);
  }
  return Math.round(amountEuros * 100);
};

export const getCurrencyForStripe = (currency: string): string => {
  return currency.toLowerCase();
};