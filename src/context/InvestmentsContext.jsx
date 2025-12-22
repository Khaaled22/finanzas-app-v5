// src/context/InvestmentsContext.jsx
// ✅ M33: Simplificado - Solo plataformas con balance global (sin holdings/activos)
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import StorageManager from '../modules/storage/StorageManager';

const InvestmentsContext = createContext();

// ✅ M33: Tipos de objetivo para plataformas
export const PLATFORM_GOALS = [
  { id: 'fi_step1', name: 'FI Step 1', icon: '💰', description: 'Liquidez inmediata', color: 'blue' },
  { id: 'emergency', name: 'Fondo Emergencia', icon: '🛟', description: 'Reserva de emergencia', color: 'green' },
  { id: 'down_payment', name: 'Pie/Down Payment', icon: '🏠', description: 'Ahorro para compra grande', color: 'purple' },
  { id: 'real_state', name: 'Real State', icon: '🏢', description: 'Inversión inmobiliaria', color: 'orange' },
  { id: 'retirement', name: 'Jubilación', icon: '👴', description: 'Ahorro previsional (APV)', color: 'indigo' },
  { id: 'growth', name: 'Crecimiento', icon: '📈', description: 'Inversión a largo plazo', color: 'cyan' },
  { id: 'cash', name: 'Cash/Efectivo', icon: '💵', description: 'Dinero disponible', color: 'gray' },
  { id: 'other', name: 'Otro', icon: '📦', description: 'Otra inversión', color: 'slate' }
];

// ✅ M33: Subtipos de plataforma
export const PLATFORM_SUBTYPES = [
  { id: 'fondos_mutuos', name: 'Fondos Mutuos', icon: '📊' },
  { id: 'etf', name: 'ETF', icon: '📈' },
  { id: 'acciones', name: 'Acciones', icon: '📉' },
  { id: 'money_market', name: 'Money Market', icon: '💵' },
  { id: 'deposito', name: 'Depósito a Plazo', icon: '🏦' },
  { id: 'cuenta', name: 'Cuenta Corriente/Ahorro', icon: '💳' },
  { id: 'crypto', name: 'Crypto', icon: '₿' },
  { id: 'real_state', name: 'Real State', icon: '🏢' },
  { id: 'apv', name: 'APV', icon: '👴' },
  { id: 'otro', name: 'Otro', icon: '📦' }
];

export const useInvestments = () => {
  const context = useContext(InvestmentsContext);
  if (!context) {
    throw new Error('useInvestments debe usarse dentro de InvestmentsProvider');
  }
  return context;
};

// Datos iniciales vacíos
const INITIAL_INVESTMENTS = [];
const INITIAL_SAVINGS_GOALS = [];

export function InvestmentsProvider({ children }) {
  const [investments, setInvestments] = useState(() => 
    StorageManager.load('investments_v5', INITIAL_INVESTMENTS)
  );

  const [savingsGoals, setSavingsGoals] = useState(() => 
    StorageManager.load('savingsGoals_v5', INITIAL_SAVINGS_GOALS)
  );

  // Auto-save
  useEffect(() => { 
    StorageManager.save('investments_v5', investments); 
  }, [investments]);

  useEffect(() => { 
    StorageManager.save('savingsGoals_v5', savingsGoals); 
  }, [savingsGoals]);

  // ✅ Actualizar savings vinculados
  const updateLinkedSavingsGoals = useCallback((platformId, newBalance) => {
    setSavingsGoals(prev => {
      const hasLinked = prev.some(goal => 
        goal.linkedPlatform === platformId || 
        (goal.linkedPlatforms && goal.linkedPlatforms.includes(platformId))
      );
      if (!hasLinked) return prev;

      return prev.map(goal => {
        if (goal.linkedPlatform === platformId || 
            (goal.linkedPlatforms && goal.linkedPlatforms.includes(platformId))) {
          return {
            ...goal,
            currentAmount: newBalance,
            updatedAt: new Date().toISOString()
          };
        }
        return goal;
      });
    });
  }, []);

  // ===================== PLATAFORMAS =====================

  /**
   * ✅ M33: Crear/actualizar plataforma (único método)
   */
  const savePlatform = useCallback((platformData) => {
    const isNew = !platformData.id;
    const platformId = platformData.id || `platform_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const platform = {
      id: platformId,
      name: platformData.name?.trim() || 'Nueva Plataforma',
      goal: platformData.goal || 'other',
      subtype: platformData.subtype || 'otro',
      currency: platformData.currency || 'EUR',
      isLiquid: platformData.isLiquid !== false, // Default true
      currentBalance: parseFloat(platformData.currentBalance) || 0,
      notes: platformData.notes || '',
      balanceHistory: platformData.balanceHistory || [],
      isArchived: platformData.isArchived || false,
      createdAt: platformData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Si es nueva y tiene balance inicial, agregar al historial
    if (isNew && platform.currentBalance > 0 && platform.balanceHistory.length === 0) {
      platform.balanceHistory.push({
        id: `balance_${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        balance: platform.currentBalance,
        note: 'Balance inicial',
        timestamp: new Date().toISOString()
      });
    }

    setInvestments(prev => {
      if (platformData.id) {
        // Actualizar existente
        return prev.map(inv => inv.id === platformId ? { ...inv, ...platform } : inv);
      } else {
        // Crear nueva
        return [...prev, platform];
      }
    });

    updateLinkedSavingsGoals(platformId, platform.currentBalance);
    return platformId;
  }, [updateLinkedSavingsGoals]);

  /**
   * ✅ M33: Eliminar plataforma
   */
  const deletePlatform = useCallback((platformId) => {
    setInvestments(prev => prev.filter(inv => inv.id !== platformId));
    return true;
  }, []);

  /**
   * ✅ M33: Archivar plataforma (en vez de eliminar)
   */
  const archivePlatform = useCallback((platformId) => {
    setInvestments(prev => prev.map(inv => 
      inv.id === platformId 
        ? { ...inv, isArchived: true, currentBalance: 0, updatedAt: new Date().toISOString() }
        : inv
    ));
    return true;
  }, []);

  /**
   * ✅ M33: Restaurar plataforma archivada
   */
  const restorePlatform = useCallback((platformId) => {
    setInvestments(prev => prev.map(inv => 
      inv.id === platformId 
        ? { ...inv, isArchived: false, updatedAt: new Date().toISOString() }
        : inv
    ));
    return true;
  }, []);

  /**
   * ✅ M33: Actualizar balance de plataforma
   */
  const updatePlatformBalance = useCallback((platformId, newBalance, note = '') => {
    setInvestments(prev => prev.map(inv => {
      if (inv.id !== platformId) return inv;
      
      const balanceEntry = {
        id: `balance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        date: new Date().toISOString().split('T')[0],
        balance: parseFloat(newBalance) || 0,
        note: note || 'Actualización manual',
        timestamp: new Date().toISOString()
      };
      
      return {
        ...inv,
        currentBalance: parseFloat(newBalance) || 0,
        balanceHistory: [...(inv.balanceHistory || []), balanceEntry],
        updatedAt: new Date().toISOString()
      };
    }));
    
    updateLinkedSavingsGoals(platformId, parseFloat(newBalance) || 0);
    return true;
  }, [updateLinkedSavingsGoals]);

  // ===================== HISTORIAL DE BALANCE =====================

  /**
   * ✅ M33: Agregar entrada al historial manualmente
   */
  const addBalanceEntry = useCallback((platformId, entry) => {
    setInvestments(prev => {
      const platform = prev.find(inv => inv.id === platformId);
      if (!platform) return prev;

      const newEntry = {
        id: `balance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        date: entry.date || new Date().toISOString().split('T')[0],
        balance: parseFloat(entry.balance) || 0,
        note: entry.note || '',
        timestamp: new Date().toISOString()
      };

      // Ordenar historial por fecha
      const newHistory = [...(platform.balanceHistory || []), newEntry]
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      // Si la nueva entrada es la más reciente, actualizar currentBalance
      const latestEntry = newHistory[newHistory.length - 1];
      const isLatest = latestEntry.id === newEntry.id;

      return prev.map(inv => 
        inv.id === platformId 
          ? { 
              ...inv, 
              balanceHistory: newHistory,
              currentBalance: isLatest ? newEntry.balance : inv.currentBalance,
              updatedAt: new Date().toISOString() 
            }
          : inv
      );
    });
    return true;
  }, []);

  /**
   * ✅ M33: Actualizar entrada del historial
   */
  const updateBalanceEntry = useCallback((platformId, entryId, updates) => {
    setInvestments(prev => prev.map(inv => {
      if (inv.id !== platformId) return inv;

      const newHistory = (inv.balanceHistory || []).map(entry => 
        entry.id === entryId 
          ? { ...entry, ...updates, updatedAt: new Date().toISOString() }
          : entry
      ).sort((a, b) => new Date(a.date) - new Date(b.date));

      // Actualizar currentBalance con el último del historial
      const latestEntry = newHistory[newHistory.length - 1];

      return {
        ...inv,
        balanceHistory: newHistory,
        currentBalance: latestEntry ? latestEntry.balance : inv.currentBalance,
        updatedAt: new Date().toISOString()
      };
    }));
    return true;
  }, []);

  /**
   * ✅ M33: Eliminar entrada del historial
   */
  const deleteBalanceEntry = useCallback((platformId, entryId) => {
    setInvestments(prev => prev.map(inv => {
      if (inv.id !== platformId) return inv;

      const newHistory = (inv.balanceHistory || []).filter(entry => entry.id !== entryId);
      const latestEntry = newHistory[newHistory.length - 1];

      return {
        ...inv,
        balanceHistory: newHistory,
        currentBalance: latestEntry ? latestEntry.balance : 0,
        updatedAt: new Date().toISOString()
      };
    }));
    return true;
  }, []);

  /**
   * ✅ M33: Reemplazar historial completo
   */
  const updateBalanceHistory = useCallback((platformId, newHistory) => {
    setInvestments(prev => prev.map(inv => {
      if (inv.id !== platformId) return inv;

      const sortedHistory = [...newHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
      const latestEntry = sortedHistory[sortedHistory.length - 1];

      return {
        ...inv,
        balanceHistory: sortedHistory,
        currentBalance: latestEntry ? latestEntry.balance : 0,
        updatedAt: new Date().toISOString()
      };
    }));
    return true;
  }, []);

  // ===================== CÁLCULOS =====================

  /**
   * ✅ M33: Calcular ROI mensual (vs mes anterior)
   */
  const calculatePlatformROI = useCallback((platform) => {
    const history = platform.balanceHistory || [];
    if (history.length < 2) return { roi: 0, change: 0, hasPreviousMonth: false };

    // Ordenar por fecha
    const sorted = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Obtener mes actual y anterior
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonth = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;

    // Buscar balance del mes anterior
    const prevMonthEntry = sorted.filter(e => e.date.startsWith(previousMonth)).pop();
    const currentBalance = platform.currentBalance;

    if (!prevMonthEntry) {
      // Si no hay mes anterior, comparar con primera entrada
      const firstEntry = sorted[0];
      if (firstEntry) {
        const change = currentBalance - firstEntry.balance;
        const roi = firstEntry.balance > 0 ? (change / firstEntry.balance) * 100 : 0;
        return { roi, change, hasPreviousMonth: false, compareDate: firstEntry.date };
      }
      return { roi: 0, change: 0, hasPreviousMonth: false };
    }

    const change = currentBalance - prevMonthEntry.balance;
    const roi = prevMonthEntry.balance > 0 ? (change / prevMonthEntry.balance) * 100 : 0;
    
    return { roi, change, hasPreviousMonth: true, compareDate: prevMonthEntry.date };
  }, []);

  // ===================== AHORROS =====================

  const addSavingsGoal = useCallback((goal) => {
    const newGoal = {
      id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: goal.name || 'Nueva Meta',
      targetAmount: parseFloat(goal.targetAmount) || 0,
      currentAmount: parseFloat(goal.currentAmount) || 0,
      currency: goal.currency || 'EUR',
      deadline: goal.deadline || null,
      notes: goal.notes || '',
      contributionHistory: [],
      linkedPlatform: goal.linkedPlatform || null,
      linkedPlatforms: goal.linkedPlatforms || [],
      isEmergencyFund: goal.isEmergencyFund || false,
      createdAt: new Date().toISOString()
    };

    setSavingsGoals(prev => [...prev, newGoal]);
    return newGoal.id;
  }, []);

  const updateSavingsGoal = useCallback((goalId, updates) => {
    setSavingsGoals(prev => prev.map(goal => 
      goal.id === goalId 
        ? { ...goal, ...updates, updatedAt: new Date().toISOString() }
        : goal
    ));
    return true;
  }, []);

  const deleteSavingsGoal = useCallback((goalId) => {
    setSavingsGoals(prev => prev.filter(goal => goal.id !== goalId));
    return true;
  }, []);

  const registerSavingsContribution = useCallback((goalId, amount, date = new Date().toISOString().split('T')[0]) => {
    setSavingsGoals(prev => {
      const goal = prev.find(g => g.id === goalId);
      if (!goal) return prev;

      const contribution = {
        id: `contrib_${Date.now()}`,
        amount: parseFloat(amount),
        date: date,
        timestamp: new Date().toISOString()
      };

      const newAmount = goal.currentAmount + parseFloat(amount);

      return prev.map(g => 
        g.id === goalId 
          ? { 
              ...g, 
              currentAmount: newAmount,
              contributionHistory: [...(g.contributionHistory || []), contribution],
              updatedAt: new Date().toISOString()
            }
          : g
      );
    });
    return true;
  }, []);

  // ===================== COMPATIBILIDAD =====================
  
  // Mantener funciones antiguas para compatibilidad
  const addInvestment = savePlatform;
  const updateInvestment = useCallback((id, updates) => {
    setInvestments(prev => prev.map(inv => 
      inv.id === id ? { ...inv, ...updates, updatedAt: new Date().toISOString() } : inv
    ));
  }, []);
  const deleteInvestment = deletePlatform;

  // ===================== VALOR =====================

  const value = useMemo(() => ({
    // Estados
    investments,
    setInvestments,
    savingsGoals,
    setSavingsGoals,
    
    // Constantes
    PLATFORM_GOALS,
    PLATFORM_SUBTYPES,
    
    // Funciones Plataformas
    savePlatform,
    deletePlatform,
    archivePlatform,
    restorePlatform,
    updatePlatformBalance,
    calculatePlatformROI,
    
    // Funciones Historial
    addBalanceEntry,
    updateBalanceEntry,
    deleteBalanceEntry,
    updateBalanceHistory,
    
    // Funciones Ahorros
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    registerSavingsContribution,
    updateLinkedSavingsGoals,
    
    // Compatibilidad
    addInvestment,
    updateInvestment,
    deleteInvestment
  }), [
    investments,
    savingsGoals,
    savePlatform,
    deletePlatform,
    archivePlatform,
    restorePlatform,
    updatePlatformBalance,
    calculatePlatformROI,
    addBalanceEntry,
    updateBalanceEntry,
    deleteBalanceEntry,
    updateBalanceHistory,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    registerSavingsContribution,
    updateLinkedSavingsGoals,
    addInvestment,
    updateInvestment,
    deleteInvestment
  ]);

  return (
    <InvestmentsContext.Provider value={value}>
      {children}
    </InvestmentsContext.Provider>
  );
}