// src/context/DebtsContext.jsx
// ✅ M26: Sub-contexto para gestión de deudas
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
  const [debts, setDebts] = useState(() => 
    StorageManager.load('debts_v5', INITIAL_DEBTS)
  );

  // Auto-save
  useEffect(() => { 
    StorageManager.save('debts_v5', debts); 
  }, [debts]);

  const addDebt = useCallback((debt) => {
    const newDebt = {
      id: `debt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: debt.name || 'Nueva Deuda',
      initialAmount: parseFloat(debt.initialAmount) || 0,
      currentBalance: parseFloat(debt.currentBalance) || parseFloat(debt.initialAmount) || 0,
      currency: debt.currency || 'EUR',
      interestRate: parseFloat(debt.interestRate) || 0,
      dueDate: debt.dueDate || null,
      notes: debt.notes || '',
      paymentHistory: [],
      createdAt: new Date().toISOString()
    };

    setDebts(prev => [...prev, newDebt]);
    return true;
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

  const registerDebtPayment = useCallback((debtId, amount, date = new Date().toISOString().split('T')[0]) => {
    setDebts(prev => {
      const debt = prev.find(d => d.id === debtId);
      if (!debt) return prev;

      const payment = {
        id: `payment_${Date.now()}`,
        amount: parseFloat(amount),
        date: date,
        timestamp: new Date().toISOString()
      };

      const newBalance = debt.currentBalance - parseFloat(amount);

      return prev.map(d => 
        d.id === debtId 
          ? { 
              ...d, 
              currentBalance: Math.max(0, newBalance),
              paymentHistory: [...(d.paymentHistory || []), payment],
              updatedAt: new Date().toISOString()
            }
          : d
      );
    });
    return true;
  }, []);

  const value = useMemo(() => ({
    debts,
    setDebts,
    addDebt,
    updateDebt,
    deleteDebt,
    registerDebtPayment
  }), [
    debts,
    addDebt,
    updateDebt,
    deleteDebt,
    registerDebtPayment
  ]);

  return (
    <DebtsContext.Provider value={value}>
      {children}
    </DebtsContext.Provider>
  );
}