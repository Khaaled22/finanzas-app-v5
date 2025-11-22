// Utilidades para formateo de datos

/**
 * Formatea un número como moneda
 */
export function formatCurrency(amount, currency = 'EUR') {
  const symbols = {
    EUR: '€',
    CLP: '$',
    USD: '$',
    UF: 'UF'
  };
  
  return `${amount.toFixed(2)} ${symbols[currency] || currency}`;
}

/**
 * Formatea una fecha en formato local español
 */
export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Formatea una fecha en formato corto
 */
export function formatDateShort(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES');
}

/**
 * Formatea un porcentaje
 */
export function formatPercentage(value) {
  return `${value.toFixed(1)}%`;
}

/**
 * Convierte una cantidad de una moneda a otra
 */
export function convertCurrency(amount, fromCurrency, toCurrency, rates) {
  if (fromCurrency === toCurrency) return amount;
  const amountInEUR = amount / rates[fromCurrency];
  return amountInEUR * rates[toCurrency];
}
