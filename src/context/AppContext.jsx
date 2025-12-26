// src/context/AppContext.jsx
// ✅ M36: Contexto raíz con cálculos separados por flowKind
// ✅ M36 Fase 4: Incluye funciones de balanceHistory para deudas
// - operatingSpent: solo gastos operativos
// - debtPaid: pagos de deuda
// - investmentContributed: aportes a inversión
// - availableOperational: disponible operativo (principal)

import React, { createContext, useContext, useState, useMemo } from 'react';

// Sub-contextos
import { TransactionsProvider, useTransactions } from './TransactionsContext';
import { ExchangeRatesProvider, useExchangeRates } from './ExchangeRatesContext';
import { BudgetProvider, useBudget } from './BudgetContext';
import { InvestmentsProvider, useInvestments, PLATFORM_GOALS, PLATFORM_SUBTYPES } from './InvestmentsContext';
import { DebtsProvider, useDebts } from './DebtsContext';

// Engine para cálculos
import { AnalysisEngine } from '../domain/engines/AnalysisEngine';

const AppContext = createContext();

// =====================================================
// HELPERS PARA CLASIFICACIÓN DE CATEGORÍAS
// =====================================================

/**
 * ✅ M36: Determina el flowKind de una categoría
 * Prioriza flowKind explícito, luego infiere de type/group
 */
const getFlowKind = (category) => {
  // Si tiene flowKind explícito, usarlo
  if (category.flowKind) return category.flowKind;
  
  // Inferir de type
  if (category.type === 'income') return 'INCOME';
  if (category.type === 'investment') return 'INVESTMENT_CONTRIBUTION';
  
  // Inferir de group/name para deudas
  const groupLower = (category.group || '').toLowerCase();
  const nameLower = (category.name || '').toLowerCase();
  
  if (groupLower.includes('debt') || groupLower.includes('deuda') || 
      groupLower.includes('loan') || groupLower.includes('préstamo') ||
      nameLower.includes('mortgage') || nameLower.includes('hipoteca') ||
      nameLower.includes('cae')) {
    return 'DEBT_PAYMENT';
  }
  
  // Default: gasto operativo
  return 'OPERATING_EXPENSE';
};

/**
 * ✅ M36: Funciones helper para filtrar categorías
 */
const isOperatingExpense = (cat) => getFlowKind(cat) === 'OPERATING_EXPENSE';
const isDebtPayment = (cat) => getFlowKind(cat) === 'DEBT_PAYMENT';
const isInvestmentContribution = (cat) => getFlowKind(cat) === 'INVESTMENT_CONTRIBUTION';
const isIncome = (cat) => getFlowKind(cat) === 'INCOME';

// =====================================================
// HOOK PRINCIPAL
// =====================================================

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe usarse dentro de AppProvider');
  }
  return context;
};

// =====================================================
// COMPONENTE COMPOSITOR
// =====================================================

function AppContextComposer({ children }) {
  const [currentUser, setCurrentUser] = useState('Usuario 1');
  const [displayCurrency, setDisplayCurrency] = useState('EUR');

  // Obtener valores de sub-contextos
  const transactionsCtx = useTransactions();
  const ratesCtx = useExchangeRates();
  const budgetCtx = useBudget();
  const investmentsCtx = useInvestments();
  const debtsCtx = useDebts();

  // =====================================================
  // ✅ M36: CÁLCULOS DE TOTALS MEJORADOS
  // =====================================================
  const totals = useMemo(() => {
    const categories = budgetCtx.categoriesWithMonthlyBudget;
    
    // --- PRESUPUESTADO por tipo ---
    const operatingBudgeted = categories
      .filter(isOperatingExpense)
      .reduce((sum, cat) => sum + (cat.budgetInDisplayCurrency || 0), 0);
    
    const debtBudgeted = categories
      .filter(isDebtPayment)
      .reduce((sum, cat) => sum + (cat.budgetInDisplayCurrency || 0), 0);
    
    const investmentBudgeted = categories
      .filter(isInvestmentContribution)
      .reduce((sum, cat) => sum + (cat.budgetInDisplayCurrency || 0), 0);
    
    // --- GASTADO/PAGADO por tipo ---
    const operatingSpent = categories
      .filter(isOperatingExpense)
      .reduce((sum, cat) => sum + (cat.spentInDisplayCurrency || 0), 0);
    
    const debtPaid = categories
      .filter(isDebtPayment)
      .reduce((sum, cat) => sum + (cat.spentInDisplayCurrency || 0), 0);
    
    const investmentContributed = categories
      .filter(isInvestmentContribution)
      .reduce((sum, cat) => sum + (cat.spentInDisplayCurrency || 0), 0);
    
    // --- INGRESOS reales del mes ---
    const incomeReal = categories
      .filter(isIncome)
      .reduce((sum, cat) => sum + (cat.spentInDisplayCurrency || 0), 0);
    
    // --- CÁLCULOS DERIVADOS ---
    
    // Presupuesto operativo = gastos + deudas (sin inversión)
    const operationalBudgeted = operatingBudgeted + debtBudgeted;
    
    // Disponible operativo = presupuesto operativo - gastado operativo - pagado deuda
    const availableOperational = operationalBudgeted - operatingSpent - debtPaid;
    
    // Total presupuestado (todo)
    const budgeted = operatingBudgeted + debtBudgeted + investmentBudgeted;
    
    // Total gastado (legacy - para compatibilidad, ahora solo operativo)
    const spent = operatingSpent; // ✅ CORREGIDO: antes sumaba todo
    
    // Disponible total (presupuestado total - todo gastado/pagado/invertido)
    const available = budgeted - operatingSpent - debtPaid - investmentContributed;
    
    // --- STOCKS (de otros módulos) ---
    const totalDebt = debtsCtx.debts.reduce((sum, debt) => 
      sum + ratesCtx.convertCurrency(debt.currentBalance || 0, debt.currency, displayCurrency), 0);
    
    const totalSavings = investmentsCtx.savingsGoals.reduce((sum, goal) => 
      sum + ratesCtx.convertCurrency(goal.currentAmount || 0, goal.currency, displayCurrency), 0);
    
    const totalInvestments = investmentsCtx.investments.reduce((sum, inv) => {
      let value = inv.currentBalance !== undefined ? inv.currentBalance : 
                  (inv.quantity && inv.currentPrice ? inv.quantity * inv.currentPrice : 0);
      return sum + ratesCtx.convertCurrency(value, inv.currency, displayCurrency);
    }, 0);
    
    return {
      // ✅ M36: Nuevos campos por flowKind
      operatingBudgeted,
      operatingSpent,
      debtBudgeted,
      debtPaid,
      investmentBudgeted,
      investmentContributed,
      incomeReal,
      
      // ✅ M36: Disponible operativo (card principal)
      operationalBudgeted,
      availableOperational,
      
      // Legacy (backward compatible)
      budgeted,
      spent, // Ahora solo operativo
      available,
      
      // Stocks
      totalDebt,
      totalSavings,
      totalInvestments
    };
  }, [
    budgetCtx.categoriesWithMonthlyBudget, 
    debtsCtx.debts, 
    investmentsCtx.savingsGoals, 
    investmentsCtx.investments, 
    displayCurrency, 
    ratesCtx.convertCurrency
  ]);

  // =====================================================
  // SALUD FINANCIERA
  // =====================================================
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

  // =====================================================
  // VALOR DEL CONTEXTO
  // =====================================================
  const value = useMemo(() => ({
    // === Estados globales ===
    currentUser,
    setCurrentUser,
    displayCurrency,
    setDisplayCurrency,
    
    // === Cálculos ===
    totals,
    financialHealth,
    
    // === Helpers de clasificación (exportados para uso externo) ===
    getFlowKind,
    isOperatingExpense,
    isDebtPayment,
    isInvestmentContribution,
    isIncome,
    
    // === Transacciones (de TransactionsContext) ===
    transactions: transactionsCtx.transactions,
    setTransactions: transactionsCtx.setTransactions,
    addTransaction: transactionsCtx.addTransaction,
    addTransactionsBatch: transactionsCtx.addTransactionsBatch,
    updateTransaction: transactionsCtx.updateTransaction,
    deleteTransaction: transactionsCtx.deleteTransaction,
    clearAllTransactions: transactionsCtx.clearAllTransactions,
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
    deletePlatform: investmentsCtx.deletePlatform,
    archivePlatform: investmentsCtx.archivePlatform,
    restorePlatform: investmentsCtx.restorePlatform,
    updatePlatformBalance: investmentsCtx.updatePlatformBalance,
    calculatePlatformROI: investmentsCtx.calculatePlatformROI,
    addHoldingToPlatform: investmentsCtx.addHoldingToPlatform,
    updateHoldingInPlatform: investmentsCtx.updateHoldingInPlatform,
    deleteHoldingFromPlatform: investmentsCtx.deleteHoldingFromPlatform,
    addBalanceHistory: investmentsCtx.addBalanceHistory,
    updateBalanceHistory: investmentsCtx.updateBalanceHistory,
    // Balance entries para inversiones (plataformas)
    addInvestmentBalanceEntry: investmentsCtx.addBalanceEntry,
    updateInvestmentBalanceEntry: investmentsCtx.updateBalanceEntry,
    deleteInvestmentBalanceEntry: investmentsCtx.deleteBalanceEntry,
    addSavingsGoal: investmentsCtx.addSavingsGoal,
    updateSavingsGoal: investmentsCtx.updateSavingsGoal,
    deleteSavingsGoal: investmentsCtx.deleteSavingsGoal,
    registerSavingsContribution: investmentsCtx.registerSavingsContribution,
    updateLinkedSavingsGoals: investmentsCtx.updateLinkedSavingsGoals,
    PLATFORM_GOALS,
    PLATFORM_SUBTYPES,
    
    // === Deudas (de DebtsContext) ===
    debts: debtsCtx.debts,
    setDebts: debtsCtx.setDebts,
    addDebt: debtsCtx.addDebt,
    updateDebt: debtsCtx.updateDebt,
    deleteDebt: debtsCtx.deleteDebt,
    registerDebtPayment: debtsCtx.registerDebtPayment,
    // ✅ M36 Fase 4: Balance History para deudas
    addDebtBalanceEntry: debtsCtx.addBalanceEntry,
    updateDebtBalanceEntry: debtsCtx.updateBalanceEntry,
    deleteDebtBalanceEntry: debtsCtx.deleteBalanceEntry,
    getBalanceHistory: debtsCtx.getBalanceHistory,
    getBalanceAtDate: debtsCtx.getBalanceAtDate,
    getDebtReduction: debtsCtx.getDebtReduction
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

// =====================================================
// PROVIDER RAÍZ
// =====================================================

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

// =====================================================
// EXPORTS
// =====================================================

export { useTransactions } from './TransactionsContext';
export { useExchangeRates } from './ExchangeRatesContext';
export { useBudget } from './BudgetContext';
export { useInvestments, PLATFORM_GOALS, PLATFORM_SUBTYPES } from './InvestmentsContext';
export { useDebts } from './DebtsContext';

// ✅ M36: Exportar helpers de clasificación
export { getFlowKind, isOperatingExpense, isDebtPayment, isInvestmentContribution, isIncome };