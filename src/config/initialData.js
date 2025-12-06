// Datos iniciales - M13 ✅ 78 Categorías Personalizadas

export const INITIAL_CATEGORIES = [
  // 💼 INCOME (3)
  { id: 'inc1', name: '💼 Khaled Salary', group: '💼 Income', budget: 0, spent: 0, currency: 'EUR', icon: '💼', type: 'income' },
  { id: 'inc2', name: '💼 Cristina Salary', group: '💼 Income', budget: 0, spent: 0, currency: 'EUR', icon: '💼', type: 'income' },
  { id: 'inc3', name: '💰 Other Income', group: '💼 Income', budget: 0, spent: 0, currency: 'EUR', icon: '💰', type: 'income' },

  // 💳 LOANS & DEBTS (5)
  { id: 'ld1', name: '🏦 Bank Loan Payment', group: '💳 Loans & Debts', budget: 0, spent: 0, currency: 'EUR', icon: '🏦', type: 'expense' },
  { id: 'ld2', name: '💳 Credit Card Payment', group: '💳 Loans & Debts', budget: 0, spent: 0, currency: 'EUR', icon: '💳', type: 'expense' },
  { id: 'ld3', name: '🏠 Mortgage Payment', group: '💳 Loans & Debts', budget: 0, spent: 0, currency: 'EUR', icon: '🏠', type: 'expense' },
  { id: 'ld4', name: '🚗 Car Loan Payment', group: '💳 Loans & Debts', budget: 0, spent: 0, currency: 'EUR', icon: '🚗', type: 'expense' },
  { id: 'ld5', name: '💸 Other Debt Payment', group: '💳 Loans & Debts', budget: 0, spent: 0, currency: 'EUR', icon: '💸', type: 'expense' },

  // 🏠 HOUSING & UTILITIES (8)
  { id: 'hu1', name: '🏠 Rent', group: '🏠 Housing & Utilities', budget: 800, spent: 0, currency: 'EUR', icon: '🏠', type: 'expense' },
  { id: 'hu2', name: '⚡ Electricity', group: '🏠 Housing & Utilities', budget: 60, spent: 0, currency: 'EUR', icon: '⚡', type: 'expense' },
  { id: 'hu3', name: '💧 Water', group: '🏠 Housing & Utilities', budget: 30, spent: 0, currency: 'EUR', icon: '💧', type: 'expense' },
  { id: 'hu4', name: '🔥 Gas/Heating', group: '🏠 Housing & Utilities', budget: 50, spent: 0, currency: 'EUR', icon: '🔥', type: 'expense' },
  { id: 'hu5', name: '📞 Internet/Phone', group: '🏠 Housing & Utilities', budget: 40, spent: 0, currency: 'EUR', icon: '📞', type: 'expense' },
  { id: 'hu6', name: '🏘️ Community Fees', group: '🏠 Housing & Utilities', budget: 0, spent: 0, currency: 'EUR', icon: '🏘️', type: 'expense' },
  { id: 'hu7', name: '🛠️ Home Maintenance', group: '🏠 Housing & Utilities', budget: 50, spent: 0, currency: 'EUR', icon: '🛠️', type: 'expense' },
  { id: 'hu8', name: '🏡 Other Housing', group: '🏠 Housing & Utilities', budget: 0, spent: 0, currency: 'EUR', icon: '🏡', type: 'expense' },

  // 🩺 INSURANCE & HEALTH (7)
  { id: 'ih1', name: '🩺 Health Insurance', group: '🩺 Insurance & Health', budget: 120, spent: 0, currency: 'EUR', icon: '🩺', type: 'expense' },
  { id: 'ih2', name: '🏥 Medical Expenses', group: '🩺 Insurance & Health', budget: 50, spent: 0, currency: 'EUR', icon: '🏥', type: 'expense' },
  { id: 'ih3', name: '💊 Pharmacy', group: '🩺 Insurance & Health', budget: 30, spent: 0, currency: 'EUR', icon: '💊', type: 'expense' },
  { id: 'ih4', name: '🦷 Dental', group: '🩺 Insurance & Health', budget: 0, spent: 0, currency: 'EUR', icon: '🦷', type: 'expense' },
  { id: 'ih5', name: '👓 Optical', group: '🩺 Insurance & Health', budget: 0, spent: 0, currency: 'EUR', icon: '👓', type: 'expense' },
  { id: 'ih6', name: '🚗 Car Insurance', group: '🩺 Insurance & Health', budget: 60, spent: 0, currency: 'EUR', icon: '🚗', type: 'expense' },
  { id: 'ih7', name: '🛡️ Other Insurance', group: '🩺 Insurance & Health', budget: 0, spent: 0, currency: 'EUR', icon: '🛡️', type: 'expense' },

  // 🍽️ FOOD & DRINKS (7)
  { id: 'fd1', name: '🛒 Groceries', group: '🍽️ Food & Drinks', budget: 400, spent: 0, currency: 'EUR', icon: '🛒', type: 'expense' },
  { id: 'fd2', name: '🍽️ Restaurants', group: '🍽️ Food & Drinks', budget: 150, spent: 0, currency: 'EUR', icon: '🍽️', type: 'expense' },
  { id: 'fd3', name: '☕ Coffee & Snacks', group: '🍽️ Food & Drinks', budget: 50, spent: 0, currency: 'EUR', icon: '☕', type: 'expense' },
  { id: 'fd4', name: '🍕 Fast Food', group: '🍽️ Food & Drinks', budget: 40, spent: 0, currency: 'EUR', icon: '🍕', type: 'expense' },
  { id: 'fd5', name: '🍺 Bars & Drinks', group: '🍽️ Food & Drinks', budget: 60, spent: 0, currency: 'EUR', icon: '🍺', type: 'expense' },
  { id: 'fd6', name: '🛍️ Food Delivery', group: '🍽️ Food & Drinks', budget: 80, spent: 0, currency: 'EUR', icon: '🛍️', type: 'expense' },
  { id: 'fd7', name: '🥗 Other Food', group: '🍽️ Food & Drinks', budget: 0, spent: 0, currency: 'EUR', icon: '🥗', type: 'expense' },

  // 🚗 TRANSPORT (5)
  { id: 'tr1', name: '⛽ Fuel/Gas', group: '🚗 Transport', budget: 120, spent: 0, currency: 'EUR', icon: '⛽', type: 'expense' },
  { id: 'tr2', name: '🚌 Public Transport', group: '🚗 Transport', budget: 50, spent: 0, currency: 'EUR', icon: '🚌', type: 'expense' },
  { id: 'tr3', name: '🚖 Taxi/Uber', group: '🚗 Transport', budget: 40, spent: 0, currency: 'EUR', icon: '🚖', type: 'expense' },
  { id: 'tr4', name: '🔧 Car Maintenance', group: '🚗 Transport', budget: 50, spent: 0, currency: 'EUR', icon: '🔧', type: 'expense' },
  { id: 'tr5', name: '🚙 Other Transport', group: '🚗 Transport', budget: 0, spent: 0, currency: 'EUR', icon: '🚙', type: 'expense' },

  // 🎬 ENTERTAINMENT (6)
  { id: 'en1', name: '🎬 Cinema/Theater', group: '🎬 Entertainment', budget: 40, spent: 0, currency: 'EUR', icon: '🎬', type: 'expense' },
  { id: 'en2', name: '🎮 Gaming', group: '🎬 Entertainment', budget: 30, spent: 0, currency: 'EUR', icon: '🎮', type: 'expense' },
  { id: 'en3', name: '📚 Books/Media', group: '🎬 Entertainment', budget: 20, spent: 0, currency: 'EUR', icon: '📚', type: 'expense' },
  { id: 'en4', name: '🏋️ Gym/Sports', group: '🎬 Entertainment', budget: 40, spent: 0, currency: 'EUR', icon: '🏋️', type: 'expense' },
  { id: 'en5', name: '🎨 Hobbies', group: '🎬 Entertainment', budget: 30, spent: 0, currency: 'EUR', icon: '🎨', type: 'expense' },
  { id: 'en6', name: '🎉 Other Entertainment', group: '🎬 Entertainment', budget: 0, spent: 0, currency: 'EUR', icon: '🎉', type: 'expense' },

  // 📱 SUBSCRIPTIONS & APPS (6)
  { id: 'sa1', name: '📺 Netflix/Streaming', group: '📱 Subscriptions & Apps', budget: 15, spent: 0, currency: 'EUR', icon: '📺', type: 'expense' },
  { id: 'sa2', name: '🎵 Spotify/Music', group: '📱 Subscriptions & Apps', budget: 10, spent: 0, currency: 'EUR', icon: '🎵', type: 'expense' },
  { id: 'sa3', name: '☁️ Cloud Storage', group: '📱 Subscriptions & Apps', budget: 5, spent: 0, currency: 'EUR', icon: '☁️', type: 'expense' },
  { id: 'sa4', name: '📱 Mobile Apps', group: '📱 Subscriptions & Apps', budget: 10, spent: 0, currency: 'EUR', icon: '📱', type: 'expense' },
  { id: 'sa5', name: '💻 Software', group: '📱 Subscriptions & Apps', budget: 20, spent: 0, currency: 'EUR', icon: '💻', type: 'expense' },
  { id: 'sa6', name: '📲 Other Subscriptions', group: '📱 Subscriptions & Apps', budget: 0, spent: 0, currency: 'EUR', icon: '📲', type: 'expense' },

  // 🛍️ PERSONAL SHOPPING (6)
  { id: 'ps1', name: '👕 Clothing', group: '🛍️ Personal Shopping', budget: 80, spent: 0, currency: 'EUR', icon: '👕', type: 'expense' },
  { id: 'ps2', name: '👞 Shoes', group: '🛍️ Personal Shopping', budget: 40, spent: 0, currency: 'EUR', icon: '👞', type: 'expense' },
  { id: 'ps3', name: '💄 Beauty/Cosmetics', group: '🛍️ Personal Shopping', budget: 50, spent: 0, currency: 'EUR', icon: '💄', type: 'expense' },
  { id: 'ps4', name: '💇 Haircut/Salon', group: '🛍️ Personal Shopping', budget: 30, spent: 0, currency: 'EUR', icon: '💇', type: 'expense' },
  { id: 'ps5', name: '💍 Accessories', group: '🛍️ Personal Shopping', budget: 0, spent: 0, currency: 'EUR', icon: '💍', type: 'expense' },
  { id: 'ps6', name: '🛍️ Other Shopping', group: '🛍️ Personal Shopping', budget: 0, spent: 0, currency: 'EUR', icon: '🛍️', type: 'expense' },

  // 🎁 GIFTS & DONATIONS (4)
  { id: 'gd1', name: '🎁 Gifts', group: '🎁 Gifts & Donations', budget: 50, spent: 0, currency: 'EUR', icon: '🎁', type: 'expense' },
  { id: 'gd2', name: '🎂 Birthday Parties', group: '🎁 Gifts & Donations', budget: 30, spent: 0, currency: 'EUR', icon: '🎂', type: 'expense' },
  { id: 'gd3', name: '❤️ Charity/Donations', group: '🎁 Gifts & Donations', budget: 20, spent: 0, currency: 'EUR', icon: '❤️', type: 'expense' },
  { id: 'gd4', name: '🎉 Other Gifts', group: '🎁 Gifts & Donations', budget: 0, spent: 0, currency: 'EUR', icon: '🎉', type: 'expense' },

  // ✈️ TRAVEL (6)
  { id: 'tv1', name: '✈️ Flights', group: '✈️ Travel', budget: 0, spent: 0, currency: 'EUR', icon: '✈️', type: 'expense' },
  { id: 'tv2', name: '🏨 Hotels', group: '✈️ Travel', budget: 0, spent: 0, currency: 'EUR', icon: '🏨', type: 'expense' },
  { id: 'tv3', name: '🎒 Travel Activities', group: '✈️ Travel', budget: 0, spent: 0, currency: 'EUR', icon: '🎒', type: 'expense' },
  { id: 'tv4', name: '🍱 Travel Food', group: '✈️ Travel', budget: 0, spent: 0, currency: 'EUR', icon: '🍱', type: 'expense' },
  { id: 'tv5', name: '🛫 Vacation Package', group: '✈️ Travel', budget: 0, spent: 0, currency: 'EUR', icon: '🛫', type: 'expense' },
  { id: 'tv6', name: '🌍 Other Travel', group: '✈️ Travel', budget: 0, spent: 0, currency: 'EUR', icon: '🌍', type: 'expense' },

  // 💳 LOANS (3)
  { id: 'ln1', name: '💰 Money Lent', group: '💳 Loans', budget: 0, spent: 0, currency: 'EUR', icon: '💰', type: 'expense' },
  { id: 'ln2', name: '🤝 Money Borrowed', group: '💳 Loans', budget: 0, spent: 0, currency: 'EUR', icon: '🤝', type: 'income' },
  { id: 'ln3', name: '💸 Loan Repayment', group: '💳 Loans', budget: 0, spent: 0, currency: 'EUR', icon: '💸', type: 'expense' },

  // ❓ OTHER EXPENSES (1)
  { id: 'ot1', name: '❓ Other Expenses', group: '❓ Other Expenses', budget: 0, spent: 0, currency: 'EUR', icon: '❓', type: 'expense' },

  // 💰 SAVINGS & INVESTMENTS (8)
  { id: 'sv1', name: '🚨 Emergency Fund', group: '💰 Savings & Investments', budget: 300, spent: 0, currency: 'EUR', icon: '🚨', type: 'savings' },
  { id: 'sv2', name: '📊 Fintual', group: '💰 Savings & Investments', budget: 200, spent: 0, currency: 'CLP', icon: '📊', type: 'investment' },
  { id: 'sv3', name: '📈 Racional', group: '💰 Savings & Investments', budget: 150, spent: 0, currency: 'CLP', icon: '📈', type: 'investment' },
  { id: 'sv4', name: '💳 Debito Tenpo', group: '💰 Savings & Investments', budget: 100, spent: 0, currency: 'CLP', icon: '💳', type: 'investment' },
  { id: 'sv5', name: '₿ Binance Crypto', group: '💰 Savings & Investments', budget: 50, spent: 0, currency: 'USD', icon: '₿', type: 'investment' },
  { id: 'sv6', name: '🍋 Zesty', group: '💰 Savings & Investments', budget: 100, spent: 0, currency: 'CLP', icon: '🍋', type: 'investment' },
  { id: 'sv7', name: '📊 Trade Republic ETF', group: '💰 Savings & Investments', budget: 200, spent: 0, currency: 'EUR', icon: '📊', type: 'investment' },
  { id: 'sv8', name: '💰 Other Savings', group: '💰 Savings & Investments', budget: 0, spent: 0, currency: 'EUR', icon: '💰', type: 'savings' },
];

export const INITIAL_TRANSACTIONS = [];

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