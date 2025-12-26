// src/context/DebtsContext.jsx
// ✅ M36 Fase 4: Sub-contexto para gestión de deudas con balanceHistory
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import StorageManager from '../modules/storage/StorageManager';
import { INITIAL_DEBTS } from '../config/initialData';

const DebtsContext = createContext();

export const useDebts = () => {
  const context = useContext(DebtsContext);
  if (!context) {
    throw new Error('useDebts debe usarse dentro de DebtsProvider');
  }
  return context;
};

export function DebtsProvider({ children }) {
  const [debts, setDebts] = useState(() => {
    const loaded = StorageManager.load('debts_v5', INITIAL_DEBTS);
    // Migrar deudas existentes para agregar balanceHistory si no existe
    return loaded.map(debt => ({
      ...debt,
      balanceHistory: debt.balanceHistory || []
    }));
  });

  // Auto-save
  useEffect(() => { 
    StorageManager.save('debts_v5', debts); 
  }, [debts]);

  // =====================================================
  // CRUD BÁSICO
  // =====================================================

  const addDebt = useCallback((debt) => {
    const now = new Date().toISOString();
    const initialBalance = parseFloat(debt.currentBalance) || parseFloat(debt.initialAmount) || 0;
    
    const newDebt = {
      id: `debt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: debt.name || 'Nueva Deuda',
      type: debt.type || 'Otro',
      initialAmount: parseFloat(debt.initialAmount) || 0,
      originalAmount: parseFloat(debt.originalAmount) || parseFloat(debt.initialAmount) || 0,
      currentBalance: initialBalance,
      currency: debt.currency || 'EUR',
      interestRate: parseFloat(debt.interestRate) || 0,
      monthlyPayment: parseFloat(debt.monthlyPayment) || 0,
      dueDate: debt.dueDate || null,
      notes: debt.notes || '',
      paymentHistory: [],
      // ✅ M36 Fase 4: Inicializar balanceHistory con el balance inicial
      balanceHistory: [{
        id: `bh_${Date.now()}`,
        date: now.split('T')[0],
        balance: initialBalance,
        note: 'Balance inicial',
        type: 'initial',
        createdAt: now
      }],
      createdAt: now
    };

    setDebts(prev => [...prev, newDebt]);
    return newDebt;
  }, []);

  const updateDebt = useCallback((debtId, updates) => {
    setDebts(prev => prev.map(debt => 
      debt.id === debtId 
        ? { ...debt, ...updates, updatedAt: new Date().toISOString() }
        : debt
    ));
    return true;
  }, []);

  const deleteDebt = useCallback((debtId) => {
    setDebts(prev => prev.filter(debt => debt.id !== debtId));
    return true;
  }, []);

  // =====================================================
  // PAGOS
  // =====================================================

  const registerDebtPayment = useCallback((debtId, amount, date = new Date().toISOString().split('T')[0], note = '') => {
    const now = new Date().toISOString();
    
    setDebts(prev => {
      const debt = prev.find(d => d.id === debtId);
      if (!debt) return prev;

      const paymentAmount = parseFloat(amount);
      const newBalance = Math.max(0, debt.currentBalance - paymentAmount);

      const payment = {
        id: `payment_${Date.now()}`,
        amount: paymentAmount,
        date: date,
        note: note,
        timestamp: now
      };

      // ✅ M36 Fase 4: Agregar entrada a balanceHistory automáticamente
      const balanceEntry = {
        id: `bh_${Date.now()}`,
        date: date,
        balance: newBalance,
        note: note || `Pago de ${paymentAmount}`,
        type: 'payment',
        paymentId: payment.id,
        createdAt: now
      };

      return prev.map(d => 
        d.id === debtId 
          ? { 
              ...d, 
              currentBalance: newBalance,
              paymentHistory: [...(d.paymentHistory || []), payment],
              balanceHistory: [...(d.balanceHistory || []), balanceEntry],
              updatedAt: now
            }
          : d
      );
    });
    return true;
  }, []);

  // =====================================================
  // ✅ M36 FASE 4: BALANCE HISTORY
  // =====================================================

  /**
   * Agregar entrada manual al historial de balance
   * Útil para actualizar el saldo real de una deuda (ej: después de consultar el banco)
   */
  const addBalanceEntry = useCallback((debtId, entry) => {
    const now = new Date().toISOString();
    
    setDebts(prev => {
      const debt = prev.find(d => d.id === debtId);
      if (!debt) return prev;

      const newEntry = {
        id: `bh_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        date: entry.date || now.split('T')[0],
        balance: parseFloat(entry.balance),
        note: entry.note || '',
        type: entry.type || 'manual',
        createdAt: now
      };

      // Actualizar currentBalance con el nuevo valor
      const newBalance = parseFloat(entry.balance);

      return prev.map(d => 
        d.id === debtId 
          ? { 
              ...d, 
              currentBalance: newBalance,
              balanceHistory: [...(d.balanceHistory || []), newEntry].sort((a, b) => 
                new Date(a.date) - new Date(b.date)
              ),
              updatedAt: now
            }
          : d
      );
    });
    return true;
  }, []);

  /**
   * Actualizar una entrada existente del historial
   */
  const updateBalanceEntry = useCallback((debtId, entryId, updates) => {
    const now = new Date().toISOString();
    
    setDebts(prev => prev.map(debt => {
      if (debt.id !== debtId) return debt;
      
      const updatedHistory = (debt.balanceHistory || []).map(entry => 
        entry.id === entryId 
          ? { ...entry, ...updates, updatedAt: now }
          : entry
      ).sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Si se actualizó el balance más reciente, actualizar currentBalance
      const mostRecent = updatedHistory[updatedHistory.length - 1];
      const newCurrentBalance = mostRecent ? mostRecent.balance : debt.currentBalance;
      
      return {
        ...debt,
        balanceHistory: updatedHistory,
        currentBalance: newCurrentBalance,
        updatedAt: now
      };
    }));
    return true;
  }, []);

  /**
   * Eliminar una entrada del historial
   */
  const deleteBalanceEntry = useCallback((debtId, entryId) => {
    const now = new Date().toISOString();
    
    setDebts(prev => prev.map(debt => {
      if (debt.id !== debtId) return debt;
      
      const entry = debt.balanceHistory?.find(e => e.id === entryId);
      if (!entry || entry.type === 'initial') {
        // No permitir eliminar la entrada inicial
        return debt;
      }
      
      const updatedHistory = (debt.balanceHistory || [])
        .filter(e => e.id !== entryId)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Recalcular currentBalance con el más reciente
      const mostRecent = updatedHistory[updatedHistory.length - 1];
      const newCurrentBalance = mostRecent ? mostRecent.balance : debt.initialAmount;
      
      return {
        ...debt,
        balanceHistory: updatedHistory,
        currentBalance: newCurrentBalance,
        updatedAt: now
      };
    }));
    return true;
  }, []);

  /**
   * Obtener historial de balance ordenado por fecha
   */
  const getBalanceHistory = useCallback((debtId) => {
    const debt = debts.find(d => d.id === debtId);
    if (!debt) return [];
    
    return [...(debt.balanceHistory || [])].sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
  }, [debts]);

  /**
   * Obtener balance en una fecha específica (interpolación)
   */
  const getBalanceAtDate = useCallback((debtId, targetDate) => {
    const history = getBalanceHistory(debtId);
    if (history.length === 0) return null;
    
    const target = new Date(targetDate);
    
    // Buscar la entrada más cercana anterior o igual a la fecha
    let closestEntry = null;
    for (const entry of history) {
      const entryDate = new Date(entry.date);
      if (entryDate <= target) {
        closestEntry = entry;
      } else {
        break;
      }
    }
    
    return closestEntry ? closestEntry.balance : history[0].balance;
  }, [getBalanceHistory]);

  /**
   * Calcular reducción de deuda en un período
   */
  const getDebtReduction = useCallback((debtId, startDate, endDate) => {
    const startBalance = getBalanceAtDate(debtId, startDate);
    const endBalance = getBalanceAtDate(debtId, endDate);
    
    if (startBalance === null || endBalance === null) return null;
    
    return {
      startBalance,
      endBalance,
      reduction: startBalance - endBalance,
      percentReduction: startBalance > 0 ? ((startBalance - endBalance) / startBalance) * 100 : 0
    };
  }, [getBalanceAtDate]);

  // =====================================================
  // VALUE
  // =====================================================

  const value = useMemo(() => ({
    debts,
    setDebts,
    // CRUD básico
    addDebt,
    updateDebt,
    deleteDebt,
    // Pagos
    registerDebtPayment,
    // ✅ M36 Fase 4: Balance History
    addBalanceEntry,
    updateBalanceEntry,
    deleteBalanceEntry,
    getBalanceHistory,
    getBalanceAtDate,
    getDebtReduction
  }), [
    debts,
    addDebt,
    updateDebt,
    deleteDebt,
    registerDebtPayment,
    addBalanceEntry,
    updateBalanceEntry,
    deleteBalanceEntry,
    getBalanceHistory,
    getBalanceAtDate,
    getDebtReduction
  ]);

  return (
    <DebtsContext.Provider value={value}>
      {children}
    </DebtsContext.Provider>
  );
}