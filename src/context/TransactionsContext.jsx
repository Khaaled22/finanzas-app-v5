// src/context/TransactionsContext.jsx
// ✅ M26: Sub-contexto para gestión de transacciones
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import StorageManager from '../modules/storage/StorageManager';
import { INITIAL_TRANSACTIONS } from '../config/initialData';

const TransactionsContext = createContext();

export const useTransactions = () => {
  const context = useContext(TransactionsContext);
  if (!context) {
    throw new Error('useTransactions debe usarse dentro de TransactionsProvider');
  }
  return context;
};

export function TransactionsProvider({ children, currentUser }) {
  const [transactions, setTransactions] = useState(() => 
    StorageManager.load('transactions_v5', INITIAL_TRANSACTIONS)
  );

  // Auto-save
  useEffect(() => { 
    StorageManager.save('transactions_v5', transactions); 
  }, [transactions]);

  // ✅ Agregar transacción
  const addTransaction = useCallback((transaction) => {
    const newTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: transaction.date || new Date().toISOString().split('T')[0],
      description: transaction.description || 'Sin descripción',
      amount: parseFloat(transaction.amount) || 0,
      currency: transaction.currency || 'EUR',
      categoryId: transaction.categoryId || null,
      paymentMethod: transaction.paymentMethod || 'Tarjeta',
      notes: transaction.notes || '',
      imported: transaction.imported || false,
      importedAt: transaction.importedAt || null,
      createdAt: new Date().toISOString(),
      user: transaction.user || currentUser
    };

    setTransactions(prev => [...prev, newTransaction]);
    return true;
  }, [currentUser]);

  // ✅ Agregar transacciones en batch
  const addTransactionsBatch = useCallback((transactionsArray) => {
    if (!Array.isArray(transactionsArray) || transactionsArray.length === 0) {
      return { success: false, count: 0 };
    }

    const timestamp = Date.now();
    
    const newTransactions = transactionsArray.map((tx, index) => ({
      id: `tx_${timestamp}_${index}_${Math.random().toString(36).substr(2, 9)}`,
      date: tx.date || new Date().toISOString().split('T')[0],
      description: tx.description || 'Sin descripción',
      amount: parseFloat(tx.amount) || 0,
      currency: tx.currency || 'EUR',
      categoryId: tx.categoryId || null,
      paymentMethod: tx.paymentMethod || 'Tarjeta',
      notes: tx.notes || '',
      imported: tx.imported || false,
      importedAt: tx.importedAt || null,
      createdAt: new Date().toISOString(),
      user: tx.user || currentUser
    }));

    setTransactions(prev => [...prev, ...newTransactions]);
    return { success: true, count: newTransactions.length };
  }, [currentUser]);

  // ✅ Actualizar transacción
  const updateTransaction = useCallback((transactionId, updates) => {
    setTransactions(prev => prev.map(tx => 
      tx.id === transactionId 
        ? { ...tx, ...updates, updatedAt: new Date().toISOString() }
        : tx
    ));
    return true;
  }, []);

  // ✅ Eliminar transacción
  const deleteTransaction = useCallback((transactionId) => {
    setTransactions(prev => prev.filter(tx => tx.id !== transactionId));
    return true;
  }, []);

  // ✅ Limpiar todas
  const clearAllTransactions = useCallback(() => {
    setTransactions([]);
    return true;
  }, []);

  // ✅ M25: Índice pre-calculado por mes y categoría
  const transactionIndex = useMemo(() => {
    const index = {
      byMonth: {},
      byCategory: {},
      byMonthAndCategory: {}
    };

    transactions.forEach(tx => {
      const month = tx.date?.slice(0, 7);
      const catId = tx.categoryId;

      // Por mes
      if (month) {
        if (!index.byMonth[month]) index.byMonth[month] = [];
        index.byMonth[month].push(tx);
      }

      // Por categoría
      if (catId) {
        if (!index.byCategory[catId]) index.byCategory[catId] = [];
        index.byCategory[catId].push(tx);
      }

      // Por mes Y categoría
      if (month && catId) {
        const key = `${month}:${catId}`;
        if (!index.byMonthAndCategory[key]) index.byMonthAndCategory[key] = [];
        index.byMonthAndCategory[key].push(tx);
      }
    });

    return index;
  }, [transactions]);

  // ✅ M25: Obtener transacciones por mes (O(1) en vez de O(n))
  const getTransactionsByMonth = useCallback((month) => {
    return transactionIndex.byMonth[month] || [];
  }, [transactionIndex]);

  // ✅ M25: Obtener transacciones por categoría y mes (O(1))
  const getTransactionsByCategoryAndMonth = useCallback((categoryId, month) => {
    const key = `${month}:${categoryId}`;
    return transactionIndex.byMonthAndCategory[key] || [];
  }, [transactionIndex]);

  const value = useMemo(() => ({
    transactions,
    setTransactions,
    addTransaction,
    addTransactionsBatch,
    updateTransaction,
    deleteTransaction,
    clearAllTransactions,
    // M25: Funciones optimizadas
    transactionIndex,
    getTransactionsByMonth,
    getTransactionsByCategoryAndMonth
  }), [
    transactions,
    addTransaction,
    addTransactionsBatch,
    updateTransaction,
    deleteTransaction,
    clearAllTransactions,
    transactionIndex,
    getTransactionsByMonth,
    getTransactionsByCategoryAndMonth
  ]);

  return (
    <TransactionsContext.Provider value={value}>
      {children}
    </TransactionsContext.Provider>
  );
}