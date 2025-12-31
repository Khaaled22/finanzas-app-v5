// src/context/TransactionsContext.jsx
// ✅ M38: Migración completa a Supabase con fallback localStorage
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import StorageManager from '../modules/storage/StorageManager';
import { INITIAL_TRANSACTIONS } from '../config/initialData';

const TransactionsContext = createContext();

// =====================================================
// SUPABASE SINGLETON (evita múltiples instancias)
// =====================================================

let supabaseInstance = null;
let supabasePromise = null;

const getSupabase = async () => {
  if (supabaseInstance) return supabaseInstance;
  
  if (supabasePromise) return supabasePromise;
  
  supabasePromise = (async () => {
    try {
      const { supabase } = await import('../modules/supabase/client');
      supabaseInstance = supabase;
      return supabase;
    } catch (e) {
      console.log('⚠️ Supabase no disponible');
      return null;
    }
  })();
  
  return supabasePromise;
};

const getUserId = async (supabase) => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
};

// =====================================================
// UUID HELPER
// =====================================================

// Verifica si un string es un UUID válido
const isValidUUID = (str) => {
  if (!str || typeof str !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// =====================================================
// MAPPERS: Local ↔ Supabase
// =====================================================

const mapToSupabase = (tx, userId) => ({
  // No enviar ID - dejar que Supabase genere UUID
  user_id: userId,
  // Solo enviar category_id si es UUID válido, sino null
  category_id: isValidUUID(tx.categoryId) ? tx.categoryId : null,
  date: tx.date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
  amount: parseFloat(tx.amount) || 0,
  currency: tx.currency || 'EUR',
  description: tx.description || '',
  notes: tx.notes || null,
  payment_method: tx.paymentMethod || 'Tarjeta',
  imported: tx.imported || false,
  import_source: tx.importedAt ? 'excel' : null,
  original_description: tx.originalDescription || null,
  is_recurring: tx.isRecurring || false,
  recurring_id: isValidUUID(tx.recurringId) ? tx.recurringId : null
});

const mapFromSupabase = (row) => ({
  id: row.id,
  categoryId: row.category_id,
  date: row.date,
  amount: parseFloat(row.amount),
  currency: row.currency || 'EUR',
  description: row.description || '',
  notes: row.notes || '',
  paymentMethod: row.payment_method || 'Tarjeta',
  imported: row.imported || false,
  importedAt: row.import_source ? row.created_at : null,
  originalDescription: row.original_description,
  isRecurring: row.is_recurring || false,
  recurringId: row.recurring_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

// =====================================================
// HOOK & PROVIDER
// =====================================================

export const useTransactions = () => {
  const context = useContext(TransactionsContext);
  if (!context) {
    throw new Error('useTransactions debe usarse dentro de TransactionsProvider');
  }
  return context;
};

export function TransactionsProvider({ children, currentUser }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState({ synced: false, error: null });
  
  const initialLoadDone = useRef(false);
  const isMounted = useRef(true);

  // =====================================================
  // CARGAR DATOS AL INICIAR
  // =====================================================
  
  useEffect(() => {
    isMounted.current = true;
    
    const loadData = async () => {
      if (initialLoadDone.current) return;
      initialLoadDone.current = true;
      
      setLoading(true);
      
      try {
        const supabase = await getSupabase();
        
        if (supabase) {
          const userId = await getUserId(supabase);
          
          if (userId) {
            // Cargar desde Supabase
            const { data, error } = await supabase
              .from('transactions')
              .select('*')
              .eq('user_id', userId)
              .order('date', { ascending: false });
            
            if (error) throw error;
            
            if (isMounted.current) {
              const mapped = (data || []).map(mapFromSupabase);
              setTransactions(mapped);
              // Backup en localStorage
              StorageManager.save('transactions_v5', mapped);
              setSyncStatus({ synced: true, error: null });
              console.log(`✅ Cargadas ${mapped.length} transacciones desde Supabase`);
            }
          } else {
            // Usuario no autenticado - usar localStorage
            throw new Error('Usuario no autenticado');
          }
        } else {
          throw new Error('Supabase no disponible');
        }
      } catch (error) {
        console.log('⚠️ Fallback a localStorage:', error.message);
        
        if (isMounted.current) {
          // Fallback: cargar desde localStorage
          const local = StorageManager.load('transactions_v5', INITIAL_TRANSACTIONS);
          setTransactions(local);
          setSyncStatus({ synced: false, error: error.message });
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };
    
    loadData();
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  // =====================================================
  // GUARDAR EN LOCALSTORAGE (BACKUP)
  // =====================================================
  
  useEffect(() => {
    if (!loading && transactions.length > 0) {
      StorageManager.save('transactions_v5', transactions);
    }
  }, [transactions, loading]);

  // =====================================================
  // CRUD OPERATIONS
  // =====================================================

  const addTransaction = useCallback(async (transaction) => {
    const tempId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newTransaction = {
      id: tempId,
      date: transaction.date || new Date().toISOString().slice(0, 10),
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

    // Optimistic update
    setTransactions(prev => [newTransaction, ...prev]);

    try {
      const supabase = await getSupabase();
      if (supabase) {
        const userId = await getUserId(supabase);
        if (userId) {
          const { data, error } = await supabase
            .from('transactions')
            .insert(mapToSupabase(newTransaction, userId))
            .select()
            .single();
          
          if (error) throw error;
          
          // Reemplazar con el registro de Supabase (tiene UUID real)
          const mapped = mapFromSupabase(data);
          setTransactions(prev => 
            prev.map(t => t.id === tempId ? mapped : t)
          );
          
          return mapped;
        }
      }
    } catch (error) {
      console.error('Error guardando en Supabase:', error);
      setSyncStatus({ synced: false, error: error.message });
    }
    
    return newTransaction;
  }, [currentUser]);

  const addTransactionsBatch = useCallback(async (transactionsArray) => {
    if (!Array.isArray(transactionsArray) || transactionsArray.length === 0) {
      return { success: false, count: 0 };
    }

    const timestamp = Date.now();
    
    const newTransactions = transactionsArray.map((tx, index) => ({
      id: `tx_${timestamp}_${index}_${Math.random().toString(36).substr(2, 9)}`,
      date: tx.date || new Date().toISOString().slice(0, 10),
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

    // Optimistic update
    setTransactions(prev => [...newTransactions, ...prev]);

    try {
      const supabase = await getSupabase();
      if (supabase) {
        const userId = await getUserId(supabase);
        if (userId) {
          const toInsert = newTransactions.map(tx => mapToSupabase(tx, userId));
          
          // Insertar en batches de 500
          const batchSize = 500;
          const results = [];
          
          for (let i = 0; i < toInsert.length; i += batchSize) {
            const batch = toInsert.slice(i, i + batchSize);
            const { data, error } = await supabase
              .from('transactions')
              .insert(batch)
              .select();
            
            if (error) throw error;
            results.push(...(data || []));
          }
          
          // Reemplazar con los registros de Supabase
          const mapped = results.map(mapFromSupabase);
          const tempIds = new Set(newTransactions.map(t => t.id));
          
          setTransactions(prev => [
            ...mapped,
            ...prev.filter(t => !tempIds.has(t.id))
          ]);
          
          return { success: true, count: mapped.length };
        }
      }
    } catch (error) {
      console.error('Error en batch insert:', error);
      setSyncStatus({ synced: false, error: error.message });
    }
    
    return { success: true, count: newTransactions.length };
  }, [currentUser]);

  const updateTransaction = useCallback(async (transactionId, updates) => {
    // Optimistic update
    setTransactions(prev => prev.map(tx => 
      tx.id === transactionId 
        ? { ...tx, ...updates, updatedAt: new Date().toISOString() }
        : tx
    ));

    try {
      const supabase = await getSupabase();
      if (supabase) {
        const userId = await getUserId(supabase);
        if (userId) {
          const supabaseUpdates = {
            category_id: updates.categoryId,
            date: updates.date?.slice(0, 10),
            amount: updates.amount ? parseFloat(updates.amount) : undefined,
            currency: updates.currency,
            description: updates.description,
            notes: updates.notes,
            payment_method: updates.paymentMethod,
            updated_at: new Date().toISOString()
          };
          
          // Remover undefined
          Object.keys(supabaseUpdates).forEach(key => 
            supabaseUpdates[key] === undefined && delete supabaseUpdates[key]
          );
          
          const { error } = await supabase
            .from('transactions')
            .update(supabaseUpdates)
            .eq('id', transactionId)
            .eq('user_id', userId);
          
          if (error) throw error;
        }
      }
    } catch (error) {
      console.error('Error actualizando en Supabase:', error);
      setSyncStatus({ synced: false, error: error.message });
    }
    
    return true;
  }, []);

  const deleteTransaction = useCallback(async (transactionId) => {
    // Optimistic update
    setTransactions(prev => prev.filter(tx => tx.id !== transactionId));

    try {
      const supabase = await getSupabase();
      if (supabase) {
        const userId = await getUserId(supabase);
        if (userId) {
          const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('id', transactionId)
            .eq('user_id', userId);
          
          if (error) throw error;
        }
      }
    } catch (error) {
      console.error('Error eliminando en Supabase:', error);
      setSyncStatus({ synced: false, error: error.message });
    }
    
    return true;
  }, []);

  const clearAllTransactions = useCallback(async () => {
    const previousTransactions = [...transactions];
    
    // Optimistic update
    setTransactions([]);

    try {
      const supabase = await getSupabase();
      if (supabase) {
        const userId = await getUserId(supabase);
        if (userId) {
          const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('user_id', userId);
          
          if (error) throw error;
        }
      }
    } catch (error) {
      console.error('Error limpiando en Supabase:', error);
      // Rollback on error
      setTransactions(previousTransactions);
      setSyncStatus({ synced: false, error: error.message });
      return false;
    }
    
    return true;
  }, [transactions]);

  // =====================================================
  // ÍNDICES Y HELPERS (sin cambios)
  // =====================================================

  const transactionIndex = useMemo(() => {
    const index = {
      byMonth: {},
      byCategory: {},
      byMonthAndCategory: {}
    };

    transactions.forEach(tx => {
      const month = tx.date?.slice(0, 7);
      const catId = tx.categoryId;

      if (month) {
        if (!index.byMonth[month]) index.byMonth[month] = [];
        index.byMonth[month].push(tx);
      }

      if (catId) {
        if (!index.byCategory[catId]) index.byCategory[catId] = [];
        index.byCategory[catId].push(tx);
      }

      if (month && catId) {
        const key = `${month}:${catId}`;
        if (!index.byMonthAndCategory[key]) index.byMonthAndCategory[key] = [];
        index.byMonthAndCategory[key].push(tx);
      }
    });

    return index;
  }, [transactions]);

  const getTransactionsByMonth = useCallback((month) => {
    return transactionIndex.byMonth[month] || [];
  }, [transactionIndex]);

  const getTransactionsByCategoryAndMonth = useCallback((categoryId, month) => {
    const key = `${month}:${categoryId}`;
    return transactionIndex.byMonthAndCategory[key] || [];
  }, [transactionIndex]);

  // =====================================================
  // SYNC MANUAL (para forzar sincronización)
  // =====================================================

  const syncWithSupabase = useCallback(async () => {
    try {
      const supabase = await getSupabase();
      if (!supabase) throw new Error('Supabase no disponible');
      
      const userId = await getUserId(supabase);
      if (!userId) throw new Error('Usuario no autenticado');
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      const mapped = (data || []).map(mapFromSupabase);
      setTransactions(mapped);
      StorageManager.save('transactions_v5', mapped);
      setSyncStatus({ synced: true, error: null });
      
      return { success: true, count: mapped.length };
    } catch (error) {
      setSyncStatus({ synced: false, error: error.message });
      return { success: false, error: error.message };
    }
  }, []);

  // =====================================================
  // VALUE
  // =====================================================

  const value = useMemo(() => ({
    transactions,
    setTransactions,
    loading,
    syncStatus,
    addTransaction,
    addTransactionsBatch,
    updateTransaction,
    deleteTransaction,
    clearAllTransactions,
    transactionIndex,
    getTransactionsByMonth,
    getTransactionsByCategoryAndMonth,
    syncWithSupabase
  }), [
    transactions,
    loading,
    syncStatus,
    addTransaction,
    addTransactionsBatch,
    updateTransaction,
    deleteTransaction,
    clearAllTransactions,
    transactionIndex,
    getTransactionsByMonth,
    getTransactionsByCategoryAndMonth,
    syncWithSupabase
  ]);

  return (
    <TransactionsContext.Provider value={value}>
      {children}
    </TransactionsContext.Provider>
  );
}