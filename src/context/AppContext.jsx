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

  // ========== M13.1: NUEVAS FUNCIONES CRUD CATEGORÍAS ==========

  /**
   * Actualizar una categoría existente
   * @param {string} categoryId - ID de la categoría a actualizar
   * @param {object} updates - Objeto con campos a actualizar
   * @returns {boolean} true si se actualizó, false si no se encontró
   */
  const updateCategory = (categoryId, updates) => {
    // Validar que la categoría existe
    const categoryExists = categories.find(cat => cat.id === categoryId);
    if (!categoryExists) {
      console.error(`Categoría con ID ${categoryId} no encontrada`);
      return false;
    }

    // Si se está cambiando el nombre, validar que no exista otra con ese nombre
    if (updates.name) {
      const duplicateName = categories.find(
        cat => cat.id !== categoryId && cat.name.toLowerCase() === updates.name.toLowerCase()
      );
      if (duplicateName) {
        console.error(`Ya existe una categoría con el nombre "${updates.name}"`);
        return false;
      }
    }

    // Actualizar la categoría
    setCategories(categories.map(cat => 
      cat.id === categoryId ? { ...cat, ...updates } : cat
    ));

    return true;
  };

  /**
   * Eliminar una categoría
   * IMPORTANTE: No permite eliminar si tiene transacciones asociadas
   * @param {string} categoryId - ID de la categoría a eliminar
   * @returns {object} { success: boolean, message: string, transactionCount: number }
   */
  const deleteCategory = (categoryId) => {
    // Verificar que la categoría existe
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) {
      return {
        success: false,
        message: 'Categoría no encontrada',
        transactionCount: 0
      };
    }

    // Verificar si hay transacciones asociadas
    const relatedTransactions = transactions.filter(t => t.categoryId === categoryId);
    
    if (relatedTransactions.length > 0) {
      return {
        success: false,
        message: `No se puede eliminar. Hay ${relatedTransactions.length} transacción(es) asociada(s) a esta categoría.`,
        transactionCount: relatedTransactions.length
      };
    }

    // Si no hay transacciones, eliminar la categoría
    setCategories(categories.filter(cat => cat.id !== categoryId));

    return {
      success: true,
      message: 'Categoría eliminada exitosamente',
      transactionCount: 0
    };
  };

  /**
   * Importar categorías masivamente desde CSV
   * Evita duplicados por nombre y valida estructura
   * @param {array} categoriesArray - Array de objetos categoría a importar
   * @returns {object} { success: boolean, imported: number, skipped: number, errors: array }
   */
  const importCategories = (categoriesArray) => {
    if (!Array.isArray(categoriesArray) || categoriesArray.length === 0) {
      return {
        success: false,
        imported: 0,
        skipped: 0,
        errors: ['El array de categorías está vacío o no es válido']
      };
    }

    const results = {
      success: true,
      imported: 0,
      skipped: 0,
      errors: []
    };

    const newCategories = [];
    const existingNames = categories.map(cat => cat.name.toLowerCase());

    categoriesArray.forEach((cat, index) => {
      // Validar campos requeridos
      if (!cat.name || !cat.group) {
        results.errors.push(`Fila ${index + 1}: Faltan campos requeridos (name, group)`);
        results.skipped++;
        return;
      }

      // Validar que el nombre no esté duplicado en existentes
      if (existingNames.includes(cat.name.toLowerCase())) {
        results.errors.push(`Fila ${index + 1}: Categoría "${cat.name}" ya existe (omitida)`);
        results.skipped++;
        return;
      }

      // Validar que el nombre no esté duplicado en el mismo import
      if (newCategories.find(nc => nc.name.toLowerCase() === cat.name.toLowerCase())) {
        results.errors.push(`Fila ${index + 1}: Categoría "${cat.name}" duplicada en el archivo (omitida)`);
        results.skipped++;
        return;
      }

      // Validar presupuesto
      const budget = parseFloat(cat.budget) || 0;
      if (budget < 0) {
        results.errors.push(`Fila ${index + 1}: Presupuesto negativo en "${cat.name}" (ajustado a 0)`);
      }

      // Validar moneda
      const validCurrencies = ['EUR', 'CLP', 'USD', 'UF'];
      const currency = cat.currency && validCurrencies.includes(cat.currency.toUpperCase()) 
        ? cat.currency.toUpperCase() 
        : 'EUR';

      // Validar tipo
      const validTypes = ['income', 'expense', 'savings', 'investment'];
      const type = cat.type && validTypes.includes(cat.type.toLowerCase()) 
        ? cat.type.toLowerCase() 
        : 'expense';

      // Crear categoría válida
      const newCategory = {
        id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: cat.name.trim(),
        group: cat.group.trim(),
        budget: Math.max(0, budget),
        spent: 0, // Siempre inicia en 0
        currency: currency,
        icon: cat.icon || '📁',
        type: type
      };

      newCategories.push(newCategory);
      existingNames.push(newCategory.name.toLowerCase());
      results.imported++;
    });

    // Agregar las nuevas categorías
    if (newCategories.length > 0) {
      setCategories([...categories, ...newCategories]);
    }

    return results;
  };

  // ========== FIN FUNCIONES M13.1 ==========

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
    financialHealth,
    
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

    // Funciones - Inversiones
    addInvestment,

    // Funciones - Categorías
    transferBetweenCategories,
    updateCategory,        // M13.1 ✅
    deleteCategory,        // M13.1 ✅
    importCategories,      // M13.1 ✅
    
    // Utilidades
    convertCurrency
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}