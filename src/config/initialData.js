// src/config/initialData.js
// ✅ M35: Categorías vacías (se importan desde CSV), resto mantiene estructura

// Categorías vacías - se importan desde Settings → Categorías
export const INITIAL_CATEGORIES = [];

// Transacciones vacías - se importan desde Transacciones → Importar
export const INITIAL_TRANSACTIONS = [];

export const INITIAL_DEBTS = [];

export const INITIAL_SAVINGS_GOALS = [];

// ✅ Mantener plataformas de inversión reales
export const INITIAL_INVESTMENTS = [
  {
    id: 'inv_fintual',
    platform: 'Fintual',
    type: 'Mutual Fund',
    name: 'Portafolio Fintual',
    currentBalance: 0,
    currency: 'CLP',
    lastUpdated: new Date().toISOString(),
    notes: 'Fondos mutuos diversificados',
    icon: '📈'
  },
  {
    id: 'inv_racional',
    platform: 'Racional',
    type: 'Mutual Fund',
    name: 'Portafolio Racional',
    currentBalance: 0,
    currency: 'CLP',
    lastUpdated: new Date().toISOString(),
    notes: 'Fondos de inversión',
    icon: '📊'
  },
  {
    id: 'inv_tenpo',
    platform: 'Tenpo',
    type: 'Digital Account',
    name: 'Débito Tenpo',
    currentBalance: 0,
    currency: 'CLP',
    lastUpdated: new Date().toISOString(),
    notes: 'Cuenta digital con rendimiento',
    icon: '💳'
  },
  {
    id: 'inv_binance',
    platform: 'Binance',
    type: 'Crypto',
    name: 'Binance Portfolio',
    currentBalance: 0,
    currency: 'USD',
    lastUpdated: new Date().toISOString(),
    notes: 'Criptomonedas diversificadas',
    icon: '₿'
  },
  {
    id: 'inv_zesty',
    platform: 'Zesty',
    type: 'Lending',
    name: 'Zesty Lending',
    currentBalance: 0,
    currency: 'CLP',
    lastUpdated: new Date().toISOString(),
    notes: 'Préstamos P2P',
    icon: '🦊'
  },
  {
    id: 'inv_trade_republic',
    platform: 'Trade Republic',
    type: 'ETF',
    name: 'ETF Portfolio',
    currentBalance: 0,
    currency: 'EUR',
    lastUpdated: new Date().toISOString(),
    notes: 'ETFs diversificados',
    icon: '🇪🇺'
  }
];

export const INITIAL_YNAB_CONFIG = {
  monthlyIncome: 0
};

export const INITIAL_MONTHLY_BUDGETS = {};