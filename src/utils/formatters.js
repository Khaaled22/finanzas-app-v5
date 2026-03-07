// src/utils/formatters.js
// ✅ M33: Agregadas funciones de formateo con separador de miles

/**
 * Formatea un número como moneda (EXISTENTE)
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
 * Formatea una fecha en formato local español (EXISTENTE)
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
 * Formatea una fecha en formato corto (EXISTENTE)
 */
export function formatDateShort(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES');
}

/**
 * Formatea un porcentaje (EXISTENTE)
 */
export function formatPercentage(value) {
  return `${value.toFixed(1)}%`;
}

/**
 * Convierte una cantidad de una moneda a otra (EXISTENTE)
 */
export function convertCurrency(amount, fromCurrency, toCurrency, rates) {
  if (fromCurrency === toCurrency) return amount;
  if (!amount || !rates) return 0;
  const fromRate = rates[fromCurrency];
  const toRate = rates[toCurrency];
  if (!fromRate || !toRate) return 0;
  const amountInEUR = amount / fromRate;
  return amountInEUR * toRate;
}

// =====================================================
// ✅ M33: NUEVAS FUNCIONES
// =====================================================

/**
 * Formatea un número con separador de miles (formato europeo: 1.234.567)
 * @param {number} value - Valor a formatear
 * @param {number} decimals - Número de decimales (default: 0)
 * @returns {string} - Valor formateado
 */
export function formatNumber(value, decimals = 0) {
  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) return '0';

  // normalize -0 to 0 (-0 + 0 === 0 in JS)
  const num = value + 0;
  return num.toLocaleString('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Formatea un porcentaje con signo opcional
 * @param {number} value - Valor del porcentaje
 * @param {number} decimals - Número de decimales
 * @param {boolean} showSign - Mostrar signo +/-
 * @returns {string} - Porcentaje formateado
 */
export function formatPercent(value, decimals = 1, showSign = false) {
  if (value === null || value === undefined || isNaN(value)) return '0%';
  
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Formatea un valor abreviado (k, M) con moneda
 * @param {number} value - Valor a formatear
 * @param {string} currency - Código de moneda
 * @returns {string} - Valor abreviado
 */
export function formatCompact(value, currency = 'EUR') {
  if (value === null || value === undefined || isNaN(value)) return '0';
  
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  
  let formatted;
  if (absValue >= 1000000) {
    formatted = `${sign}${(absValue / 1000000).toFixed(1)}M`;
  } else if (absValue >= 1000) {
    formatted = `${sign}${(absValue / 1000).toFixed(0)}k`;
  } else {
    formatted = `${sign}${absValue.toFixed(0)}`;
  }
  
  return `${formatted} ${currency}`;
}

/**
 * Calcula el ROI entre dos valores
 * @param {number} currentValue - Valor actual
 * @param {number} previousValue - Valor anterior
 * @returns {number} - ROI en porcentaje
 */
export function calculateROI(currentValue, previousValue) {
  if (!previousValue || previousValue === 0) return 0;
  return ((currentValue - previousValue) / previousValue) * 100;
}

/**
 * Obtiene clases de color según el valor (positivo/negativo/neutro)
 * @param {number} value - Valor a evaluar
 * @returns {object} - Clases de Tailwind para colores
 */
export function getValueColors(value) {
  if (value > 0) {
    return {
      text: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: '📈'
    };
  } else if (value < 0) {
    return {
      text: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: '📉'
    };
  }
  return {
    text: 'text-gray-600',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    icon: '➡️'
  };
}

/**
 * Formatea un número con moneda y separador de miles
 * @param {number} value - Valor a formatear
 * @param {string} currency - Código de moneda
 * @param {number} decimals - Número de decimales
 * @returns {string} - Valor formateado con moneda
 */
export function formatMoney(value, currency = 'EUR', decimals = 0) {
  const formatted = formatNumber(value, decimals);
  
  const symbols = {
    EUR: '€',
    USD: '$',
    CLP: '$',
    UF: 'UF'
  };
  
  const symbol = symbols[currency] || currency;
  
  // EUR: símbolo después, resto: símbolo antes
  if (currency === 'EUR') {
    return `${formatted} €`;
  } else if (currency === 'UF') {
    return `${formatted} UF`;
  } else {
    return `${symbol}${formatted}`;
  }
}