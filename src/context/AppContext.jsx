// src/context/AppContext.jsx
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import StorageManager from '../modules/storage/StorageManager';
import { INITIAL_CATEGORIES, INITIAL_TRANSACTIONS, INITIAL_DEBTS, INITIAL_SAVINGS_GOALS, INITIAL_INVESTMENTS } from '../config/initialData';
import { AnalysisEngine } from '../domain/engines/AnalysisEngine';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe usarse dentro de AppProvider');
  }
  return context;
};

export function AppProvider({ children }) {
  // Estados principales
  const [categories, setCategories] = useState(() => 
    StorageManager.load('categories_v5', INITIAL_CATEGORIES)
  );
  
  const [transactions, setTransactions] = useState(() => 
    StorageManager.load('transactions_v5', INITIAL_TRANSACTIONS)
  );
  
  const [debts, setDebts] = useState(() => 
    StorageManager.load('debts_v5', INITIAL_DEBTS)
  );
  
  const [savingsGoals, setSavingsGoals] = useState(() => 
    StorageManager.load('savingsGoals_v5', INITIAL_SAVINGS_GOALS)
  );
  
  const [investments, setInvestments] = useState(() => 
    StorageManager.load('investments_v5', INITIAL_INVESTMENTS)
  );

  const [ynabConfig, setYnabConfig] = useState(() => 
    StorageManager.load('ynabConfig_v5', { monthlyIncome: 3500 })
  );
  
  // Configuraciones
  const [currentUser, setCurrentUser] = useState('Usuario 1');
  const [displayCurrency, setDisplayCurrency] = useState('EUR');
  
  // Auto-save en localStorage
  useEffect(() => { 
    StorageManager.save('categories_v5', categories); 
  }, [categories]);
  
  useEffect(() => { 
    StorageManager.save('transactions_v5', transactions); 
  }, [transactions]);
  
  useEffect(() => { 
    StorageManager.save('debts_v5', debts); 
  }, [debts]);
  
  useEffect(() => { 
    StorageManager.save('savingsGoals_v5', savingsGoals); 
  }, [savingsGoals]);
  
  useEffect(() => { 
    StorageManager.save('investments_v5', investments); 
  }, [investments]);

  useEffect(() => { 
    StorageManager.save('ynabConfig_v5', ynabConfig); 
  }, [ynabConfig]);

  // ===================== CÁLCULOS =====================
  const totals = useMemo(() => {
    const budgeted = categories.reduce((sum, cat) => sum + cat.budget, 0);
    const spent = categories.reduce((sum, cat) => sum + cat.spent, 0);
    const available = budgeted - spent;
    
    const totalDebt = debts.reduce((sum, debt) => sum + debt.currentBalance, 0);
    const totalSavings = savingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
    const totalInvestments = investments.reduce((sum, inv) => sum + (inv.quantity * inv.currentPrice), 0);
    
    return { budgeted, spent, available, totalDebt, totalSavings, totalInvestments };
  }, [categories, debts, savingsGoals, investments]);

  // NUEVO: Calcular salud financiera
  const financialHealth = useMemo(() => {
    return AnalysisEngine.calculateFinancialHealth({
      totals,
      debts,
      savingsGoals,
      investments,
      categories
    });
  }, [totals, debts, savingsGoals, investments, categories]);

  // ===================== UTILIDADES =====================
  const convertCurrency = (amount, fromCurrency, toCurrency) => {
    if (fromCurrency === toCurrency) return amount;
    
    const EXCHANGE_RATES = { 
      EUR: 1, 
      CLP: 1050, 
      USD: 1.09, 
      UF: 36000 
    };
    
    const amountInEUR = amount / EXCHANGE_RATES[fromCurrency];
    return amountInEUR * EXCHANGE_RATES[toCurrency];
  };

  // ===================== TRANSACCIONES =====================

  const addTransaction = (transactionData) => {
    const newTransaction = {
      ...transactionData,
      id: Date.now(),
      user: currentUser,
    };

    setTransactions([newTransaction, ...transactions]);
    
    // Actualizar el spent de la categoría
    setCategories(categories.map(cat => {
      if (cat.id === transactionData.categoryId) {
        return {
          ...cat,
          spent: cat.spent + parseFloat(transactionData.amount)
        };
      }
      return cat;
    }));
  };

  const updateTransaction = (transactionId, updates) => {
    const oldTransaction = transactions.find(t => t.id === transactionId);
    
    setTransactions(transactions.map(t => 
      t.id === transactionId ? { ...t, ...updates, user: currentUser } : t
    ));
    
    // Si cambió la categoría o el monto, actualizar spent
    if (oldTransaction && (updates.categoryId || updates.amount)) {
      setCategories(categories.map(cat => {
        // Restar del antiguo
        if (cat.id === oldTransaction.categoryId) {
          return {
            ...cat,
            spent: cat.spent - oldTransaction.amount
          };
        }
        // Sumar al nuevo
        if (cat.id === (updates.categoryId || oldTransaction.categoryId)) {
          return {
            ...cat,
            spent: cat.spent + (updates.amount || oldTransaction.amount)
          };
        }
        return cat;
      }));
    }
  };

  const deleteTransaction = (transactionId) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return;
    
    setTransactions(transactions.filter(t => t.id !== transactionId));
    
    // Actualizar spent de la categoría
    setCategories(categories.map(cat => {
      if (cat.id === transaction.categoryId) {
        return {
          ...cat,
          spent: Math.max(0, cat.spent - transaction.amount)
        };
      }
      return cat;
    }));
  };

  // ===================== DEUDAS =====================
  const addDebt = (debt) => {
    const newDebt = {
      ...debt,
      id: Date.now(),
      paymentsMade: 0,
      paymentHistory: []
    };
    setDebts([...debts, newDebt]);
  };

  const updateDebt = (debtId, updates) => {
    setDebts(debts.map(debt => 
      debt.id === debtId ? { ...debt, ...updates } : debt
    ));
  };

  const deleteDebt = (debtId) => {
    setDebts(debts.filter(debt => debt.id !== debtId));
  };

  const registerDebtPayment = (debtId, amount, extraPayment = 0) => {
    setDebts(debts.map(debt => {
      if (debt.id === debtId) {
        const totalPayment = amount + extraPayment;
        const payment = {
          id: Date.now(),
          date: new Date().toISOString(),
          amount: amount,
          extraPayment: extraPayment,
          balanceBefore: debt.currentBalance,
          balanceAfter: Math.max(0, debt.currentBalance - totalPayment),
          user: currentUser
        };
        
        return {
          ...debt,
          currentBalance: Math.max(0, debt.currentBalance - totalPayment),
          paymentsMade: debt.paymentsMade + 1,
          paymentHistory: [...(debt.paymentHistory || []), payment]
        };
      }
      return debt;
    }));
  };

  // ===================== AHORROS =====================
  const addSavingsGoal = (goal) => {
    const newGoal = {
      ...goal,
      id: Date.now(),
      currentAmount: goal.currentAmount || 0,
      contributionHistory: []
    };
    setSavingsGoals([...savingsGoals, newGoal]);
  };

  const updateSavingsGoal = (goalId, updates) => {
    setSavingsGoals(savingsGoals.map(goal => 
      goal.id === goalId ? { ...goal, ...updates } : goal
    ));
  };

  const deleteSavingsGoal = (goalId) => {
    setSavingsGoals(savingsGoals.filter(goal => goal.id !== goalId));
  };

  const registerSavingsContribution = (goalId, amount) => {
    setSavingsGoals(savingsGoals.map(goal => {
      if (goal.id === goalId) {
        const contribution = {
          id: Date.now(),
          date: new Date().toISOString(),
          amount: amount,
          balanceBefore: goal.currentAmount,
          balanceAfter: Math.min(goal.targetAmount, goal.currentAmount + amount),
          user: currentUser
        };
        
        return {
          ...goal,
          currentAmount: Math.min(goal.targetAmount, goal.currentAmount + amount),
          contributionHistory: [...(goal.contributionHistory || []), contribution]
        };
      }
      return goal;
    }));
  };

  // ===================== INVERSIONES =====================
  const addInvestment = (investment) => {
    const newInvestment = {
      ...investment,
      id: Date.now(),
      lastUpdated: new Date().toISOString(),
      purchaseHistory: [{
        id: Date.now(),
        date: new Date().toISOString(),
        type: 'buy',
        quantity: investment.quantity,
        price: investment.purchasePrice,
        total: investment.quantity * investment.purchasePrice,
        user: currentUser
      }]
    };
    setInvestments([...investments, newInvestment]);
  };

  // ===================== CATEGORÍAS =====================
  const transferBetweenCategories = (fromId, toId, amount) => {
    setCategories(categories.map(cat => {
      if (cat.id === fromId) {
        return { ...cat, budget: Math.max(0, cat.budget - amount) };
      }
      if (cat.id === toId) {
        return { ...cat, budget: cat.budget + amount };
      }
      return cat;
    }));
  };

  const value = {
    // Estados
    categories,
    setCategories,
    transactions,
    setTransactions,
    debts,
    setDebts,
    savingsGoals,
    setSavingsGoals,
    investments,
    setInvestments,
    ynabConfig,
    setYnabConfig,
    currentUser,
    setCurrentUser,
    displayCurrency,
    setDisplayCurrency,
    
    // Cálculos
    totals,
    financialHealth, // NUEVO - IMPORTANTE PARA PDF
    
    // Funciones - Transacciones
    addTransaction,
    updateTransaction,
    deleteTransaction,

    // Funciones - Deudas
    addDebt,
    updateDebt,
    deleteDebt,
    registerDebtPayment,

    // Funciones - Ahorros
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    registerSavingsContribution,

    // Funciones - Inversiones / Categorías
    addInvestment,
    transferBetweenCategories,
    
    // Utilidades
    convertCurrency
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}