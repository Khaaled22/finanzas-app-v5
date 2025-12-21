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

// DEFAULT_RATES para M14 (si constants.js no existe aún)
const DEFAULT_RATES = {
  EUR_CLP: 1050,
  EUR_USD: 1.09,
  CLP_UF: 36000
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

  // NUEVO M14: Estado de tasas de cambio
  const [exchangeRates, setExchangeRates] = useState(() => 
    StorageManager.load('exchangeRates_v5', {
      EUR_CLP: DEFAULT_RATES.EUR_CLP,
      EUR_USD: DEFAULT_RATES.EUR_USD,
      CLP_UF: DEFAULT_RATES.CLP_UF,
      lastUpdated: null,
      updateHistory: []
    })
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

  // NUEVO M14: Auto-save tasas de cambio
  useEffect(() => { 
    StorageManager.save('exchangeRates_v5', exchangeRates); 
  }, [exchangeRates]);

  // ===================== UTILIDADES =====================
  // ACTUALIZADO M14: Usa exchangeRates dinámicas
  // ⚠️ IMPORTANTE: Debe estar ANTES de totals para evitar error de inicialización
  const convertCurrency = (amount, fromCurrency, toCurrency) => {
    if (fromCurrency === toCurrency) return amount;
    
    // Construir objeto de tasas desde el estado
    const RATES = { 
      EUR: 1, 
      CLP: exchangeRates.EUR_CLP, 
      USD: exchangeRates.EUR_USD, 
      UF: exchangeRates.CLP_UF 
    };
    
    const amountInEUR = amount / RATES[fromCurrency];
    return amountInEUR * RATES[toCurrency];
  };

  // ===================== CÁLCULOS =====================
  const totals = useMemo(() => {
    // ✅ M14: Convertir todo a displayCurrency
    const budgeted = categories.reduce((sum, cat) => 
      sum + convertCurrency(cat.budget, cat.currency, displayCurrency), 0);
    
    const spent = categories.reduce((sum, cat) => 
      sum + convertCurrency(cat.spent, cat.currency, displayCurrency), 0);
    
    const available = budgeted - spent;
    
    const totalDebt = debts.reduce((sum, debt) => 
      sum + convertCurrency(debt.currentBalance, debt.currency, displayCurrency), 0);
    
    const totalSavings = savingsGoals.reduce((sum, goal) => 
      sum + convertCurrency(goal.currentAmount, goal.currency, displayCurrency), 0);
    
    const totalInvestments = investments.reduce((sum, inv) => {
      const value = inv.quantity * inv.currentPrice;
      return sum + convertCurrency(value, inv.currency, displayCurrency);
    }, 0);
    
    return { budgeted, spent, available, totalDebt, totalSavings, totalInvestments };
  }, [categories, debts, savingsGoals, investments, displayCurrency, exchangeRates]);

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

  // ===================== TASAS DE CAMBIO (M14) =====================
  
  // Actualizar tasas manualmente
  const updateExchangeRates = (newRates, source = 'manual') => {
    const update = {
      id: Date.now(),
      date: new Date().toISOString(),
      source: source,
      rates: newRates,
      user: currentUser
    };

    setExchangeRates(prev => ({
      ...prev,
      EUR_CLP: newRates.EUR_CLP ?? prev.EUR_CLP,
      EUR_USD: newRates.EUR_USD ?? prev.EUR_USD,
      CLP_UF: newRates.CLP_UF ?? prev.CLP_UF,
      lastUpdated: new Date().toISOString(),
      updateHistory: [update, ...(prev.updateHistory || [])].slice(0, 20) // Guardar últimas 20
    }));
  };

  // Fetch tasas desde APIs (M14)
  const fetchExchangeRates = async () => {
    const results = {
      EUR_CLP: null,
      EUR_USD: null,
      CLP_UF: null,
      errors: []
    };

    try {
      // 1. EUR/USD desde Frankfurter (gratis, sin key)
      try {
        const response = await fetch('https://api.frankfurter.app/latest?from=EUR&to=USD');
        if (response.ok) {
          const data = await response.json();
          results.EUR_USD = data.rates.USD;
        }
      } catch (error) {
        results.errors.push('EUR/USD: Error al consultar Frankfurter API');
      }

      // 2. EUR/CLP desde Exchange Rate API (requiere key - opcional)
      // Descomentar si tienes API key
      /*
      try {
        const response = await fetch('https://v6.exchangerate-api.com/v6/YOUR_KEY/latest/EUR');
        if (response.ok) {
          const data = await response.json();
          results.EUR_CLP = data.conversion_rates.CLP;
        }
      } catch (error) {
        results.errors.push('EUR/CLP: Error al consultar Exchange Rate API');
      }
      */

      // 3. CLP/UF desde CMF Chile (requiere key - opcional)
      // Descomentar si tienes API key
      /*
      try {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const response = await fetch(`https://api.cmfchile.cl/api-sbifv3/recursos_api/uf/${year}/${month}?apikey=YOUR_KEY&formato=json`);
        if (response.ok) {
          const data = await response.json();
          if (data.UFs && data.UFs.length > 0) {
            results.CLP_UF = parseFloat(data.UFs[0].Valor.replace(',', ''));
          }
        }
      } catch (error) {
        results.errors.push('CLP/UF: Error al consultar CMF Chile API');
      }
      */

      return results;
    } catch (error) {
      results.errors.push('Error general al consultar APIs');
      return results;
    }
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

  // ✅ M16: Importación batch de transacciones
  const addTransactionsBatch = async (transactionsArray) => {
    return new Promise((resolve) => {
      // Agregar todas las transacciones
      setTransactions(prev => [...transactionsArray, ...prev]);
      
      // Calcular spent por categoría
      const spentByCategory = {};
      transactionsArray.forEach(trans => {
        if (!spentByCategory[trans.categoryId]) {
          spentByCategory[trans.categoryId] = 0;
        }
        spentByCategory[trans.categoryId] += parseFloat(trans.amount);
      });
      
      // Actualizar spent de categorías
      setCategories(prev => prev.map(cat => {
        if (spentByCategory[cat.id]) {
          return {
            ...cat,
            spent: cat.spent + spentByCategory[cat.id]
          };
        }
        return cat;
      }));
      
      resolve();
    });
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

  // ✅ M16: Limpiar todas las transacciones
  const clearAllTransactions = () => {
    setTransactions([]);
    
    // Resetear spent de todas las categorías a 0
    setCategories(categories.map(cat => ({
      ...cat,
      spent: 0
    })));
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

  // ===================== CATEGORÍAS (M13) =====================
  
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
    exchangeRates, // NUEVO M14
    setExchangeRates, // NUEVO M14
    currentUser,
    setCurrentUser,
    displayCurrency,
    setDisplayCurrency,
    
    // Cálculos
    totals,
    financialHealth,
    
    // Funciones - Transacciones
    addTransaction,
    addTransactionsBatch, // ✅ M16
    updateTransaction,
    deleteTransaction,
    clearAllTransactions, // ✅ M16

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

    // Funciones - Categorías (M13 + M14)
    transferBetweenCategories,
    updateCategory,        // M13.1 ✅
    deleteCategory,        // M13.1 ✅
    importCategories,      // M13.1 ✅

    // Funciones - Tasas de Cambio (M14) ✅
    updateExchangeRates,
    fetchExchangeRates,
    
    // Utilidades
    convertCurrency
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}