// scripts/excel-to-import.js
// Reads the Finanzas Excel file and generates a clean finanzas-backup-import.json
// Usage: node scripts/excel-to-import.js [path-to-xlsx]

var path = require('path');
var fs = require('fs');
var XLSX = require('xlsx');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
var DEFAULT_EXCEL = 'C:/Users/ksaud/Downloads/Budget 2.0-08.03.2026.xlsx';
var excelPath = process.argv[2] || DEFAULT_EXCEL;
var outPath = path.join(__dirname, 'finanzas-backup-import.json');

console.log('Reading:', excelPath);
var wb = XLSX.readFile(excelPath);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Excel serial date -> ISO string  (serial 1 = 1900-01-01, with Lotus bug)
var EPOCH = Date.UTC(1899, 11, 30); // 1899-12-30
function serialToDate(serial) {
  if (!serial || typeof serial !== 'number') return null;
  var ms = Math.round((serial - 0) * 86400000) + EPOCH;
  var d = new Date(ms);
  return d.toISOString().slice(0, 10);
}

function serialToISO(serial) {
  if (!serial || typeof serial !== 'number') return null;
  var ms = Math.round((serial - 0) * 86400000) + EPOCH;
  return new Date(ms).toISOString();
}

function serialToYearMonth(serial) {
  var iso = serialToDate(serial);
  if (!iso) return null;
  return iso.slice(0, 7); // "YYYY-MM"
}

// Emoji extraction: leading emoji -> { icon, text }
// Handles ZWJ sequences like 👩‍⚕️ (woman+ZWJ+⚕+FE0F), 👨‍👧, 👩‍👦
var EMOJI_RE = /^((?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F?)(?:\u200D(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F?))*)\s*/u;
function splitEmoji(str) {
  if (!str) return { icon: '', text: '' };
  str = String(str).trim();
  var m = str.match(EMOJI_RE);
  if (m) {
    return { icon: m[1], text: str.slice(m[0].length).trim() };
  }
  return { icon: '', text: str };
}

// Sanitize name -> id fragment
function sanitize(s) {
  return String(s).toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function readSheet(name) {
  var ws = wb.Sheets[name];
  if (!ws) { console.warn('WARNING: sheet "' + name + '" not found'); return []; }
  return XLSX.utils.sheet_to_json(ws);
}

// ---------------------------------------------------------------------------
// 1. CATEGORIES
// ---------------------------------------------------------------------------
var rawCats = readSheet('Categories');
var warnings = [];

function groupToType(group) {
  var g = group.toLowerCase();
  if (g.includes('income')) return 'income';
  if (g.includes('savings') || g.includes('investment')) return 'savings';
  if (g.includes('loan') || g.includes('debt')) return 'expense';
  return 'expense';
}

function groupToFlowKind(group) {
  var g = group.toLowerCase();
  if (g.includes('income')) return 'INCOME';
  if (g.includes('savings') || g.includes('investment')) return 'INVESTMENT_CONTRIBUTION';
  if (g.includes('loan') || g.includes('debt')) return 'DEBT_PAYMENT';
  return 'OPERATING_EXPENSE';
}

// Build category lookup: subcategory (with emoji) -> category object
var catLookup = {};  // key = original Subcategory string from Excel
var categories = [];

rawCats.forEach(function(row) {
  var groupRaw = row.Category || '';
  var subRaw = row.Subcategory || '';
  if (!subRaw) return;

  var groupParsed = splitEmoji(groupRaw);
  var subParsed = splitEmoji(subRaw);

  var catId = 'cat_' + sanitize(subParsed.text);
  var cat = {
    id: catId,
    name: subParsed.text,
    group: groupParsed.text,
    budget: 0,
    spent: 0,
    currency: 'EUR',
    icon: subParsed.icon || groupParsed.icon || '',
    type: groupToType(groupParsed.text),
    flowKind: groupToFlowKind(groupParsed.text)
  };

  categories.push(cat);
  catLookup[subRaw.trim()] = cat;
  // Also store without leading/trailing spaces
  catLookup[subRaw] = cat;
});

// Build a reverse lookup from sanitized subcategory text -> catId (for fuzzy matching)
var catByText = {};
categories.forEach(function(c) { catByText[c.name.toLowerCase()] = c; });

function findCategoryId(subcatRaw) {
  // Try exact match first
  var c = catLookup[subcatRaw] || catLookup[(subcatRaw || '').trim()];
  if (c) return c.id;
  // Try stripping emoji from input
  var parsed = splitEmoji(subcatRaw);
  var byText = catByText[parsed.text.toLowerCase()];
  if (byText) return byText.id;
  // Fallback
  warnings.push('No category match for: "' + subcatRaw + '"');
  return 'cat_' + sanitize(parsed.text);
}

// ---------------------------------------------------------------------------
// 2. TRANSACTIONS
// ---------------------------------------------------------------------------
var rawTxns = readSheet('Transactions');
var transactions = [];

rawTxns.forEach(function(row) {
  if (!row.Date) return;
  var dateStr = serialToDate(row.Date);
  if (!dateStr) return;

  var catId = findCategoryId(row.Subcategory);
  transactions.push({
    id: 'txn_' + uuid(),
    date: dateStr,
    description: row.Description || '',
    amount: typeof row.Amount === 'number' ? row.Amount : 0,
    currency: row.Currency || 'EUR',
    categoryId: catId,
    paymentMethod: 'Otro',
    createdAt: serialToISO(row.Timestamp) || new Date().toISOString()
  });
});

// ---------------------------------------------------------------------------
// 3. INVESTMENTS
// ---------------------------------------------------------------------------
var rawInvLatest = readSheet('Investments_Latest');
var rawInvSnap = readSheet('Investments_Snap');
var rawAcctGoalMap = readSheet('Acct_Goal_Map');

// Goal name -> goal key mapping
var GOAL_KEY_MAP = {
  'Emergency Fund': 'emergency',
  'FI Step 1': 'fi_step1',
  'Real State': 'real_state',
  'Down payment 3': 'down_payment',
  'Cash': 'cash',
  'Chile Tickets': 'chile_tickets',
  'Antonia': 'antonia',
  'Honey Moon': 'honey_moon'
};

function goalKey(goalName) {
  if (!goalName) return '';
  if (GOAL_KEY_MAP[goalName]) return GOAL_KEY_MAP[goalName];
  return goalName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

// Subtype inference from Glosario
function inferSubtype(glosario) {
  if (!glosario) return 'otro';
  var g = glosario.toLowerCase();
  if (g.includes('etf')) return 'etf';
  if (g.includes('acciones') || g.includes('stock')) return 'acciones';
  if (g.includes('crypto') || g.includes('btc') || g.includes('eth')) return 'crypto';
  if (g.includes('money market') || g.includes('billetera')) return 'money_market';
  if (g.includes('fondos mutuos') || g.includes('fondo mutuo')) return 'fondo_mutuo';
  if (g.includes('real state') || g.includes('real estate')) return 'real_estate';
  if (g.includes('apv')) return 'apv';
  if (g.includes('cash')) return 'cash';
  return 'otro';
}

// Account -> Goal map
var acctGoal = {};
rawAcctGoalMap.forEach(function(row) {
  if (row.Account && row.Goal) {
    acctGoal[row.Account.trim()] = row.Goal;
  }
});

// Group snapshots by account
var invSnapByAcct = {};
rawInvSnap.forEach(function(row) {
  if (!row.Snapshot_Date || !row.Account) return;
  var acct = row.Account.trim();
  if (!invSnapByAcct[acct]) invSnapByAcct[acct] = [];
  invSnapByAcct[acct].push(row);
});

var investments = [];
var investmentIdByName = {};  // for linking to goals

rawInvLatest.forEach(function(row) {
  if (!row.Account || !row.Account.toString().trim()) return;
  var acctName = row.Account.trim();
  var invId = 'inv_' + sanitize(acctName);
  investmentIdByName[acctName] = invId;

  // Build balance history from snapshots
  var snaps = invSnapByAcct[acctName] || [];
  snaps.sort(function(a, b) { return (a.Snapshot_Date || 0) - (b.Snapshot_Date || 0); });

  var balanceHistory = snaps.map(function(s, idx) {
    return {
      id: 'bh_' + uuid(),
      date: serialToDate(s.Snapshot_Date),
      balance: typeof s.Value === 'number' ? s.Value : 0,
      note: '',
      type: idx === 0 ? 'initial' : 'manual',
      createdAt: serialToISO(s.Snapshot_Date) || new Date().toISOString()
    };
  });

  var goalName = acctGoal[acctName] || row.Goal || '';

  var currentVal = typeof row.Value === 'number' ? row.Value : 0;
  investments.push({
    id: invId,
    name: acctName,
    goal: goalKey(goalName),
    subtype: inferSubtype(row.Glosario),
    currency: row.Currency || 'CLP',
    currentValue: currentVal,
    currentBalance: currentVal,
    isLiquid: row.Liquid === 'Yes' || row.Liquid === true,
    balanceHistory: balanceHistory,
    createdAt: snaps.length > 0 ? (serialToISO(snaps[0].Snapshot_Date) || new Date().toISOString()) : new Date().toISOString()
  });
});

// ---------------------------------------------------------------------------
// 4. DEBTS
// ---------------------------------------------------------------------------
var rawDebtsLatest = readSheet('Debts_Latest');
var rawDebtsSnap = readSheet('Debts_Snap');

function inferDebtType(name) {
  var n = (name || '').toLowerCase();
  if (n.includes('mortgage') || n.includes('hipoteca')) return 'mortgage';
  if (n.includes('cae')) return 'student';
  return 'other';
}

// Group debt snapshots by debt name
var debtSnapByName = {};
rawDebtsSnap.forEach(function(row) {
  if (!row.Date || !row.Debt) return;
  var name = row.Debt.trim();
  if (!debtSnapByName[name]) debtSnapByName[name] = [];
  debtSnapByName[name].push(row);
});

var debts = [];

rawDebtsLatest.forEach(function(row) {
  if (!row.Debt || !row.Debt.toString().trim()) return;
  var debtRaw = row.Debt.trim();
  var parsed = splitEmoji(debtRaw);
  var debtName = parsed.text || debtRaw;
  var debtId = 'debt_' + sanitize(debtName);

  // Find snapshots - try exact match, then stripped match
  var snaps = debtSnapByName[debtRaw] || [];
  if (snaps.length === 0) {
    // Try matching by stripped emoji name
    Object.keys(debtSnapByName).forEach(function(key) {
      var kParsed = splitEmoji(key);
      if (kParsed.text.toLowerCase() === debtName.toLowerCase() && debtSnapByName[key].length > 0) {
        snaps = debtSnapByName[key];
      }
    });
  }
  snaps.sort(function(a, b) { return (a.Date || 0) - (b.Date || 0); });

  var balanceHistory = snaps.map(function(s, idx) {
    return {
      id: 'bh_' + uuid(),
      date: serialToDate(s.Date),
      balance: typeof s.Outstanding === 'number' ? s.Outstanding : 0,
      note: '',
      type: idx === 0 ? 'initial' : 'manual',
      createdAt: serialToISO(s.Date) || new Date().toISOString()
    };
  });

  debts.push({
    id: debtId,
    name: debtName,
    type: inferDebtType(debtName),
    originalAmount: snaps.length > 0 ? (snaps[0].Outstanding || 0) : (row.Outstanding || 0),
    currentBalance: typeof row.Outstanding === 'number' ? row.Outstanding : 0,
    currency: row.Currency || 'CLP',
    interestRate: 0,
    minimumPayment: 0,
    dueDay: 1,
    balanceHistory: balanceHistory,
    createdAt: snaps.length > 0 ? (serialToISO(snaps[0].Date) || new Date().toISOString()) : new Date().toISOString()
  });
});

// ---------------------------------------------------------------------------
// 5. SAVINGS GOALS
// ---------------------------------------------------------------------------
var rawGoals = readSheet('Goals');

var savingsGoals = [];

rawGoals.forEach(function(row) {
  if (!row.Goal || !row.Goal.toString().trim()) return;
  var goalName = row.Goal.trim();
  var gk = goalKey(goalName);
  var goalId = 'goal_' + sanitize(goalName);

  // Find linked investment ids via Acct_Goal_Map
  var linkedPlatforms = [];
  rawAcctGoalMap.forEach(function(m) {
    if (m.Goal && m.Goal.trim() === goalName && m.Account) {
      var invId = investmentIdByName[m.Account.trim()];
      if (invId) linkedPlatforms.push(invId);
    }
  });

  // currentAmount: use Saved EUR
  var currentAmount = typeof row['Saved EUR'] === 'number' ? row['Saved EUR'] : 0;

  var goalObj = {
    id: goalId,
    name: goalName,
    targetAmount: typeof row['Target Amt'] === 'number' ? row['Target Amt'] : 0,
    currentAmount: currentAmount,
    currency: row.Currency || 'EUR',
    icon: '',
    targetDate: serialToDate(row['Target Date']) || '',
    linkedPlatforms: linkedPlatforms,
    createdAt: new Date().toISOString()
  };
  // Mark emergency fund goal
  if (gk === 'emergency') {
    goalObj.isEmergencyFund = true;
  }
  savingsGoals.push(goalObj);
});

// ---------------------------------------------------------------------------
// 6. MONTHLY BUDGETS
// ---------------------------------------------------------------------------
var rawBudgets = readSheet('Budgets');
var monthlyBudgets = {};

rawBudgets.forEach(function(row) {
  if (!row.Month || !row.Subcategory) return;
  var ym = serialToYearMonth(row.Month);
  if (!ym) return;

  var catId = findCategoryId(row.Subcategory);
  // Use Budget_EUR (pre-converted) for consistent EUR totals
  var budgetAmt = typeof row.Budget_EUR === 'number' ? row.Budget_EUR : (typeof row.Budget === 'number' ? row.Budget : 0);
  var currency = row.Currency || 'EUR';

  if (!monthlyBudgets[ym]) monthlyBudgets[ym] = {};
  monthlyBudgets[ym][catId] = {
    budget: budgetAmt,
    currency: currency,
    spent: 0
  };
});

// ---------------------------------------------------------------------------
// YNAB CONFIG — derive monthly income from income category budgets
// ---------------------------------------------------------------------------
var incomeCatIds = new Set(categories.filter(function(c) { return c.type === 'income'; }).map(function(c) { return c.id; }));
// Use the most recent month that has income budgets
var sortedMonths = Object.keys(monthlyBudgets).sort();
var latestMonthWithIncome = null;
var totalMonthlyIncome = 0;
for (var mi = sortedMonths.length - 1; mi >= 0; mi--) {
  var mKey = sortedMonths[mi];
  var mIncome = 0;
  incomeCatIds.forEach(function(catId) {
    if (monthlyBudgets[mKey] && monthlyBudgets[mKey][catId]) {
      mIncome += monthlyBudgets[mKey][catId].budget || 0;
    }
  });
  if (mIncome > 0) {
    totalMonthlyIncome = mIncome;
    latestMonthWithIncome = mKey;
    break;
  }
}
var ynabConfig = {
  monthlyIncome: Math.round(totalMonthlyIncome * 100) / 100,
  currency: 'EUR'
};
console.log('ynabConfig: monthlyIncome=' + ynabConfig.monthlyIncome + ' EUR (from ' + (latestMonthWithIncome || 'none') + ')');

// ---------------------------------------------------------------------------
// OUTPUT
// ---------------------------------------------------------------------------
var output = {
  _version: 'finanzas-pro-v5',
  categories: categories,
  transactions: transactions,
  investments: investments,
  debts: debts,
  savingsGoals: savingsGoals,
  monthlyBudgets: monthlyBudgets,
  ynabConfig: ynabConfig
};

fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8');

// ---------------------------------------------------------------------------
// SUMMARY
// ---------------------------------------------------------------------------
console.log('\n========== IMPORT SUMMARY ==========');
console.log('Output: ' + outPath);
console.log('Categories:      ' + categories.length);
console.log('Transactions:    ' + transactions.length);

if (transactions.length > 0) {
  var txDates = transactions.map(function(t) { return t.date; }).sort();
  console.log('  Date range:    ' + txDates[0] + ' to ' + txDates[txDates.length - 1]);
}

console.log('Investments:     ' + investments.length);
var totalBH = investments.reduce(function(s, i) { return s + i.balanceHistory.length; }, 0);
console.log('  Snapshots:     ' + totalBH);

console.log('Debts:           ' + debts.length);
var totalDH = debts.reduce(function(s, d) { return s + d.balanceHistory.length; }, 0);
console.log('  Snapshots:     ' + totalDH);

console.log('Savings Goals:   ' + savingsGoals.length);
console.log('Monthly Budgets: ' + Object.keys(monthlyBudgets).length + ' months');
if (Object.keys(monthlyBudgets).length > 0) {
  var bmKeys = Object.keys(monthlyBudgets).sort();
  console.log('  Range:         ' + bmKeys[0] + ' to ' + bmKeys[bmKeys.length - 1]);
  var totalEntries = bmKeys.reduce(function(s, k) { return s + Object.keys(monthlyBudgets[k]).length; }, 0);
  console.log('  Budget entries: ' + totalEntries);
}

// Dedupe warnings
var uniqueWarnings = [];
var seenWarn = {};
warnings.forEach(function(w) {
  if (!seenWarn[w]) { uniqueWarnings.push(w); seenWarn[w] = true; }
});

if (uniqueWarnings.length > 0) {
  console.log('\nWARNINGS (' + uniqueWarnings.length + '):');
  uniqueWarnings.forEach(function(w) { console.log('  - ' + w); });
}

console.log('\nDone.');
