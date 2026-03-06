// src/context/BudgetContext.jsx
// ✅ M36: Sub-contexto para gestión de presupuestos mensuales
// - Migración automática de flowKind
// - Helpers de clasificación integrados

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import StorageManager from '../modules/storage/StorageManager';
import { INITIAL_CATEGORIES, INITIAL_MONTHLY_BUDGETS } from '../config/initialData';
import { getFlowKind as inferFlowKind } from '../domain/flowKind';

const BudgetContext = createContext();

/**
 * Migra categorías para agregar flowKind si no existe
 */
const migrateCategoriesToFlowKind = (categories) => {
  let migrated = false;
  
  const updatedCategories = categories.map(cat => {
    if (!cat.flowKind) {
      migrated = true;
      return {
        ...cat,
        flowKind: inferFlowKind(cat)
      };
    }
    return cat;
  });
  
  if (migrated) {
    console.log('[M36] Migración de flowKind completada para', 
      updatedCategories.filter(c => c.flowKind).length, 'categorías');
  }
  
  return updatedCategories;
};

// =====================================================
// HOOK
// =====================================================

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudget debe usarse dentro de BudgetProvider');
  }
  return context;
};

// =====================================================
// PROVIDER
// =====================================================

export function BudgetProvider({ 
  children, 
  transactions, 
  convertCurrency, 
  convertCurrencyAtDate,
  displayCurrency,
  getTransactionsByCategoryAndMonth 
}) {
  // ✅ M36: Cargar y migrar categorías con flowKind
  const [categories, setCategories] = useState(() => {
    const loaded = StorageManager.load('categories_v5', INITIAL_CATEGORIES);
    return migrateCategoriesToFlowKind(loaded);
  });

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

  // =====================================================
  // HELPERS DE MES
  // =====================================================

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

  // =====================================================
  // FUNCIONES DE PRESUPUESTO
  // =====================================================

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

  const getCategoryBudgetForMonth = useCallback((categoryId, month) => {
    const monthBudget = monthlyBudgets[month];
    
    if (monthBudget && monthBudget[categoryId]) {
      return monthBudget[categoryId].budget;
    }
    
    initializeCategoryForMonth(categoryId, month);
    return monthlyBudgets[month]?.[categoryId]?.budget || 0;
  }, [monthlyBudgets, initializeCategoryForMonth]);

  const getCategorySpentForMonth = useCallback((categoryId, month) => {
    const category = categories.find(cat => cat.id === categoryId);
    const targetCurrency = category?.currency || displayCurrency;
    
    const monthTransactions = getTransactionsByCategoryAndMonth 
      ? getTransactionsByCategoryAndMonth(categoryId, month)
      : transactions.filter(tx => tx.categoryId === categoryId && tx.date?.slice(0, 7) === month);
    
    return monthTransactions.reduce((sum, tx) => {
      const amount = parseFloat(tx.amount || 0);
      const converted = convertCurrencyAtDate(amount, tx.currency, targetCurrency, tx.date);
      return sum + converted;
    }, 0);
  }, [categories, displayCurrency, transactions, convertCurrencyAtDate, getTransactionsByCategoryAndMonth]);

  // =====================================================
  // CATEGORÍAS CON PRESUPUESTO MENSUAL
  // =====================================================

  const categoriesWithMonthlyBudget = useMemo(() => {
    return categories.map(cat => {
      const budgetInOriginal = getCategoryBudgetForMonth(cat.id, selectedBudgetMonth);
      const spentInOriginal = getCategorySpentForMonth(cat.id, selectedBudgetMonth);
      
      const budgetConverted = convertCurrency(budgetInOriginal, cat.currency, displayCurrency);
      const spentConverted = convertCurrency(spentInOriginal, cat.currency, displayCurrency);
      
      return {
        ...cat,
        // flowKind garantizado por migrateCategoriesToFlowKind al cargar
        flowKind: cat.flowKind,
        budget: budgetConverted,
        spent: spentConverted,
        budgetOriginal: budgetInOriginal,
        spentOriginal: spentInOriginal,
        budgetInDisplayCurrency: budgetConverted,
        spentInDisplayCurrency: spentConverted
      };
    });
  }, [categories, selectedBudgetMonth, monthlyBudgets, displayCurrency, transactions, getCategoryBudgetForMonth, getCategorySpentForMonth, convertCurrency]);

  // =====================================================
  // ACTUALIZAR PRESUPUESTO
  // =====================================================

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

  // =====================================================
  // CRUD CATEGORÍAS
  // =====================================================

  const updateCategory = useCallback((categoryId, updates) => {
    const { budget, spent, ...metadataUpdates } = updates;
    
    // ✅ M36: Si se actualiza type pero no flowKind, inferirlo
    if (metadataUpdates.type && !metadataUpdates.flowKind) {
      const tempCat = { ...metadataUpdates };
      metadataUpdates.flowKind = inferFlowKind(tempCat);
    }
    
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

  // ✅ M36: Import actualizado para incluir flowKind
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

      const type = ['income', 'expense', 'savings', 'investment'].includes(cat.type?.toLowerCase()) 
        ? cat.type.toLowerCase() : 'expense';

      const newCategory = {
        id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: cat.name.trim(),
        group: cat.group.trim(),
        budget: Math.max(0, parseFloat(cat.budget) || 0),
        spent: 0,
        currency: ['EUR', 'CLP', 'USD', 'UF'].includes(cat.currency?.toUpperCase()) 
          ? cat.currency.toUpperCase() : 'EUR',
        icon: cat.icon || '📁',
        type: type,
        // ✅ M36: Agregar flowKind (puede venir del import o inferirse)
        flowKind: cat.flowKind || inferFlowKind({ type, group: cat.group, name: cat.name })
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

  // =====================================================
  // ✅ M36: FUNCIÓN PARA MIGRAR TODAS LAS CATEGORÍAS
  // =====================================================
  
  const migrateAllCategoriesToFlowKind = useCallback(() => {
    setCategories(prev => migrateCategoriesToFlowKind(prev));
    return { success: true, message: 'Migración completada' };
  }, []);

  // =====================================================
  // VALUE
  // =====================================================

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
    importCategories,
    
    // ✅ M36: Nuevas funciones
    migrateAllCategoriesToFlowKind,
    inferFlowKind
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
    importCategories,
    migrateAllCategoriesToFlowKind
  ]);

  return (
    <BudgetContext.Provider value={value}>
      {children}
    </BudgetContext.Provider>
  );
}

// Re-exportar para compatibilidad con importadores directos de BudgetContext
export { getFlowKind as inferFlowKind } from '../domain/flowKind';