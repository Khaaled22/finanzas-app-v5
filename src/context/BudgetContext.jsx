// src/context/BudgetContext.jsx
// ✅ M26: Sub-contexto para gestión de presupuestos mensuales
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import StorageManager from '../modules/storage/StorageManager';
import { INITIAL_CATEGORIES, INITIAL_MONTHLY_BUDGETS } from '../config/initialData';

const BudgetContext = createContext();

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudget debe usarse dentro de BudgetProvider');
  }
  return context;
};

export function BudgetProvider({ 
  children, 
  transactions, 
  convertCurrency, 
  convertCurrencyAtDate,
  displayCurrency,
  getTransactionsByCategoryAndMonth 
}) {
  const [categories, setCategories] = useState(() => 
    StorageManager.load('categories_v5', INITIAL_CATEGORIES)
  );

  const [monthlyBudgets, setMonthlyBudgets] = useState(() => 
    StorageManager.load('monthlyBudgets_v5', INITIAL_MONTHLY_BUDGETS)
  );

  const [selectedBudgetMonth, setSelectedBudgetMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [ynabConfig, setYnabConfig] = useState(() => 
    StorageManager.load('ynabConfig_v5', { monthlyIncome: 3500, currency: 'EUR' })
  );

  // Auto-save
  useEffect(() => { 
    StorageManager.save('categories_v5', categories); 
  }, [categories]);

  useEffect(() => { 
    StorageManager.save('monthlyBudgets_v5', monthlyBudgets); 
  }, [monthlyBudgets]);

  useEffect(() => { 
    StorageManager.save('ynabConfig_v5', ynabConfig); 
  }, [ynabConfig]);

  // ✅ Helpers
  const getPreviousMonth = useCallback((month) => {
    const [year, monthNum] = month.split('-').map(Number);
    const date = new Date(year, monthNum - 1, 1);
    date.setMonth(date.getMonth() - 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const findMostRecentMonthWithBudgets = useCallback((beforeMonth) => {
    const [year, month] = beforeMonth.split('-').map(Number);
    
    for (let i = 1; i <= 12; i++) {
      const testDate = new Date(year, month - 1 - i, 1);
      const testMonth = `${testDate.getFullYear()}-${String(testDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (monthlyBudgets[testMonth] && Object.keys(monthlyBudgets[testMonth]).length > 0) {
        return testMonth;
      }
    }
    
    return null;
  }, [monthlyBudgets]);

  // ✅ Inicializar categoría para un mes
  const initializeCategoryForMonth = useCallback((categoryId, month) => {
    if (monthlyBudgets[month]?.[categoryId]) return;
    
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;
    
    const previousMonth = getPreviousMonth(month);
    const previousBudget = monthlyBudgets[previousMonth]?.[categoryId]?.budget;
    
    const budgetToUse = previousBudget !== undefined 
      ? previousBudget 
      : (category.budget || 0);
    
    setMonthlyBudgets(prev => ({
      ...prev,
      [month]: {
        ...prev[month],
        [categoryId]: {
          budget: budgetToUse,
          spent: 0
        }
      }
    }));
  }, [monthlyBudgets, categories, getPreviousMonth]);

  // ✅ Obtener presupuesto de categoría para mes
  const getCategoryBudgetForMonth = useCallback((categoryId, month) => {
    const monthBudget = monthlyBudgets[month];
    
    if (monthBudget && monthBudget[categoryId]) {
      return monthBudget[categoryId].budget;
    }
    
    initializeCategoryForMonth(categoryId, month);
    return monthlyBudgets[month]?.[categoryId]?.budget || 0;
  }, [monthlyBudgets, initializeCategoryForMonth]);

  // ✅ M25: Obtener gastado usando índice (optimizado)
  const getCategorySpentForMonth = useCallback((categoryId, month) => {
    const category = categories.find(cat => cat.id === categoryId);
    const targetCurrency = category?.currency || displayCurrency;
    
    // Usar índice si está disponible
    const monthTransactions = getTransactionsByCategoryAndMonth 
      ? getTransactionsByCategoryAndMonth(categoryId, month)
      : transactions.filter(tx => tx.categoryId === categoryId && tx.date?.slice(0, 7) === month);
    
    return monthTransactions.reduce((sum, tx) => {
      const amount = parseFloat(tx.amount || 0);
      const converted = convertCurrencyAtDate(amount, tx.currency, targetCurrency, tx.date);
      return sum + converted;
    }, 0);
  }, [categories, displayCurrency, transactions, convertCurrencyAtDate, getTransactionsByCategoryAndMonth]);

  // ✅ Categorías con budget mensual calculado
  const categoriesWithMonthlyBudget = useMemo(() => {
    return categories.map(cat => {
      const budgetInOriginal = getCategoryBudgetForMonth(cat.id, selectedBudgetMonth);
      const spentInOriginal = getCategorySpentForMonth(cat.id, selectedBudgetMonth);
      
      const budgetConverted = convertCurrency(budgetInOriginal, cat.currency, displayCurrency);
      const spentConverted = convertCurrency(spentInOriginal, cat.currency, displayCurrency);
      
      return {
        ...cat,
        budget: budgetConverted,
        spent: spentConverted,
        budgetOriginal: budgetInOriginal,
        spentOriginal: spentInOriginal,
        budgetInDisplayCurrency: budgetConverted,
        spentInDisplayCurrency: spentConverted
      };
    });
  }, [categories, selectedBudgetMonth, monthlyBudgets, displayCurrency, transactions]);

  // ✅ Actualizar presupuesto mensual
  const updateMonthlyBudget = useCallback((categoryId, budget, month) => {
    setMonthlyBudgets(prev => ({
      ...prev,
      [month]: {
        ...(prev[month] || {}),
        [categoryId]: {
          budget: parseFloat(budget) || 0,
          updatedAt: new Date().toISOString()
        }
      }
    }));
    return true;
  }, []);

  // ✅ Copiar presupuestos del mes anterior
  const copyBudgetFromPreviousMonth = useCallback((targetMonth) => {
    const recentMonth = findMostRecentMonthWithBudgets(targetMonth);
    
    if (recentMonth) {
      setMonthlyBudgets(prev => {
        const sourceBudgets = { ...prev[recentMonth] };
        
        Object.keys(sourceBudgets).forEach(catId => {
          sourceBudgets[catId] = {
            ...sourceBudgets[catId],
            spent: 0
          };
        });
        
        return {
          ...prev,
          [targetMonth]: sourceBudgets
        };
      });
      
      return { 
        success: true, 
        count: Object.keys(monthlyBudgets[recentMonth] || {}).length, 
        source: 'previous',
        sourceMonth: recentMonth
      };
    }
    
    setMonthlyBudgets(prev => {
      const budgetsFromTemplate = {};
      categories.forEach(cat => {
        budgetsFromTemplate[cat.id] = {
          budget: cat.budget || 0,
          spent: 0
        };
      });
      
      return {
        ...prev,
        [targetMonth]: budgetsFromTemplate
      };
    });
    
    return { 
      success: true, 
      count: categories.length, 
      source: 'template' 
    };
  }, [findMostRecentMonthWithBudgets, monthlyBudgets, categories]);

  // ✅ Limpiar presupuestos
  const clearMonthlyBudgets = useCallback((targetMonth = null) => {
    if (targetMonth) {
      setMonthlyBudgets(prev => {
        const newBudgets = { ...prev };
        delete newBudgets[targetMonth];
        return newBudgets;
      });
    } else {
      setMonthlyBudgets({});
    }
    return true;
  }, []);

  // ✅ Transferir entre categorías
  const transferBetweenCategories = useCallback((fromCategoryId, toCategoryId, amount) => {
    const month = selectedBudgetMonth;
    
    const fromCategory = categories.find(c => c.id === fromCategoryId);
    const toCategory = categories.find(c => c.id === toCategoryId);
    
    if (!fromCategory || !toCategory) {
      return { success: false, error: 'Categoría no encontrada' };
    }
    
    const fromBudget = getCategoryBudgetForMonth(fromCategoryId, month);
    const toBudget = getCategoryBudgetForMonth(toCategoryId, month);
    
    if (fromBudget < amount) {
      return { success: false, error: 'Presupuesto insuficiente' };
    }
    
    updateMonthlyBudget(fromCategoryId, fromBudget - amount, month);
    updateMonthlyBudget(toCategoryId, toBudget + amount, month);
    
    return { 
      success: true,
      from: fromCategory.name,
      to: toCategory.name,
      amount,
      month
    };
  }, [selectedBudgetMonth, categories, getCategoryBudgetForMonth, updateMonthlyBudget]);

  // ✅ CRUD Categorías
  const updateCategory = useCallback((categoryId, updates) => {
    const { budget, spent, ...metadataUpdates } = updates;
    
    setCategories(prev => 
      prev.map(cat => 
        cat.id === categoryId 
          ? { ...cat, ...metadataUpdates }
          : cat
      )
    );
  }, []);

  const deleteCategory = useCallback((categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) {
      return { success: false, message: 'Categoría no encontrada', transactionCount: 0 };
    }

    const relatedTransactions = transactions.filter(t => t.categoryId === categoryId);
    
    if (relatedTransactions.length > 0) {
      return {
        success: false,
        message: `No se puede eliminar. Hay ${relatedTransactions.length} transacción(es) asociada(s).`,
        transactionCount: relatedTransactions.length
      };
    }

    setCategories(prev => prev.filter(cat => cat.id !== categoryId));

    setMonthlyBudgets(prev => {
      const newBudgets = { ...prev };
      Object.keys(newBudgets).forEach(month => {
        if (newBudgets[month][categoryId]) {
          delete newBudgets[month][categoryId];
        }
      });
      return newBudgets;
    });

    return { success: true, message: 'Categoría eliminada', transactionCount: 0 };
  }, [categories, transactions]);

  const importCategories = useCallback((categoriesArray) => {
    if (!Array.isArray(categoriesArray) || categoriesArray.length === 0) {
      return { success: false, imported: 0, skipped: 0, errors: ['Array vacío'] };
    }

    const results = { success: true, imported: 0, skipped: 0, errors: [] };
    const newCategories = [];
    const existingNames = categories.map(cat => cat.name.toLowerCase());

    categoriesArray.forEach((cat, index) => {
      if (!cat.name || !cat.group) {
        results.errors.push(`Fila ${index + 1}: Faltan campos requeridos`);
        results.skipped++;
        return;
      }

      if (existingNames.includes(cat.name.toLowerCase())) {
        results.skipped++;
        return;
      }

      const newCategory = {
        id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: cat.name.trim(),
        group: cat.group.trim(),
        budget: Math.max(0, parseFloat(cat.budget) || 0),
        spent: 0,
        currency: ['EUR', 'CLP', 'USD', 'UF'].includes(cat.currency?.toUpperCase()) 
          ? cat.currency.toUpperCase() : 'EUR',
        icon: cat.icon || '📁',
        type: ['income', 'expense', 'savings', 'investment'].includes(cat.type?.toLowerCase()) 
          ? cat.type.toLowerCase() : 'expense'
      };

      newCategories.push(newCategory);
      existingNames.push(newCategory.name.toLowerCase());
      results.imported++;
    });

    if (newCategories.length > 0) {
      setCategories(prev => [...prev, ...newCategories]);
    }

    return results;
  }, [categories]);

  const value = useMemo(() => ({
    // Estados
    categories,
    setCategories,
    monthlyBudgets,
    setMonthlyBudgets,
    selectedBudgetMonth,
    setSelectedBudgetMonth,
    ynabConfig,
    setYnabConfig,
    categoriesWithMonthlyBudget,
    
    // Funciones
    getCategoryBudgetForMonth,
    getCategorySpentForMonth,
    initializeCategoryForMonth,
    updateMonthlyBudget,
    copyBudgetFromPreviousMonth,
    clearMonthlyBudgets,
    transferBetweenCategories,
    updateCategory,
    deleteCategory,
    importCategories
  }), [
    categories,
    monthlyBudgets,
    selectedBudgetMonth,
    ynabConfig,
    categoriesWithMonthlyBudget,
    getCategoryBudgetForMonth,
    getCategorySpentForMonth,
    initializeCategoryForMonth,
    updateMonthlyBudget,
    copyBudgetFromPreviousMonth,
    clearMonthlyBudgets,
    transferBetweenCategories,
    updateCategory,
    deleteCategory,
    importCategories
  ]);

  return (
    <BudgetContext.Provider value={value}>
      {children}
    </BudgetContext.Provider>
  );
}