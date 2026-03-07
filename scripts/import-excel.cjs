/**
 * Excel Budget 2.0 → Finanzas App v5 Importer
 * Reads the Excel file and generates JSON data for all app modules.
 * Output: scripts/import-data.json (to be loaded via app import mechanism)
 *
 * Usage: node scripts/import-excel.cjs "C:\Users\ksaud\Downloads\Budget 2.0-07.03.2026.xlsx"
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const INPUT = process.argv[2] || 'C:\\Users\\ksaud\\Downloads\\Budget 2.0-07.03.2026.xlsx';
const OUTPUT = path.join(__dirname, 'import-data.json');

// =====================================================
// HELPERS
// =====================================================

/** Convert Excel serial date to YYYY-MM-DD */
function excelToDate(serial) {
  if (!serial || typeof serial !== 'number') return null;
  const d = new Date((serial - 25569) * 86400 * 1000);
  return d.toISOString().split('T')[0];
}

/** Convert Excel serial date to YYYY-MM */
function excelToMonth(serial) {
  const d = excelToDate(serial);
  return d ? d.slice(0, 7) : null;
}

/** Convert Excel serial to ISO timestamp */
function excelToISO(serial) {
  if (!serial || typeof serial !== 'number') return new Date().toISOString();
  return new Date((serial - 25569) * 86400 * 1000).toISOString();
}

/** Extract emoji from subcategory name like "🛒 Groceries" */
function extractIcon(name) {
  if (!name) return '';
  // Match emoji at start (including multi-byte)
  const match = name.match(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})/u);
  return match ? match[0] : '';
}

/** Generate deterministic ID */
function makeId(prefix, index) {
  return prefix + '_import_' + String(index).padStart(4, '0');
}

/** Determine flowKind from group name */
function getFlowKind(group) {
  if (group.includes('Income')) return 'INCOME';
  if (group.includes('Loans') || group.includes('Debts')) return 'DEBT_PAYMENT';
  if (group.includes('Savings') || group.includes('Investments')) return 'INVESTMENT_CONTRIBUTION';
  return 'OPERATING_EXPENSE';
}

/** Determine type from group name */
function getType(group) {
  if (group.includes('Income')) return 'income';
  if (group.includes('Savings') || group.includes('Investments')) return 'investment';
  return 'expense';
}

// =====================================================
// READ EXCEL
// =====================================================

console.log('Reading:', INPUT);
const wb = XLSX.readFile(INPUT);

function getSheet(name) {
  const ws = wb.Sheets[name];
  if (!ws) { console.warn('Sheet not found:', name); return []; }
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
}

const rawCategories = getSheet('Categories').slice(1); // skip header
const rawTransactions = getSheet('Transactions').slice(1);
const rawBudgets = getSheet('Budgets').slice(1);
const rawInvestSnap = getSheet('Investments_Snap').slice(1);
const rawInvestLatest = getSheet('Investments_Latest').slice(1);
const rawDebtsSnap = getSheet('Debts_Snap').slice(1);
const rawDebtsLatest = getSheet('Debts_Latest').slice(1);
const rawGoals = getSheet('Goals').slice(1);
const rawAcctGoalMap = getSheet('Acct_Goal_Map').slice(1);

// =====================================================
// 1. CATEGORIES
// =====================================================
console.log('\n=== Processing Categories ===');

const categoryMap = {}; // subcategoryName -> category object
const categories = [];
let catIndex = 0;

// First pass: collect all subcategories from Categories sheet
for (const row of rawCategories) {
  const [group, subcategory] = row;
  if (!group || !subcategory) continue;

  // Skip Travel
  if (group.includes('Travel')) continue;

  const name = String(subcategory).trim();
  const groupName = String(group).trim();

  // Determine default currency based on group/name
  let currency = 'EUR';
  if (name.includes('Mortgage') || name.includes('CAE')) currency = 'CLP';
  if (name.includes('Pie BuyDepa')) currency = 'UF';

  const cat = {
    id: makeId('cat', catIndex++),
    name: name,
    group: groupName,
    budget: 0,
    spent: 0,
    currency: currency,
    icon: extractIcon(name) || extractIcon(groupName) || '',
    type: getType(groupName),
    flowKind: getFlowKind(groupName),
  };

  categories.push(cat);
  categoryMap[name] = cat;
}

// Scan transactions for subcategories not in Categories sheet
const extraSubcats = new Set();
for (const row of rawTransactions) {
  const subcategory = String(row[4] || '').trim();
  const group = String(row[3] || '').trim();
  if (subcategory && !categoryMap[subcategory] && !group.includes('Travel')) {
    extraSubcats.add(JSON.stringify({ group, subcategory }));
  }
}

for (const json of extraSubcats) {
  const { group, subcategory } = JSON.parse(json);
  console.log('  Extra category from transactions:', subcategory, '(', group, ')');

  let currency = 'EUR';
  if (subcategory.includes('Mortgage') || subcategory.includes('CAE')) currency = 'CLP';

  const cat = {
    id: makeId('cat', catIndex++),
    name: subcategory,
    group: group,
    budget: 0,
    spent: 0,
    currency: currency,
    icon: extractIcon(subcategory) || extractIcon(group) || '',
    type: getType(group),
    flowKind: getFlowKind(group),
  };

  categories.push(cat);
  categoryMap[subcategory] = cat;
}

// Handle "Other Income" split: check Budgets for CLP entries
// We need separate categories for "Other Income EUR" and "Other Income CLP"
const otherIncomeCat = categoryMap['Other Income'] || categoryMap['💼 Other Income'];
if (otherIncomeCat) {
  // Check if there are CLP budgets for Other Income
  const hasCLPBudgets = rawBudgets.some(row => {
    const sub = String(row[2] || '').trim();
    const cur = String(row[3] || '').trim();
    return (sub === '💼 Other Income' || sub === 'Other Income') && cur === 'CLP';
  });

  if (hasCLPBudgets) {
    // Rename existing to EUR version
    otherIncomeCat.name = '💼 Other Income EUR';
    categoryMap['💼 Other Income EUR'] = otherIncomeCat;

    // Create CLP version
    const clpCat = {
      id: makeId('cat', catIndex++),
      name: '💼 Other Income CLP',
      group: otherIncomeCat.group,
      budget: 0,
      spent: 0,
      currency: 'CLP',
      icon: '💼',
      type: 'income',
      flowKind: 'INCOME',
    };
    categories.push(clpCat);
    categoryMap['💼 Other Income CLP'] = clpCat;

    console.log('  Split "Other Income" into EUR and CLP categories');
  }
}

// Fix currencies from Budgets sheet (some categories have CLP/UF budgets)
for (const row of rawBudgets) {
  const sub = String(row[2] || '').trim();
  const cur = String(row[3] || '').trim();
  const budget = parseFloat(row[4]) || 0;

  if (!sub || !cur || budget === 0) continue;

  const cat = categoryMap[sub];
  if (cat && cur !== 'EUR' && !sub.includes('Other Income')) {
    // Update category currency to match its budget currency
    cat.currency = cur;
  }
}

console.log('  Total categories:', categories.length);

// =====================================================
// 2. INVESTMENTS (Platforms)
// =====================================================
console.log('\n=== Processing Investments ===');

const platformMap = {}; // accountName -> platform object
const platforms = [];
let platIndex = 0;

// Goal mapping
const goalMapping = {};
for (const row of rawAcctGoalMap) {
  const account = String(row[0] || '').trim();
  const goal = String(row[1] || '').trim();
  if (account && goal) goalMapping[account] = goal;
}

// Map goal names to app goal codes
function mapGoalCode(goalName) {
  const map = {
    'Emergency Fund': 'emergency',
    'FI Step 1': 'fi_step1',
    'Real State': 'real_state',
    'Down payment 3': 'down_payment',
    'NO': 'cash',
  };
  return map[goalName] || 'other';
}

// Map account names to subtypes
function mapSubtype(accountName) {
  const lower = accountName.toLowerCase();
  if (lower.includes('fintual stocks')) return 'etf';
  if (lower.includes('fintual')) return 'fondos_mutuos';
  if (lower.includes('racional')) return 'etf';
  if (lower.includes('binance')) return 'crypto';
  if (lower.includes('xtb')) return 'acciones';
  if (lower.includes('trade republic')) return 'etf';
  if (lower.includes('apv')) return 'apv';
  if (lower.includes('pie') || lower.includes('capital')) return 'real_state';
  if (lower.includes('debit card')) return 'cuenta_vista';
  if (lower.includes('mach') || lower.includes('tenpo')) return 'money_market';
  if (lower.includes('zesty')) return 'acciones';
  return 'otro';
}

// Process Investments_Latest for current state
for (const row of rawInvestLatest) {
  const date = excelToDate(row[0]);
  const account = String(row[1] || '').trim();
  const currency = String(row[2] || '').trim();
  const value = parseFloat(row[3]) || 0;
  const liquid = String(row[6] || '').trim();
  const goalName = String(row[7] || '').trim();

  if (!account || !date) continue;

  const goalCode = mapGoalCode(goalMapping[account] || goalName || '');
  const subtype = mapSubtype(account);
  const isLiquid = liquid === 'Yes';
  const now = new Date().toISOString();

  const platform = {
    id: makeId('plat', platIndex++),
    name: account,
    goal: goalCode,
    subtype: subtype,
    currency: currency || 'EUR',
    currentBalance: value,
    totalDeposited: value, // approximate
    isLiquid: isLiquid,
    isCash: goalCode === 'cash' || ['cuenta_corriente', 'cuenta_ahorro', 'cuenta_vista', 'efectivo'].includes(subtype),
    notes: '',
    country: '',
    institution: account,
    accountNumber: '',
    balanceHistory: [],
    isArchived: value === 0,
    createdAt: now,
    updatedAt: now,
  };

  platforms.push(platform);
  platformMap[account] = platform;
}

// Add balance history from Investments_Snap
for (const row of rawInvestSnap) {
  const date = excelToDate(row[0]);
  const account = String(row[1] || '').trim();
  const value = parseFloat(row[3]) || 0;

  if (!account || !date) continue;

  const platform = platformMap[account];
  if (!platform) continue;

  platform.balanceHistory.push({
    id: makeId('bh', platform.balanceHistory.length),
    date: date,
    balance: value,
    note: '',
    type: platform.balanceHistory.length === 0 ? 'initial' : 'update',
    createdAt: excelToISO(row[0]),
  });
}

// Sort balance histories by date
for (const p of platforms) {
  p.balanceHistory.sort((a, b) => a.date.localeCompare(b.date));
  // Ensure first entry is 'initial'
  if (p.balanceHistory.length > 0) {
    p.balanceHistory[0].type = 'initial';
  }
}

console.log('  Total platforms:', platforms.length);
console.log('  With history:', platforms.filter(p => p.balanceHistory.length > 1).length);

// =====================================================
// 3. DEBTS
// =====================================================
console.log('\n=== Processing Debts ===');

const debtMap = {}; // debtName -> debt object
const debts = [];
let debtIndex = 0;

const toxicDebts = new Set(['CAE', 'GGOO Dpto 3']);

for (const row of rawDebtsLatest) {
  const date = excelToDate(row[0]);
  const debtName = String(row[1] || '').trim();
  const currency = String(row[2] || '').trim();
  const outstanding = parseFloat(row[3]) || 0;
  const badFlag = parseInt(row[4]) || 0;

  if (!debtName || !date) continue;

  const isToxic = badFlag === 1 || toxicDebts.has(debtName) ||
    debtName.includes('CAE') || debtName.includes('GGOO');
  const now = new Date().toISOString();

  const debt = {
    id: makeId('debt', debtIndex++),
    name: debtName,
    type: debtName.includes('Mortgage') ? 'Hipoteca' :
          debtName.includes('CAE') ? 'Credito Educativo' :
          debtName.includes('Pie') ? 'Pie Departamento' : 'Otro',
    initialAmount: outstanding, // Will be updated from first snapshot
    originalAmount: outstanding,
    currentBalance: outstanding,
    currency: currency || 'CLP',
    interestRate: 0,
    monthlyPayment: 0,
    dueDate: null,
    notes: '',
    isToxic: isToxic,
    paymentHistory: [],
    balanceHistory: [],
    createdAt: now,
  };

  debts.push(debt);
  debtMap[debtName] = debt;
}

// Add balance history from Debts_Snap
for (const row of rawDebtsSnap) {
  const date = excelToDate(row[0]);
  const debtName = String(row[1] || '').trim();
  const outstanding = parseFloat(row[3]) || 0;

  if (!debtName || !date) continue;

  const debt = debtMap[debtName];
  if (!debt) continue;

  debt.balanceHistory.push({
    id: makeId('dbh', debt.balanceHistory.length),
    date: date,
    balance: outstanding,
    note: '',
    type: debt.balanceHistory.length === 0 ? 'initial' : 'update',
    createdAt: excelToISO(row[0]),
  });
}

// Sort and set initial amounts from first snapshot
for (const d of debts) {
  d.balanceHistory.sort((a, b) => a.date.localeCompare(b.date));
  if (d.balanceHistory.length > 0) {
    d.balanceHistory[0].type = 'initial';
    d.initialAmount = d.balanceHistory[0].balance;
    d.originalAmount = d.balanceHistory[0].balance;
  }
}

console.log('  Total debts:', debts.length);
console.log('  Toxic:', debts.filter(d => d.isToxic).length);

// =====================================================
// 4. SAVINGS GOALS
// =====================================================
console.log('\n=== Processing Savings Goals ===');

const savingsGoals = [];
let goalIndex = 0;

for (const row of rawGoals) {
  const goalName = String(row[0] || '').trim();
  const targetAmt = parseFloat(row[1]) || 0;
  const currency = String(row[2] || '').trim();
  const targetDate = excelToDate(row[3]);
  const savedEUR = parseFloat(row[4]) || 0;
  const progress = parseFloat(row[7]) || 0;

  if (!goalName) continue;

  // Find linked platforms from Acct_Goal_Map
  const linkedPlatformIds = [];
  for (const [acctName, gName] of Object.entries(goalMapping)) {
    if (gName === goalName && platformMap[acctName]) {
      linkedPlatformIds.push(platformMap[acctName].id);
    }
  }

  savingsGoals.push({
    id: makeId('goal', goalIndex++),
    name: goalName,
    targetAmount: targetAmt,
    currentAmount: savedEUR,
    currency: currency || 'EUR',
    targetDate: targetDate,
    linkedPlatform: linkedPlatformIds[0] || null,
    linkedPlatforms: linkedPlatformIds,
    notes: '',
    icon: goalName === 'Emergency Fund' ? '🛡️' :
          goalName === 'FI Step 1' ? '🚀' :
          goalName === 'Real State' ? '🏠' :
          goalName === 'Chile Tickets' ? '✈️' :
          goalName === 'Antonia' ? '👶' :
          goalName === 'Honey Moon' ? '💍' :
          goalName === 'Down payment 3' ? '🏢' : '🎯',
    createdAt: new Date().toISOString(),
    contributions: [],
  });
}

console.log('  Total goals:', savingsGoals.length);

// =====================================================
// 5. TRANSACTIONS
// =====================================================
console.log('\n=== Processing Transactions ===');

const transactions = [];
let txIndex = 0;
let skippedZero = 0;
let skippedTravel = 0;

for (const row of rawTransactions) {
  const timestamp = row[0];
  const dateSerial = row[1];
  const type = String(row[2] || '').trim();
  const group = String(row[3] || '').trim();
  const subcategory = String(row[4] || '').trim();
  const description = String(row[5] || '').trim();
  const currency = String(row[6] || '').trim() || 'EUR';
  const amount = parseFloat(row[7]) || 0;

  // Skip Travel
  if (group.includes('Travel')) { skippedTravel++; continue; }

  // Skip zero amounts
  if (amount === 0) { skippedZero++; continue; }

  const date = excelToDate(dateSerial);
  if (!date) continue;

  // Find categoryId
  let catId = null;
  let cat = categoryMap[subcategory];

  // Handle "Other Income" split
  if (subcategory === '💼 Other Income' || subcategory === 'Other Income') {
    if (currency === 'CLP') {
      cat = categoryMap['💼 Other Income CLP'];
    } else {
      cat = categoryMap['💼 Other Income EUR'];
    }
  }

  if (cat) catId = cat.id;

  transactions.push({
    id: makeId('tx', txIndex++),
    date: date,
    description: description || '',
    amount: Math.abs(amount),
    currency: currency,
    categoryId: catId,
    paymentMethod: 'Tarjeta',
    notes: '',
    imported: true,
    importedAt: new Date().toISOString(),
    recurrence: null,
    recurringId: null,
    autoGenerated: false,
    createdAt: excelToISO(timestamp || dateSerial),
    user: 'Usuario 1',
  });
}

// Sort by date
transactions.sort((a, b) => a.date.localeCompare(b.date));

console.log('  Total transactions:', transactions.length);
console.log('  Skipped (zero amount):', skippedZero);
console.log('  Skipped (travel):', skippedTravel);
console.log('  Date range:', transactions[0]?.date, '→', transactions[transactions.length - 1]?.date);

// =====================================================
// 6. MONTHLY BUDGETS
// =====================================================
console.log('\n=== Processing Monthly Budgets ===');

const monthlyBudgets = {};
const monthlyIncomeOverrides = {};
let budgetRows = 0;

for (const row of rawBudgets) {
  const monthSerial = row[0];
  const group = String(row[1] || '').trim();
  const subcategory = String(row[2] || '').trim();
  const currency = String(row[3] || '').trim();
  const budget = parseFloat(row[4]) || 0;
  const budgetEUR = parseFloat(row[5]) || 0;

  if (!monthSerial || !subcategory) continue;

  // Skip Travel
  if (group.includes('Travel')) continue;

  const month = excelToMonth(monthSerial);
  if (!month) continue;

  // Find category
  let cat = categoryMap[subcategory];

  // Handle Other Income split
  if (subcategory === '💼 Other Income' || subcategory === 'Other Income') {
    if (currency === 'CLP') {
      cat = categoryMap['💼 Other Income CLP'];
    } else {
      cat = categoryMap['💼 Other Income EUR'];
    }
  }

  if (!cat) continue;

  if (!monthlyBudgets[month]) monthlyBudgets[month] = {};

  // Use the budget in the category's own currency
  if (!monthlyBudgets[month][cat.id]) {
    monthlyBudgets[month][cat.id] = { budget: 0, spent: 0 };
  }

  // Accumulate (for split categories like Other Income with multiple CLP rows)
  monthlyBudgets[month][cat.id].budget += budget;

  // Track income for monthlyIncomeOverrides
  if (cat.type === 'income' || cat.flowKind === 'INCOME') {
    if (!monthlyIncomeOverrides[month]) monthlyIncomeOverrides[month] = 0;
    monthlyIncomeOverrides[month] += budgetEUR || budget;
  }

  budgetRows++;
}

console.log('  Months with budgets:', Object.keys(monthlyBudgets).length);
console.log('  Budget entries:', budgetRows);
console.log('  Income overrides:', Object.keys(monthlyIncomeOverrides).length);

// =====================================================
// 7. YNAB CONFIG
// =====================================================

// Calculate average monthly income from overrides
const incomeValues = Object.values(monthlyIncomeOverrides).filter(v => v > 0);
const avgIncome = incomeValues.length > 0
  ? Math.round(incomeValues.reduce((a, b) => a + b, 0) / incomeValues.length)
  : 0;

const ynabConfig = {
  enabled: true,
  monthlyIncome: avgIncome,
  currency: 'EUR',
  monthlyIncomeOverrides: monthlyIncomeOverrides,
  alertThreshold: 0.85,
};

console.log('  Avg monthly income:', avgIncome, 'EUR');

// =====================================================
// 8. OUTPUT
// =====================================================
console.log('\n=== Writing Output ===');

const output = {
  _meta: {
    source: INPUT,
    generatedAt: new Date().toISOString(),
    user: 'ksaudh@gmail.com',
    stats: {
      categories: categories.length,
      transactions: transactions.length,
      platforms: platforms.length,
      debts: debts.length,
      savingsGoals: savingsGoals.length,
      budgetMonths: Object.keys(monthlyBudgets).length,
    }
  },
  // localStorage keys
  'finanzas_categories': categories,
  'finanzas_transactions': transactions,
  'finanzas_monthlyBudgets': monthlyBudgets,
  'finanzas_ynabConfig': ynabConfig,
  'finanzas_investments': platforms,
  'finanzas_savingsGoals': savingsGoals,
  'finanzas_debts': debts,
};

fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2), 'utf-8');
console.log('\nOutput written to:', OUTPUT);
console.log('\nSummary:');
console.log('  Categories:', categories.length);
console.log('  Transactions:', transactions.length);
console.log('  Platforms:', platforms.length, '(with', platforms.reduce((s, p) => s + p.balanceHistory.length, 0), 'balance entries)');
console.log('  Debts:', debts.length, '(with', debts.reduce((s, d) => s + d.balanceHistory.length, 0), 'balance entries)');
console.log('  Savings Goals:', savingsGoals.length);
console.log('  Budget months:', Object.keys(monthlyBudgets).length);
console.log('  Income overrides:', Object.keys(monthlyIncomeOverrides).length);
