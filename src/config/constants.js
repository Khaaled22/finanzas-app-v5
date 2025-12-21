// src/config/constants.js

// URLs APIs gratuitas para tasas de cambio
export const EXCHANGE_API_URLS = {
  // Frankfurter API - EUR/USD (gratis, sin API key)
  frankfurter: 'https://api.frankfurter.app/latest?from=EUR&to=USD',
  
  // Exchange Rate API - EUR/CLP (gratis, 1500 req/mes)
  // Nota: Reemplazar 'YOUR_API_KEY' con tu key de https://www.exchangerate-api.com/
  exchangeRateApi: 'https://v6.exchangerate-api.com/v6/YOUR_API_KEY/latest/EUR',
  
  // CMF Chile API - UF (gratis, oficial)
  cmfChile: 'https://api.cmfchile.cl/api-sbifv3/recursos_api/uf/2024/01?apikey=YOUR_CMF_KEY&formato=json'
};

// Tasas por defecto (fallback)
export const DEFAULT_RATES = {
  EUR_CLP: 1050,
  EUR_USD: 1.09,
  CLP_UF: 36000
};

// Configuración app
export const APP_CONFIG = {
  version: '5.1',
  storageVersion: 'v5'
};