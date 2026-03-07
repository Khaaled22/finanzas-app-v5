const data = require('./import-data.json');

// Categories
console.log('=== Sample Categories ===');
data.finanzas_categories.slice(0, 5).forEach(c =>
  console.log(c.id, '|', c.name, '|', c.group, '|', c.currency, '|', c.flowKind)
);
console.log('... total:', data.finanzas_categories.length);

// Orphan transactions
const catIds = new Set(data.finanzas_categories.map(c => c.id));
const orphanTx = data.finanzas_transactions.filter(t => t.categoryId && !catIds.has(t.categoryId));
console.log('\nOrphan transactions (bad categoryId):', orphanTx.length);

const nullCatTx = data.finanzas_transactions.filter(t => !t.categoryId);
console.log('Transactions with null categoryId:', nullCatTx.length);
if (nullCatTx.length > 0) {
  nullCatTx.slice(0, 5).forEach(t =>
    console.log('  -', t.date, '|', t.amount, t.currency, '|', JSON.stringify(t.description))
  );
}

// Income overrides
console.log('\n=== Income Overrides (EUR) ===');
const cfg = data.finanzas_ynabConfig;
Object.entries(cfg.monthlyIncomeOverrides).sort().forEach(function(entry) {
  console.log(entry[0], Math.round(entry[1]));
});
console.log('Average:', cfg.monthlyIncome);

// Platforms
console.log('\n=== Platforms ===');
data.finanzas_investments.forEach(p =>
  console.log(p.name, '|', p.currency, '|', p.currentBalance, p.isArchived ? '| ARCHIVED' : '', '| history:', p.balanceHistory.length)
);

// Debts
console.log('\n=== Debts ===');
data.finanzas_debts.forEach(d =>
  console.log(d.name, '|', d.currency, '|', d.currentBalance, d.isToxic ? '| TOXIC' : '', '| history:', d.balanceHistory.length)
);

// Goals
console.log('\n=== Goals ===');
data.finanzas_savingsGoals.forEach(g =>
  console.log(g.name, '|', g.targetAmount, g.currency, '| linked:', g.linkedPlatforms.length)
);

// Budget months
console.log('\n=== Budget Months ===');
Object.keys(data.finanzas_monthlyBudgets).sort().forEach(function(m) {
  var cats = Object.keys(data.finanzas_monthlyBudgets[m]).length;
  console.log(m, ':', cats, 'categories');
});
