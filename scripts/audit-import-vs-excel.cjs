// Compare Excel source data vs imported JSON
const XLSX = require('xlsx');
const wb = XLSX.readFile('C:/Users/ksaud/Downloads/Budget 2.0-08.03.2026.xlsx');
const imp = require('./finanzas-backup-import.json');

const toDate = d => typeof d === 'number' ? new Date(Date.UTC(1899, 11, 30) + d * 86400000) : new Date(d);
const toYM = d => toDate(d).toISOString().slice(0, 7);
const round2 = n => Math.round(n * 100) / 100;

console.log('══════════════════════════════════════════════════════');
console.log('  AUDIT: Excel vs Imported JSON');
console.log('══════════════════════════════════════════════════════\n');

// ─── 1. CATEGORIES ───
console.log('--- CATEGORIES ---');
const excelCats = XLSX.utils.sheet_to_json(wb.Sheets['Categories']).filter(c => c.Subcategory);
console.log(`  Excel subcategories: ${excelCats.length}`);
console.log(`  JSON categories: ${imp.categories.length}`);

// Check each excel subcategory has a matching JSON category
const jsonCatNames = new Set(imp.categories.map(c => c.name));
const jsonCatGroups = new Set(imp.categories.map(c => c.group));
const missingInJson = excelCats.filter(c => {
  const name = (c.Subcategory || '').replace(/[\u{1F300}-\u{1FFFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{200D}\u{FE0F}\u{20E3}]/gu, '').trim();
  return !jsonCatNames.has(name);
});
if (missingInJson.length) {
  console.log(`  ⚠ Excel subcategories NOT in JSON:`);
  missingInJson.forEach(c => console.log(`    - ${c.Subcategory}`));
}

// ─── 2. TRANSACTIONS ───
console.log('\n--- TRANSACTIONS ---');
const excelTx = XLSX.utils.sheet_to_json(wb.Sheets['Transactions'], {header: 1, defval: ''});
const excelTxData = excelTx.slice(1).filter(r => r.some(c => c !== ''));
console.log(`  Excel: ${excelTxData.length}`);
console.log(`  JSON: ${imp.transactions.length}`);

// Compare totals by month
const excelMonthTotals = {};
excelTxData.forEach(r => {
  // [Timestamp, Date, Type, Category, Subcategory, Description, Currency, Amount, Amount_EUR, Amount_CLP]
  const month = toYM(r[1]);
  const amtEUR = r[8] || 0; // Amount_EUR
  const type = r[2] || '';
  if (!excelMonthTotals[month]) excelMonthTotals[month] = { income: 0, expense: 0, count: 0 };
  excelMonthTotals[month].count++;
  if (type === 'Income') excelMonthTotals[month].income += amtEUR;
  else excelMonthTotals[month].expense += amtEUR;
});

const jsonMonthTotals = {};
imp.transactions.forEach(t => {
  const month = t.date.slice(0, 7);
  if (!jsonMonthTotals[month]) jsonMonthTotals[month] = { income: 0, expense: 0, count: 0 };
  jsonMonthTotals[month].count++;
  // JSON has amount in original currency, not EUR
  // We can't directly compare EUR totals without conversion
});

console.log('\n  Monthly transaction counts (Excel vs JSON):');
const allMonths = [...new Set([...Object.keys(excelMonthTotals), ...Object.keys(jsonMonthTotals)])].sort();
let countMismatch = 0;
allMonths.forEach(m => {
  const e = excelMonthTotals[m] || { count: 0 };
  const j = jsonMonthTotals[m] || { count: 0 };
  const match = e.count === j.count ? '✓' : '⚠';
  if (e.count !== j.count) countMismatch++;
  console.log(`    ${m}: Excel=${e.count} JSON=${j.count} ${match}`);
});

// Compare EUR income/expense totals from Excel
console.log('\n  Excel monthly EUR totals (from Amount_EUR column):');
allMonths.forEach(m => {
  const e = excelMonthTotals[m] || { income: 0, expense: 0 };
  console.log(`    ${m}: Income=${round2(e.income)} Expense=${round2(e.expense)} Net=${round2(e.income - e.expense)}`);
});

// ─── 3. BUDGETS ───
console.log('\n--- BUDGETS ---');
const excelBudgets = XLSX.utils.sheet_to_json(wb.Sheets['Budgets']).filter(b => b.Month);
const excelBudgetMonths = {};
excelBudgets.forEach(b => {
  const month = toYM(b.Month);
  if (!excelBudgetMonths[month]) excelBudgetMonths[month] = { count: 0, totalEUR: 0, nonZero: 0, entries: [] };
  excelBudgetMonths[month].count++;
  const val = b.Budget_EUR || 0;
  excelBudgetMonths[month].totalEUR += val;
  if (val > 0) excelBudgetMonths[month].nonZero++;
  if (val > 0) excelBudgetMonths[month].entries.push({ cat: b.Subcategory, val: round2(val), cur: b.Currency });
});

const jsonBudgetMonths = {};
Object.entries(imp.monthlyBudgets).forEach(([month, cats]) => {
  jsonBudgetMonths[month] = { count: 0, totalEUR: 0, nonZero: 0, entries: [] };
  Object.entries(cats).forEach(([catId, data]) => {
    jsonBudgetMonths[month].count++;
    const val = data.budget || 0;
    jsonBudgetMonths[month].totalEUR += val;
    if (val > 0) {
      jsonBudgetMonths[month].nonZero++;
      jsonBudgetMonths[month].entries.push({ catId, val: round2(val), cur: data.currency });
    }
  });
});

console.log('  Monthly budget comparison (EUR totals):');
const budgetMonths = [...new Set([...Object.keys(excelBudgetMonths), ...Object.keys(jsonBudgetMonths)])].sort();
budgetMonths.forEach(m => {
  const e = excelBudgetMonths[m] || { totalEUR: 0, nonZero: 0 };
  const j = jsonBudgetMonths[m] || { totalEUR: 0, nonZero: 0 };
  const diff = round2(j.totalEUR - e.totalEUR);
  const match = Math.abs(diff) < 1 ? '✓' : `⚠ diff=${diff}`;
  console.log(`    ${m}: Excel=${round2(e.totalEUR)} (${e.nonZero} cats) | JSON=${round2(j.totalEUR)} (${j.nonZero} cats) ${match}`);
});

// Detailed budget comparison for latest month
const latestBudgetMonth = budgetMonths.filter(m => excelBudgetMonths[m] && jsonBudgetMonths[m]).pop();
if (latestBudgetMonth) {
  console.log(`\n  Detailed budget for ${latestBudgetMonth}:`);
  const excelEntries = (excelBudgetMonths[latestBudgetMonth] || {}).entries || [];
  const jsonEntries = (jsonBudgetMonths[latestBudgetMonth] || {}).entries || [];

  // Map json catId to name
  const catIdToName = {};
  imp.categories.forEach(c => { catIdToName[c.id] = c.name; });

  console.log('    Excel budget entries:');
  excelEntries.sort((a,b) => b.val - a.val).forEach(e => {
    console.log(`      ${e.cat}: ${e.val} ${e.cur}`);
  });
  console.log('    JSON budget entries:');
  jsonEntries.sort((a,b) => b.val - a.val).forEach(e => {
    console.log(`      ${catIdToName[e.catId] || e.catId}: ${e.val} ${e.cur}`);
  });
}

// ─── 4. INVESTMENTS ───
console.log('\n--- INVESTMENTS ---');
const excelInv = XLSX.utils.sheet_to_json(wb.Sheets['Investments_Latest']).filter(i => i.Account);
console.log(`  Excel: ${excelInv.length}`);
console.log(`  JSON: ${imp.investments.length}`);

console.log('\n  Investment comparison:');
excelInv.forEach(ei => {
  const ji = imp.investments.find(j => j.name === ei.Account);
  if (!ji) {
    console.log(`    ⚠ ${ei.Account}: in Excel but NOT in JSON`);
    return;
  }
  const excelVal = ei.Value || 0;
  const jsonVal = ji.currentValue || 0;
  const diff = round2(jsonVal - excelVal);
  const match = Math.abs(diff) < 1 ? '✓' : `⚠ diff=${diff}`;
  console.log(`    ${ei.Account}: Excel=${excelVal} ${ei.Currency} | JSON=${jsonVal} ${ji.currency} ${match}`);

  // Check balance history
  const snapCount = (ji.balanceHistory || []).length;
  console.log(`      Snapshots: ${snapCount} | Liquid: Excel=${ei.Liquid} JSON=${ji.isLiquid}`);
});

// Check for investments in JSON but not Excel
imp.investments.forEach(ji => {
  const ei = excelInv.find(e => e.Account === ji.name);
  if (!ei) console.log(`    ⚠ ${ji.name}: in JSON but NOT in Excel`);
});

// ─── 5. DEBTS ───
console.log('\n--- DEBTS ---');
const excelDebts = XLSX.utils.sheet_to_json(wb.Sheets['Debts_Latest']).filter(d => d.Debt);
console.log(`  Excel: ${excelDebts.length}`);
console.log(`  JSON: ${imp.debts.length}`);

excelDebts.forEach(ed => {
  const jd = imp.debts.find(j => j.name === ed.Debt || j.name === ed.Debt.replace(/[\u{1F300}-\u{1FFFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{200D}\u{FE0F}]/gu, '').trim());
  if (!jd) {
    console.log(`    ⚠ ${ed.Debt}: in Excel but NOT in JSON`);
    return;
  }
  const excelBal = ed.Outstanding || 0;
  const jsonBal = jd.currentBalance || 0;
  const diff = round2(jsonBal - excelBal);
  const match = Math.abs(diff) < 1 ? '✓' : `⚠ diff=${diff}`;
  console.log(`    ${ed.Debt}: Excel=${excelBal} ${ed.Currency} | JSON=${jsonBal} ${jd.currency} ${match}`);
});

// ─── 6. GOALS ───
console.log('\n--- GOALS ---');
const excelGoals = XLSX.utils.sheet_to_json(wb.Sheets['Goals']).filter(g => g.Goal);
console.log(`  Excel: ${excelGoals.length}`);
console.log(`  JSON: ${imp.savingsGoals.length}`);

excelGoals.forEach(eg => {
  const jg = imp.savingsGoals.find(g => g.name === eg.Goal);
  if (!jg) {
    console.log(`    ⚠ ${eg.Goal}: in Excel but NOT in JSON`);
    return;
  }
  const targetMatch = jg.targetAmount === eg['Target Amt'] ? '✓' : `⚠ Excel=${eg['Target Amt']} JSON=${jg.targetAmount}`;
  console.log(`    ${eg.Goal}: target=${jg.targetAmount} ${jg.currency} ${targetMatch} | linked=${(jg.linkedPlatforms||[]).length} platforms`);
});

// ─── 7. ACCT_GOAL_MAP vs JSON linkedPlatforms ───
console.log('\n--- GOAL-PLATFORM LINKS ---');
const goalMap = XLSX.utils.sheet_to_json(wb.Sheets['Acct_Goal_Map']);
const goalNameToId = {};
imp.savingsGoals.forEach(g => { goalNameToId[g.name] = g.id; });

// Group by goal
const excelLinks = {};
goalMap.forEach(m => {
  if (!excelLinks[m.Goal]) excelLinks[m.Goal] = [];
  excelLinks[m.Goal].push(m.Account);
});

Object.entries(excelLinks).forEach(([goalName, accounts]) => {
  const jg = imp.savingsGoals.find(g => g.name === goalName);
  if (!jg) {
    console.log(`  ⚠ Goal "${goalName}" not in JSON`);
    return;
  }
  const jsonLinked = jg.linkedPlatforms || [];
  const jsonLinkedNames = jsonLinked.map(id => {
    const inv = imp.investments.find(i => i.id === id);
    return inv ? inv.name : id;
  });

  const missing = accounts.filter(a => !jsonLinkedNames.includes(a));
  const extra = jsonLinkedNames.filter(n => !accounts.includes(n));

  const status = (missing.length === 0 && extra.length === 0) ? '✓' : '⚠';
  console.log(`  ${goalName}: Excel=[${accounts.join(', ')}] JSON=[${jsonLinkedNames.join(', ')}] ${status}`);
  if (missing.length) console.log(`    Missing in JSON: ${missing.join(', ')}`);
  if (extra.length) console.log(`    Extra in JSON: ${extra.join(', ')}`);
});

// ─── 8. OVERALL TOTALS ───
console.log('\n--- OVERALL EUR TOTALS (from Excel Amount_EUR) ---');
let totalIncomeEUR = 0, totalExpenseEUR = 0;
excelTxData.forEach(r => {
  const amtEUR = r[8] || 0;
  if (r[2] === 'Income') totalIncomeEUR += amtEUR;
  else totalExpenseEUR += amtEUR;
});
console.log(`  Total Income (EUR): ${round2(totalIncomeEUR)}`);
console.log(`  Total Expense (EUR): ${round2(totalExpenseEUR)}`);
console.log(`  Net (EUR): ${round2(totalIncomeEUR - totalExpenseEUR)}`);

// JSON totals (in original currencies - can't compare directly)
let jsonEURIncome = 0, jsonEURExpense = 0;
let jsonCLPIncome = 0, jsonCLPExpense = 0;
imp.transactions.forEach(t => {
  const cat = imp.categories.find(c => c.id === t.categoryId);
  const isIncome = cat && cat.type === 'income';
  if (t.currency === 'EUR') {
    if (isIncome) jsonEURIncome += t.amount;
    else jsonEURExpense += t.amount;
  } else if (t.currency === 'CLP') {
    if (isIncome) jsonCLPIncome += t.amount;
    else jsonCLPExpense += t.amount;
  }
});
console.log(`\n  JSON EUR transactions: Income=${round2(jsonEURIncome)} Expense=${round2(jsonEURExpense)}`);
console.log(`  JSON CLP transactions: Income=${round2(jsonCLPIncome)} Expense=${round2(jsonCLPExpense)}`);

console.log('\n══════════════════════════════════════════════════════');
console.log('  END AUDIT');
console.log('══════════════════════════════════════════════════════');
