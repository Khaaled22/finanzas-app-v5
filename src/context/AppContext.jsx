// src/context/AppContext.jsx
// ✅ M26: Contexto raíz que compone todos los sub-contextos
// ✅ Mantiene useApp() backward compatible
import React, { createContext, useContext, useState, useMemo } from 'react';

// Sub-contextos
import { TransactionsProvider, useTransactions } from './TransactionsContext';
import { ExchangeRatesProvider, useExchangeRates } from './ExchangeRatesContext';
import { BudgetProvider, useBudget } from './BudgetContext';
import { InvestmentsProvider, useInvestments } from './InvestmentsContext';
import { DebtsProvider, useDebts } from './DebtsContext';

// Engine para cálculos
import { AnalysisEngine } from '../domain/engines/AnalysisEngine';

const AppContext = createContext();

/**
 * ✅ M26: Hook principal - mantiene API backward compatible
 * Combina todos los sub-contextos en una interfaz unificada
 */
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe usarse dentro de AppProvider');
  }
  return context;
};

/**
 * ✅ M26: Componente interno que tiene acceso a todos los sub-contextos
 */
function AppContextComposer({ children }) {
  // Estados locales del compositor
  const [currentUser, setCurrentUser] = useState('Usuario 1');
  const [displayCurrency, setDisplayCurrency] = useState('EUR');

  // Obtener valores de sub-contextos
  const transactionsCtx = useTransactions();
  const ratesCtx = useExchangeRates();
  const budgetCtx = useBudget();
  const investmentsCtx = useInvestments();
  const debtsCtx = useDebts();

  // ✅ Calcular totales
  const totals = useMemo(() => {
    const budgeted = budgetCtx.categoriesWithMonthlyBudget.reduce((sum, cat) => 
      sum + (cat.budgetInDisplayCurrency || 0), 0);
    
    const spent = budgetCtx.categoriesWithMonthlyBudget.reduce((sum, cat) => 
      sum + (cat.spentInDisplayCurrency || 0), 0);
    
    const available = budgeted - spent;
    
    const totalDebt = debtsCtx.debts.reduce((sum, debt) => 
      sum + ratesCtx.convertCurrency(debt.currentBalance, debt.currency, displayCurrency), 0);
    
    const totalSavings = investmentsCtx.savingsGoals.reduce((sum, goal) => 
      sum + ratesCtx.convertCurrency(goal.currentAmount, goal.currency, displayCurrency), 0);
    
    const totalInvestments = investmentsCtx.investments.reduce((sum, inv) => {
      let value;
      if (inv.currentBalance !== undefined) {
        value = inv.currentBalance;
      } else if (inv.quantity && inv.currentPrice) {
        value = inv.quantity * inv.currentPrice;
      } else {
        value = 0;
      }
      return sum + ratesCtx.convertCurrency(value, inv.currency, displayCurrency);
    }, 0);
    
    return { budgeted, spent, available, totalDebt, totalSavings, totalInvestments };
  }, [
    budgetCtx.categoriesWithMonthlyBudget, 
    debtsCtx.debts, 
    investmentsCtx.savingsGoals, 
    investmentsCtx.investments, 
    displayCurrency, 
    ratesCtx.convertCurrency
  ]);

  // ✅ Calcular salud financiera
  const financialHealth = useMemo(() => {
    return AnalysisEngine.calculateFinancialHealth(
      {
        totals,
        debts: debtsCtx.debts,
        savingsGoals: investmentsCtx.savingsGoals,
        investments: investmentsCtx.investments,
        categories: budgetCtx.categories,
        transactions: transactionsCtx.transactions,
        ynabConfig: budgetCtx.ynabConfig
      },
      ratesCtx.convertCurrency,
      displayCurrency
    );
  }, [
    totals, 
    debtsCtx.debts, 
    investmentsCtx.savingsGoals, 
    investmentsCtx.investments, 
    budgetCtx.categories, 
    transactionsCtx.transactions, 
    budgetCtx.ynabConfig,
    ratesCtx.convertCurrency,
    displayCurrency
  ]);

  // ✅ Componer valor del contexto (API unificada backward compatible)
  const value = useMemo(() => ({
    // === Estados globales ===
    currentUser,
    setCurrentUser,
    displayCurrency,
    setDisplayCurrency,
    
    // === Cálculos ===
    totals,
    financialHealth,
    
    // === Transacciones (de TransactionsContext) ===
    transactions: transactionsCtx.transactions,
    setTransactions: transactionsCtx.setTransactions,
    addTransaction: transactionsCtx.addTransaction,
    addTransactionsBatch: transactionsCtx.addTransactionsBatch,
    updateTransaction: transactionsCtx.updateTransaction,
    deleteTransaction: transactionsCtx.deleteTransaction,
    clearAllTransactions: transactionsCtx.clearAllTransactions,
    // M25: Funciones optimizadas
    transactionIndex: transactionsCtx.transactionIndex,
    getTransactionsByMonth: transactionsCtx.getTransactionsByMonth,
    getTransactionsByCategoryAndMonth: transactionsCtx.getTransactionsByCategoryAndMonth,
    
    // === Tasas de cambio (de ExchangeRatesContext) ===
    exchangeRates: ratesCtx.exchangeRates,
    setExchangeRates: ratesCtx.setExchangeRates,
    autoUpdateConfig: ratesCtx.autoUpdateConfig,
    setAutoUpdateEnabled: ratesCtx.setAutoUpdateEnabled,
    setUpdateInterval: ratesCtx.setUpdateInterval,
    getRateForDate: ratesCtx.getRateForDate,
    convertCurrency: ratesCtx.convertCurrency,
    convertCurrencyAtDate: ratesCtx.convertCurrencyAtDate,
    updateExchangeRates: ratesCtx.updateExchangeRates,
    importHistoricalRates: ratesCtx.importHistoricalRates,
    fetchExchangeRates: ratesCtx.fetchExchangeRates,
    
    // === Presupuestos (de BudgetContext) ===
    categories: budgetCtx.categories,
    setCategories: budgetCtx.setCategories,
    monthlyBudgets: budgetCtx.monthlyBudgets,
    setMonthlyBudgets: budgetCtx.setMonthlyBudgets,
    selectedBudgetMonth: budgetCtx.selectedBudgetMonth,
    setSelectedBudgetMonth: budgetCtx.setSelectedBudgetMonth,
    ynabConfig: budgetCtx.ynabConfig,
    setYnabConfig: budgetCtx.setYnabConfig,
    categoriesWithMonthlyBudget: budgetCtx.categoriesWithMonthlyBudget,
    getCategoryBudgetForMonth: budgetCtx.getCategoryBudgetForMonth,
    getCategorySpentForMonth: budgetCtx.getCategorySpentForMonth,
    initializeCategoryForMonth: budgetCtx.initializeCategoryForMonth,
    updateMonthlyBudget: budgetCtx.updateMonthlyBudget,
    copyBudgetFromPreviousMonth: budgetCtx.copyBudgetFromPreviousMonth,
    clearMonthlyBudgets: budgetCtx.clearMonthlyBudgets,
    transferBetweenCategories: budgetCtx.transferBetweenCategories,
    updateCategory: budgetCtx.updateCategory,
    deleteCategory: budgetCtx.deleteCategory,
    importCategories: budgetCtx.importCategories,
    
    // === Inversiones y Ahorros (de InvestmentsContext) ===
    investments: investmentsCtx.investments,
    setInvestments: investmentsCtx.setInvestments,
    savingsGoals: investmentsCtx.savingsGoals,
    setSavingsGoals: investmentsCtx.setSavingsGoals,
    addInvestment: investmentsCtx.addInvestment,
    updateInvestment: investmentsCtx.updateInvestment,
    deleteInvestment: investmentsCtx.deleteInvestment,
    savePlatform: investmentsCtx.savePlatform,
    addHoldingToPlatform: investmentsCtx.addHoldingToPlatform,
    updateHoldingInPlatform: investmentsCtx.updateHoldingInPlatform,
    deleteHoldingFromPlatform: investmentsCtx.deleteHoldingFromPlatform,
    addBalanceHistory: investmentsCtx.addBalanceHistory,
    updateBalanceHistory: investmentsCtx.updateBalanceHistory,
    addBalanceEntry: investmentsCtx.addBalanceEntry,
    deleteBalanceEntry: investmentsCtx.deleteBalanceEntry,
    addSavingsGoal: investmentsCtx.addSavingsGoal,
    updateSavingsGoal: investmentsCtx.updateSavingsGoal,
    deleteSavingsGoal: investmentsCtx.deleteSavingsGoal,
    registerSavingsContribution: investmentsCtx.registerSavingsContribution,
    updateLinkedSavingsGoals: investmentsCtx.updateLinkedSavingsGoals,
    
    // === Deudas (de DebtsContext) ===
    debts: debtsCtx.debts,
    setDebts: debtsCtx.setDebts,
    addDebt: debtsCtx.addDebt,
    updateDebt: debtsCtx.updateDebt,
    deleteDebt: debtsCtx.deleteDebt,
    registerDebtPayment: debtsCtx.registerDebtPayment
  }), [
    currentUser,
    displayCurrency,
    totals,
    financialHealth,
    transactionsCtx,
    ratesCtx,
    budgetCtx,
    investmentsCtx,
    debtsCtx
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

/**
 * ✅ M26: Provider raíz que anida todos los sub-providers
 */
export function AppProvider({ children }) {
  const [currentUser] = useState('Usuario 1');
  const [displayCurrency, setDisplayCurrency] = useState('EUR');

  return (
    <DebtsProvider>
      <InvestmentsProvider>
        <ExchangeRatesProvider currentUser={currentUser}>
          <TransactionsProvider currentUser={currentUser}>
            <BudgetProviderWrapper displayCurrency={displayCurrency}>
              <AppContextComposer>
                {children}
              </AppContextComposer>
            </BudgetProviderWrapper>
          </TransactionsProvider>
        </ExchangeRatesProvider>
      </InvestmentsProvider>
    </DebtsProvider>
  );
}

/**
 * ✅ M26: Wrapper para BudgetProvider que inyecta dependencias
 */
function BudgetProviderWrapper({ children, displayCurrency }) {
  const { transactions, getTransactionsByCategoryAndMonth } = useTransactions();
  const { convertCurrency, convertCurrencyAtDate } = useExchangeRates();

  return (
    <BudgetProvider
      transactions={transactions}
      convertCurrency={convertCurrency}
      convertCurrencyAtDate={convertCurrencyAtDate}
      displayCurrency={displayCurrency}
      getTransactionsByCategoryAndMonth={getTransactionsByCategoryAndMonth}
    >
      {children}
    </BudgetProvider>
  );
}

// ✅ Exportar hooks individuales para acceso directo a sub-contextos
export { useTransactions } from './TransactionsContext';
export { useExchangeRates } from './ExchangeRatesContext';
export { useBudget } from './BudgetContext';
export { useInvestments } from './InvestmentsContext';
export { useDebts } from './DebtsContext';