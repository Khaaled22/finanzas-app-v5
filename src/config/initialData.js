// src/config/initialData.js
// ✅ M15: Categorías basadas en datos reales (729 transacciones Oct 2024 - Dic 2025)

export const INITIAL_CATEGORIES = [
  // ==================== 💼 INCOME (3) ====================
  {
    id: 'cat_income_khaled_salary',
    name: '💼 Khaled Salary',
    group: '💼 Income',
    type: 'income',
    icon: '💼',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
  {
    id: 'cat_income_ina_salary',
    name: '💼 Ina Salary',
    group: '💼 Income',
    type: 'income',
    icon: '💼',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
  {
    id: 'cat_income_other',
    name: '💼 Other Income',
    group: '💼 Income',
    type: 'income',
    icon: '💼',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },

  // ==================== 💳 LOANS & DEBTS (7) ====================
  {
    id: 'cat_loans_cae',
    name: '🎓 CAE',
    group: '💳 Loans & Debts',
    type: 'expense',
    icon: '🎓',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
  {
    id: 'cat_loans_mortgage_ina',
    name: '🏠 Mortgage Ina',
    group: '💳 Loans & Debts',
    type: 'expense',
    icon: '🏠',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
  {
    id: 'cat_loans_mortgage_khaled',
    name: '🏠 Mortgage Khaled',
    group: '💳 Loans & Debts',
    type: 'expense',
    icon: '🏠',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
  {
    id: 'cat_loans_mortgage_3',
    name: '🏠 Mortgage 3',
    group: '💳 Loans & Debts',
    type: 'expense',
    icon: '🏠',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
  {
    id: 'cat_loans_pie_depto',
    name: '🏢 Pie BuyDepa 15%',
    group: '💳 Loans & Debts',
    type: 'expense',
    icon: '🏢',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
  {
    id: 'cat_loans_family_mom',
    name: '👩‍👦 Family Support Mom',
    group: '💳 Loans & Debts',
    type: 'expense',
    icon: '👩‍👦',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
  {
    id: 'cat_loans_family_enanas',
    name: '🤝 Family Support "Enanas"',
    group: '💳 Loans & Debts',
    type: 'expense',
    icon: '🤝',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },

  // ==================== 🏠 HOUSING & UTILITIES (8) ====================
  {
    id: 'cat_housing_rent',
    name: '🏠 Rent',
    group: '🏠 Housing & Utilities',
    type: 'expense',
    icon: '🏠',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
  {
    id: 'cat_housing_electricity',
    name: '💡 Electricity',
    group: '🏠 Housing & Utilities',
    type: 'expense',
    icon: '💡',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
  {
    id: 'cat_housing_water',
    name: '🚰 Water',
    group: '🏠 Housing & Utilities',
    type: 'expense',
    icon: '🚰',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
  {
    id: 'cat_housing_internet',
    name: '🌐 Internet / Wi-Fi',
    group: '🏠 Housing & Utilities',
    type: 'expense',
    icon: '🌐',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
  {
    id: 'cat_housing_phone',
    name: '📱 Phone',
    group: '🏠 Housing & Utilities',
    type: 'expense',
    icon: '📱',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
  {
    id: 'cat_housing_tv_tax',
    name: '📺 Radio / TV Tax',
    group: '🏠 Housing & Utilities',
    type: 'expense',
    icon: '📺',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
  {
    id: 'cat_housing_bank_fees',
    name: '🏦 Bank Fees',
    group: '🏠 Housing & Utilities',
    type: 'expense',
    icon: '🏦',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
  {
    id: 'cat_housing_admin_fees',
    name: '🗂️ Other Admin Fees',
    group: '🏠 Housing & Utilities',
    type: 'expense',
    icon: '🗂️',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },

  // ==================== 🩺 INSURANCE & HEALTH (7) ====================
  {
    id: 'cat_health_insurance',
    name: '🩺 Health Insurance',
    group: '🩺 Insurance & Health',
    type: 'expense',
    icon: '🩺',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
  {
    id: 'cat_health_doctor',
    name: '👩‍⚕️ Doctor Visits',
    group: '🩺 Insurance & Health',
    type: 'expense',
    icon: '👩‍⚕️',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
  {
    id: 'cat_health_medicines',
    name: '💊 Medicines',
    group: '🩺 Insurance & Health',
    type: 'expense',
    icon: '💊',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
  {
    id: 'cat_health_supplements',
    name: '🥼 Supplements / Vitamins',
    group: '🩺 Insurance & Health',
    type: 'expense',
    icon: '🥼',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
  {
    id: 'cat_health_beauty',
    name: '💇 Hair / Beauty',
    group: '🩺 Insurance & Health',
    type: 'expense',
    icon: '💇',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
  {
    id: 'cat_health_gym',
    name: '🏋️ Gym',
    group: '🩺 Insurance & Health',
    type: 'expense',
    icon: '🏋️',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },

  // ==================== 🍽️ FOOD & DRINKS (6) ====================
  {
    id: 'cat_food_groceries',
    name: '🛒 Groceries',
    group: '🍽️ Food & Drinks',
    type: 'expense',
    icon: '🛒',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
  {
    id: 'cat_food_restaurants',
    name: '🍽️ Restaurants',
    group: '🍽️ Food & Drinks',
    type: 'expense',
    icon: '🍽️',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
  {
    id: 'cat_food_fastfood',
    name: '🍔 Fast Food',
    group: '🍽️ Food & Drinks',
    type: 'expense',
    icon: '🍔',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
  {
    id: 'cat_food_cafes',
    name: '☕ Cafés',
    group: '🍽️ Food & Drinks',
    type: 'expense',
    icon: '☕',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
  {
    id: 'cat_food_bars',
    name: '🍻 Bars / Pubs',
    group: '🍽️ Food & Drinks',
    type: 'expense',
    icon: '🍻',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
  {
    id: 'cat_food_delivery',
    name: '🚚 Food Delivery',
    group: '🍽️ Food & Drinks',
    type: 'expense',
    icon: '🚚',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },

  // ==================== 🚗 TRANSPORT (4) ====================
  {
    id: 'cat_transport_ticket',
    name: '🚆 Deutschland-Ticket',
    group: '🚗 Transport',
    type: 'expense',
    icon: '🚆',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
  {
    id: 'cat_transport_bike',
    name: '🚲 Nextbike',
    group: '🚗 Transport',
    type: 'expense',
    icon: '🚲',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
  {
    id: 'cat_transport_maintenance',
    name: '🔧 Car/Bike Maintenance',
    group: '🚗 Transport',
    type: 'expense',
    icon: '🔧',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
  {
    id: 'cat_transport_other',
    name: '🚌 Other Transport',
    group: '🚗 Transport',
    type: 'expense',
    icon: '🚌',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },

  // ==================== 🎬 ENTERTAINMENT (5) ====================
  {
    id: 'cat_entertainment_cinema',
    name: '🎬 Cinema / Theatre',
    group: '🎬 Entertainment',
    type: 'expense',
    icon: '🎬',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
  {
    id: 'cat_entertainment_concerts',
    name: '🎟️ Concerts / Events',
    group: '🎬 Entertainment',
    type: 'expense',
    icon: '🎟️',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
  {
    id: 'cat_entertainment_nightout',
    name: '🎉 Night Out',
    group: '🎬 Entertainment',
    type: 'expense',
    icon: '🎉',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
  {
    id: 'cat_entertainment_alcohol',
    name: '🍸 Alcohol & Cocktails',
    group: '🎬 Entertainment',
    type: 'expense',
    icon: '🍸',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
  {
    id: 'cat_entertainment_leisure',
    name: '🎨 Leisure',
    group: '🎬 Entertainment',
    type: 'expense',
    icon: '🎨',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },

  // ==================== 📱 SUBSCRIPTIONS & APPS (6) ====================
  {
    id: 'cat_subs_netflix',
    name: '📺 Netflix',
    group: '📱 Subscriptions & Apps',
    type: 'expense',
    icon: '📺',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
  {
    id: 'cat_subs_disney',
    name: '🎞️ Disney+',
    group: '📱 Subscriptions & Apps',
    type: 'expense',
    icon: '🎞️',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
  {
    id: 'cat_subs_spotify',
    name: '🎵 Spotify',
    group: '📱 Subscriptions & Apps',
    type: 'expense',
    icon: '🎵',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
  {
    id: 'cat_subs_google',
    name: '☁️ Google One',
    group: '📱 Subscriptions & Apps',
    type: 'expense',
    icon: '☁️',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
  {
    id: 'cat_subs_chatgpt',
    name: '🤖 ChatGPT Plus',
    group: '📱 Subscriptions & Apps',
    type: 'expense',
    icon: '🤖',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
  {
    id: 'cat_subs_other',
    name: '📑 Other Services',
    group: '📱 Subscriptions & Apps',
    type: 'expense',
    icon: '📑',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },

  // ==================== 🛍️ PERSONAL SHOPPING (5) ====================
  {
    id: 'cat_shopping_clothes',
    name: '👕 Clothes / Shoes',
    group: '🛍️ Personal Shopping',
    type: 'expense',
    icon: '👕',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
  {
    id: 'cat_shopping_electronics',
    name: '📱 Electronics',
    group: '🛍️ Personal Shopping',
    type: 'expense',
    icon: '📱',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
  {
    id: 'cat_shopping_home',
    name: '🛋️ Home & Decor',
    group: '🛍️ Personal Shopping',
    type: 'expense',
    icon: '🛋️',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
  {
    id: 'cat_shopping_cookware',
    name: '🍳 Cookware',
    group: '🛍️ Personal Shopping',
    type: 'expense',
    icon: '🍳',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
  {
    id: 'cat_shopping_other',
    name: '🛍️ Other Shopping',
    group: '🛍️ Personal Shopping',
    type: 'expense',
    icon: '🛍️',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },

  // ==================== 🎁 GIFTS & DONATIONS (3) ====================
  {
    id: 'cat_gifts_birthdays',
    name: '🎂 Birthdays',
    group: '🎁 Gifts & Donations',
    type: 'expense',
    icon: '🎂',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
  {
    id: 'cat_gifts_christmas',
    name: '🎄 Christmas',
    group: '🎁 Gifts & Donations',
    type: 'expense',
    icon: '🎄',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
  {
    id: 'cat_gifts_other',
    name: '🎁 Other Gifts / Charity',
    group: '🎁 Gifts & Donations',
    type: 'expense',
    icon: '🎁',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },

  // ==================== ✈️ TRAVEL (6) ====================
  {
    id: 'cat_travel_flights',
    name: '✈️ Flights',
    group: '✈️ Travel',
    type: 'expense',
    icon: '✈️',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
  {
    id: 'cat_travel_accommodation',
    name: '🏨 Accommodation',
    group: '✈️ Travel',
    type: 'expense',
    icon: '🏨',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
  {
    id: 'cat_travel_local_transport',
    name: '🚖 Local Transport',
    group: '✈️ Travel',
    type: 'expense',
    icon: '🚖',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
  {
    id: 'cat_travel_meals',
    name: '🍱 Travel Meals',
    group: '✈️ Travel',
    type: 'expense',
    icon: '🍱',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
  {
    id: 'cat_travel_activities',
    name: '🏞️ Activities / Tours',
    group: '✈️ Travel',
    type: 'expense',
    icon: '🏞️',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
  {
    id: 'cat_travel_souvenirs',
    name: '🗺️ Souvenirs',
    group: '✈️ Travel',
    type: 'expense',
    icon: '🗺️',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },

  // ==================== 💰 SAVINGS & INVESTMENTS (2) ====================
  {
    id: 'cat_savings_eur',
    name: '💶 EUR Savings Account',
    group: '💰 Savings & Investments',
    type: 'investment',
    icon: '💶',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
  {
    id: 'cat_investment_general',
    name: '💰 Investments',
    group: '💰 Savings & Investments',
    type: 'investment',
    icon: '💰',
    budget: 0,
    spent: 0,
    currency: 'EUR'
  },
];

/**
 * Genera transacciones de ejemplo (vacío por ahora, se llenarán con importación M16)
 */
export const INITIAL_TRANSACTIONS = [];

export const INITIAL_DEBTS = [];

export const INITIAL_SAVINGS_GOALS = [];

export const INITIAL_INVESTMENTS = [];

export const INITIAL_YNAB_CONFIG = {
  monthlyIncome: 4500 // Estimado: 2874 Khaled + 1553 Ina + 332 Other ≈ 4759
};