// Datos iniciales de ejemplo para la aplicación

export const INITIAL_CATEGORIES = [
  { id: 'v1', name: 'Alquiler/Hipoteca', group: '🏠 Vivienda', budget: 1200, spent: 1200, currency: 'EUR' },
  { id: 'v2', name: 'Electricidad', group: '🏠 Vivienda', budget: 80, spent: 65, currency: 'EUR' },
  { id: 'v3', name: 'Agua', group: '🏠 Vivienda', budget: 40, spent: 38, currency: 'EUR' },
  { id: 'a1', name: 'Supermercado', group: '🍔 Alimentación', budget: 400, spent: 380, currency: 'EUR' },
  { id: 'a2', name: 'Restaurantes', group: '🍔 Alimentación', budget: 150, spent: 145, currency: 'EUR' },
  { id: 't1', name: 'Combustible', group: '🚗 Transporte', budget: 150, spent: 125, currency: 'EUR' },
  { id: 's1', name: 'Seguro médico', group: '💊 Salud', budget: 120, spent: 120, currency: 'EUR' },
  { id: 'e1', name: 'Streaming', group: '🎭 Entretenimiento', budget: 40, spent: 38, currency: 'EUR' },
];

/**
 * Genera transacciones históricas de ejemplo
 */
export function generateHistoricalTransactions() {
  const transactions = [];
  const categories = INITIAL_CATEGORIES;
  const now = new Date();
  
  for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
    const date = new Date(now.getFullYear(), now.getMonth() - monthOffset, 15);
    
    categories.forEach(cat => {
      const numTransactions = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < numTransactions; i++) {
        const amount = (cat.spent / numTransactions) * (0.8 + Math.random() * 0.4);
        transactions.push({
          id: Date.now() + Math.random() * 1000000,
          date: new Date(date.getTime() + Math.random() * 24 * 60 * 60 * 1000).toISOString(),
          description: `Gasto en ${cat.name}`,
          comment: '',
          amount: amount,
          currency: cat.currency,
          categoryId: cat.id,
          paymentMethod: ['Tarjeta', 'Efectivo', 'Transferencia'][Math.floor(Math.random() * 3)],
          user: ['Usuario 1', 'Usuario 2'][Math.floor(Math.random() * 2)]
        });
      }
    });
  }
  
  return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
}

export const INITIAL_TRANSACTIONS = generateHistoricalTransactions();

export const INITIAL_DEBTS = [
  {
    id: 'd1',
    name: 'Hipoteca Casa',
    type: 'Hipoteca',
    originalAmount: 250000,
    currentBalance: 185000,
    interestRate: 3.5,
    monthlyPayment: 1200,
    currency: 'EUR',
    startDate: '2020-01-01',
    paymentsMade: 48,
    paymentHistory: []
  },
  {
    id: 'd2',
    name: 'Tarjeta de Crédito',
    type: 'Tarjeta de Crédito',
    originalAmount: 5000,
    currentBalance: 3200,
    interestRate: 18.5,
    monthlyPayment: 250,
    currency: 'EUR',
    startDate: '2023-06-01',
    paymentsMade: 17,
    paymentHistory: []
  },
];

export const INITIAL_SAVINGS_GOALS = [
  {
    id: 'sg1',
    name: 'Fondo de Emergencia',
    description: '6 meses de gastos',
    targetAmount: 15000,
    currentAmount: 8500,
    currency: 'EUR',
    deadline: '2025-12-31',
    priority: 'Alta',
    contributionHistory: []
  },
  {
    id: 'sg2',
    name: 'Vacaciones 2025',
    description: 'Viaje a Japón',
    targetAmount: 5000,
    currentAmount: 2300,
    currency: 'EUR',
    deadline: '2025-08-01',
    priority: 'Media',
    contributionHistory: []
  },
];

export const INITIAL_INVESTMENTS = [
  {
    id: 'inv1',
    type: 'Stock',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    quantity: 10,
    purchasePrice: 150.50,
    currentPrice: 175.30,
    currency: 'USD',
    lastUpdated: new Date().toISOString(),
    purchaseHistory: [{
      id: Date.now() - 10000000,
      date: '2024-01-15T10:00:00.000Z',
      type: 'buy',
      quantity: 10,
      price: 150.50,
      total: 1505,
      user: 'Usuario 1'
    }]
  },
  {
    id: 'inv2',
    type: 'Crypto',
    symbol: 'BTC',
    name: 'Bitcoin',
    quantity: 0.15,
    purchasePrice: 35000,
    currentPrice: 43000,
    currency: 'USD',
    lastUpdated: new Date().toISOString(),
    purchaseHistory: [{
      id: Date.now() - 20000000,
      date: '2024-02-20T14:00:00.000Z',
      type: 'buy',
      quantity: 0.15,
      price: 35000,
      total: 5250,
      user: 'Usuario 1'
    }]
  },
];

export const INITIAL_YNAB_CONFIG = {
  monthlyIncome: 3500
};
