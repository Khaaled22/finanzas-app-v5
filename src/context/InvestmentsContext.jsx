// src/context/InvestmentsContext.jsx
// ✅ M33: Simplificado - Solo plataformas con balance global (sin holdings/activos)
// ✅ M36 Fase 6: Soporte mejorado para Cash/Banco como plataforma
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import StorageManager from '../modules/storage/StorageManager';

const InvestmentsContext = createContext();

// ✅ M36 Fase 6: Tipos de objetivo actualizados con Cash/Banco prominente
export const PLATFORM_GOALS = [
  { id: 'cash', name: 'Cash/Banco', icon: '🏦', description: 'Cuentas bancarias y efectivo', color: 'emerald', isCash: true },
  { id: 'fi_step1', name: 'FI Step 1', icon: '💰', description: 'Liquidez inmediata', color: 'blue' },
  { id: 'emergency', name: 'Fondo Emergencia', icon: '🛟', description: 'Reserva de emergencia', color: 'green' },
  { id: 'down_payment', name: 'Pie/Down Payment', icon: '🏠', description: 'Ahorro para compra grande', color: 'purple' },
  { id: 'real_state', name: 'Real State', icon: '🏢', description: 'Inversión inmobiliaria', color: 'orange' },
  { id: 'retirement', name: 'Jubilación', icon: '👴', description: 'Ahorro previsional (APV)', color: 'indigo' },
  { id: 'growth', name: 'Crecimiento', icon: '📈', description: 'Inversión a largo plazo', color: 'cyan' },
  { id: 'other', name: 'Otro', icon: '📦', description: 'Otra inversión', color: 'slate' }
];

// ✅ M36 Fase 6: Subtipos actualizados con más opciones bancarias
export const PLATFORM_SUBTYPES = [
  // Cash/Banco
  { id: 'cuenta_corriente', name: 'Cuenta Corriente', icon: '🏦', forCash: true },
  { id: 'cuenta_ahorro', name: 'Cuenta de Ahorro', icon: '💳', forCash: true },
  { id: 'cuenta_vista', name: 'Cuenta Vista', icon: '👁️', forCash: true },
  { id: 'efectivo', name: 'Efectivo', icon: '💵', forCash: true },
  { id: 'deposito', name: 'Depósito a Plazo', icon: '📅', forCash: true },
  // Inversiones
  { id: 'fondos_mutuos', name: 'Fondos Mutuos', icon: '📊' },
  { id: 'etf', name: 'ETF', icon: '📈' },
  { id: 'acciones', name: 'Acciones', icon: '📉' },
  { id: 'money_market', name: 'Money Market', icon: '💵' },
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
   * ✅ M33 + M36 Fase 6: Crear/actualizar plataforma
   */
  const savePlatform = useCallback((platformData) => {
    const isNew = !platformData.id;
    const platformId = platformData.id || `platform_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    // ✅ M36 Fase 6: Detectar si es plataforma de cash
    const isCashPlatform = platformData.goal === 'cash' || 
                          ['cuenta_corriente', 'cuenta_ahorro', 'cuenta_vista', 'efectivo'].includes(platformData.subtype);
    
    const platform = {
      id: platformId,
      name: platformData.name?.trim() || 'Nueva Plataforma',
      goal: platformData.goal || 'other',
      subtype: platformData.subtype || 'otro',
      currency: platformData.currency || 'EUR',
      currentBalance: parseFloat(platformData.currentBalance) || 0,
      totalDeposited: parseFloat(platformData.totalDeposited) || parseFloat(platformData.currentBalance) || 0,
      isLiquid: platformData.isLiquid !== false,
      notes: platformData.notes || '',
      country: platformData.country || '',
      institution: platformData.institution || '',
      accountNumber: platformData.accountNumber || '', // ✅ M36 Fase 6: Para cuentas bancarias
      // ✅ M36 Fase 6: Marcar si es cash
      isCash: isCashPlatform,
      // Historial
      balanceHistory: platformData.balanceHistory || [{
        id: `bh_${Date.now()}`,
        date: now.split('T')[0],
        balance: parseFloat(platformData.currentBalance) || 0,
        note: isNew ? 'Balance inicial' : 'Actualización',
        type: isNew ? 'initial' : 'update',
        createdAt: now
      }],
      isArchived: platformData.isArchived || false,
      createdAt: platformData.createdAt || now,
      updatedAt: now
    };

    setInvestments(prev => {
      if (isNew) {
        return [...prev, platform];
      }
      return prev.map(inv => inv.id === platformId ? { ...inv, ...platform } : inv);
    });

    return platform;
  }, []);

  const deletePlatform = useCallback((platformId) => {
    setInvestments(prev => prev.filter(inv => inv.id !== platformId));
    return true;
  }, []);

  const archivePlatform = useCallback((platformId) => {
    setInvestments(prev => prev.map(inv => 
      inv.id === platformId 
        ? { ...inv, isArchived: true, updatedAt: new Date().toISOString() }
        : inv
    ));
    return true;
  }, []);

  const restorePlatform = useCallback((platformId) => {
    setInvestments(prev => prev.map(inv => 
      inv.id === platformId 
        ? { ...inv, isArchived: false, updatedAt: new Date().toISOString() }
        : inv
    ));
    return true;
  }, []);

  /**
   * ✅ Actualizar balance de plataforma
   */
  const updatePlatformBalance = useCallback((platformId, newBalance, note = '') => {
    const now = new Date().toISOString();
    
    setInvestments(prev => prev.map(inv => {
      if (inv.id !== platformId) return inv;

      const balanceEntry = {
        id: `bh_${Date.now()}`,
        date: now.split('T')[0],
        balance: parseFloat(newBalance),
        note: note || 'Actualización de balance',
        type: 'manual',
        createdAt: now
      };

      const updatedPlatform = {
        ...inv,
        currentBalance: parseFloat(newBalance),
        balanceHistory: [...(inv.balanceHistory || []), balanceEntry],
        updatedAt: now
      };

      return updatedPlatform;
    }));

    updateLinkedSavingsGoals(platformId, parseFloat(newBalance));
    return true;
  }, [updateLinkedSavingsGoals]);

  /**
   * ✅ Calcular ROI de plataforma
   */
  const calculatePlatformROI = useCallback((platform) => {
    if (!platform) return { roi: 0, roiPercent: 0 };
    
    const current = platform.currentBalance || 0;
    const deposited = platform.totalDeposited || current;
    
    if (deposited === 0) return { roi: 0, roiPercent: 0 };
    
    const roi = current - deposited;
    const roiPercent = (roi / deposited) * 100;
    
    return { roi, roiPercent };
  }, []);

  // ===================== BALANCE HISTORY =====================

  const addBalanceHistory = useCallback((platformId, entry) => {
    const now = new Date().toISOString();
    
    setInvestments(prev => prev.map(inv => {
      if (inv.id !== platformId) return inv;

      const newEntry = {
        id: `bh_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        date: entry.date || now.split('T')[0],
        balance: parseFloat(entry.balance),
        note: entry.note || '',
        type: entry.type || 'manual',
        createdAt: now
      };

      return {
        ...inv,
        currentBalance: parseFloat(entry.balance),
        balanceHistory: [...(inv.balanceHistory || []), newEntry].sort((a, b) => 
          new Date(a.date) - new Date(b.date)
        ),
        updatedAt: now
      };
    }));

    return true;
  }, []);

  const updateBalanceHistory = useCallback((platformId, entryId, updates) => {
    const now = new Date().toISOString();
    
    setInvestments(prev => prev.map(inv => {
      if (inv.id !== platformId) return inv;

      const updatedHistory = (inv.balanceHistory || []).map(entry =>
        entry.id === entryId ? { ...entry, ...updates, updatedAt: now } : entry
      ).sort((a, b) => new Date(a.date) - new Date(b.date));

      const mostRecent = updatedHistory[updatedHistory.length - 1];

      return {
        ...inv,
        balanceHistory: updatedHistory,
        currentBalance: mostRecent?.balance || inv.currentBalance,
        updatedAt: now
      };
    }));

    return true;
  }, []);

  // Alias para compatibilidad
  const addBalanceEntry = addBalanceHistory;
  const updateBalanceEntry = updateBalanceHistory;

  const deleteBalanceEntry = useCallback((platformId, entryId) => {
    const now = new Date().toISOString();
    
    setInvestments(prev => prev.map(inv => {
      if (inv.id !== platformId) return inv;

      const entry = inv.balanceHistory?.find(e => e.id === entryId);
      if (!entry || entry.type === 'initial') return inv;

      const updatedHistory = (inv.balanceHistory || [])
        .filter(e => e.id !== entryId)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      const mostRecent = updatedHistory[updatedHistory.length - 1];

      return {
        ...inv,
        balanceHistory: updatedHistory,
        currentBalance: mostRecent?.balance || 0,
        updatedAt: now
      };
    }));

    return true;
  }, []);


  // ===================== SAVINGS GOALS =====================

  const addSavingsGoal = useCallback((goal) => {
    const newGoal = {
      id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: goal.name || 'Nueva Meta',
      targetAmount: parseFloat(goal.targetAmount) || 0,
      currentAmount: parseFloat(goal.currentAmount) || 0,
      currency: goal.currency || 'EUR',
      targetDate: goal.targetDate || null,
      linkedPlatform: goal.linkedPlatform || null,
      linkedPlatforms: goal.linkedPlatforms || [],
      notes: goal.notes || '',
      icon: goal.icon || '🎯',
      createdAt: new Date().toISOString()
    };

    setSavingsGoals(prev => [...prev, newGoal]);
    return newGoal;
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

  const registerSavingsContribution = useCallback((goalId, amount, note = '') => {
    const now = new Date().toISOString();
    
    setSavingsGoals(prev => prev.map(goal => {
      if (goal.id !== goalId) return goal;

      const contribution = {
        id: `contrib_${Date.now()}`,
        amount: parseFloat(amount),
        date: now.split('T')[0],
        note,
        timestamp: now
      };

      return {
        ...goal,
        currentAmount: (goal.currentAmount || 0) + parseFloat(amount),
        contributions: [...(goal.contributions || []), contribution],
        updatedAt: now
      };
    }));

    return true;
  }, []);

  // ===================== LEGACY FUNCTIONS =====================

  const addInvestment = savePlatform;
  const updateInvestment = useCallback((id, updates) => {
    return savePlatform({ id, ...updates });
  }, [savePlatform]);
  const deleteInvestment = deletePlatform;

  // ===================== M36 FASE 6: HELPERS PARA CASH =====================

  /**
   * Obtener solo plataformas de cash/banco (no archivadas)
   */
  const cashPlatforms = useMemo(() => {
    return investments.filter(inv =>
      !inv.isArchived && (inv.isCash || inv.goal === 'cash')
    );
  }, [investments]);

  /**
   * Obtener solo plataformas de inversión (no cash, no archivadas)
   */
  const investmentPlatforms = useMemo(() => {
    return investments.filter(inv =>
      !inv.isArchived && !inv.isCash && inv.goal !== 'cash'
    );
  }, [investments]);

  // Nota: totalCash y totalInvestmentsValue NO se calculan aquí porque requieren
  // convertCurrency (disponible en ExchangeRatesContext). Los consumidores deben
  // calcularlos con convertCurrency para soportar multi-moneda correctamente.
  // Ver Dashboard.jsx líneas 37-58 como referencia.

  // ===================== VALUE =====================

  const value = useMemo(() => ({
    // Estado
    investments,
    setInvestments,
    savingsGoals,
    setSavingsGoals,
    
    // Plataformas
    savePlatform,
    deletePlatform,
    archivePlatform,
    restorePlatform,
    updatePlatformBalance,
    calculatePlatformROI,
    
    // Balance History
    addBalanceHistory,
    updateBalanceHistory,
    addBalanceEntry,
    updateBalanceEntry,
    deleteBalanceEntry,
    
    // Savings Goals
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    registerSavingsContribution,
    updateLinkedSavingsGoals,
    
    // Legacy aliases
    addInvestment,
    updateInvestment,
    deleteInvestment,
    
    // Helpers de Cash/Banco (sin totales - requieren convertCurrency)
    cashPlatforms,
    investmentPlatforms
  }), [
    investments,
    savingsGoals,
    savePlatform,
    deletePlatform,
    archivePlatform,
    restorePlatform,
    updatePlatformBalance,
    calculatePlatformROI,
    addBalanceHistory,
    updateBalanceHistory,
    addBalanceEntry,
    updateBalanceEntry,
    deleteBalanceEntry,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    registerSavingsContribution,
    updateLinkedSavingsGoals,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    cashPlatforms,
    investmentPlatforms
  ]);

  return (
    <InvestmentsContext.Provider value={value}>
      {children}
    </InvestmentsContext.Provider>
  );
}