/**
 * Converts import-data.json → finanzas-pro-v5 backup format
 * Output can be imported via Settings > Preferences > Import Backup
 */
const fs = require('fs');
const path = require('path');

const data = require('./import-data.json');

const backup = {
  _version: 'finanzas-pro-v5',
  _exportedAt: new Date().toISOString(),
  _source: 'excel-import',
  categories: data.finanzas_categories,
  transactions: data.finanzas_transactions,
  monthlyBudgets: data.finanzas_monthlyBudgets,
  ynabConfig: data.finanzas_ynabConfig,
  investments: data.finanzas_investments,
  savingsGoals: data.finanzas_savingsGoals,
  debts: data.finanzas_debts
};

const outPath = path.join(__dirname, 'finanzas-backup-import.json');
fs.writeFileSync(outPath, JSON.stringify(backup, null, 2));

console.log('Backup file created:', outPath);
console.log('Categories:', backup.categories.length);
console.log('Transactions:', backup.transactions.length);
console.log('Monthly Budgets:', Object.keys(backup.monthlyBudgets).length, 'months');
console.log('Investments:', backup.investments.length);
console.log('Savings Goals:', backup.savingsGoals.length);
console.log('Debts:', backup.debts.length);
console.log('\nImport this file via Settings > Preferences > Import Backup');
