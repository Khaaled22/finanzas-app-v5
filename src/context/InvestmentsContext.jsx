// src/context/InvestmentsContext.jsx
// ✅ M33: Simplificado - Solo plataformas con balance global (sin holdings/activos)
// ✅ M36 Fase 6: Soporte mejorado para Cash/Banco como plataforma
// ✅ Fase 5: Supabase sync via user_data table
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import StorageManager from '../modules/storage/StorageManager';
import { loadFromSupabase, saveToSupabase, mergeArrayById, filterActive, softDelete } from '../modules/supabase/syncUtils';

const SYNC_KEY_INV = 'investments_v5';
const SYNC_KEY_GOALS = 'savingsGoals_v5';

const InvestmentsContext = createContext();

// ✅ M36 Fase 6: Tipos de objetivo actualizados con Cash/Banco prominente
export const PLATFORM_GOALS = [
  { id: 'cash', name: 'Banco / Efectivo', icon: '🏦', description: 'Cuentas bancarias y efectivo', color: 'emerald', isCash: true },
  { id: 'fi_step1', name: 'Independencia Fin.', icon: '💰', description: 'Liquidez inmediata', color: 'blue' },
  { id: 'emergency', name: 'Fondo Emergencia', icon: '🛟', description: 'Reserva de emergencia', color: 'green' },
  { id: 'down_payment', name: 'Pie / Entrada', icon: '🏠', description: 'Ahorro para compra grande', color: 'purple' },
  { id: 'real_state', name: 'Bienes Raíces', icon: '🏢', description: 'Inversión inmobiliaria', color: 'orange' },
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
  { id: 'real_state', name: 'Real Estate', icon: '🏢' },
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
    StorageManager.load(SYNC_KEY_INV, INITIAL_INVESTMENTS)
  );
  const [savingsGoals, setSavingsGoals] = useState(() =>
    StorageManager.load(SYNC_KEY_GOALS, INITIAL_SAVINGS_GOALS)
  );
  const syncReadyInv = useRef(false);
  const syncReadyGoals = useRef(false);

  // Detect recent import — skip Supabase merge, local is authoritative
  const isRecentImport = useRef(Date.now() - parseInt(localStorage.getItem('_lastImportAt') || '0', 10) < 30000);

  // Load investments from Supabase on mount
  useEffect(() => {
    loadFromSupabase(SYNC_KEY_INV).then(cloudData => {
      syncReadyInv.current = true;
      if (isRecentImport.current) {
        setInvestments(prev => { saveToSupabase(SYNC_KEY_INV, prev); return prev; });
        return;
      }
      setInvestments(prev => {
        const merged = mergeArrayById(prev, cloudData);
        StorageManager.save(SYNC_KEY_INV, merged);
        return merged;
      });
    });
  }, []);

  // Load savings goals from Supabase on mount
  useEffect(() => {
    loadFromSupabase(SYNC_KEY_GOALS).then(cloudData => {
      syncReadyGoals.current = true;
      if (isRecentImport.current) {
        setSavingsGoals(prev => { saveToSupabase(SYNC_KEY_GOALS, prev); return prev; });
        return;
      }
      setSavingsGoals(prev => {
        const merged = mergeArrayById(prev, cloudData);
        StorageManager.save(SYNC_KEY_GOALS, merged);
        return merged;
      });
    });
  }, []);

  // Save investments (skip initial mount to avoid overwriting before merge)
  const initialMountInv = useRef(true);
  useEffect(() => {
    if (initialMountInv.current) { initialMountInv.current = false; return; }
    StorageManager.save(SYNC_KEY_INV, investments);
    if (syncReadyInv.current) saveToSupabase(SYNC_KEY_INV, investments);
  }, [investments]);

  // Save savings goals
  const initialMountGoals = useRef(true);
  useEffect(() => {
    if (initialMountGoals.current) { initialMountGoals.current = false; return; }
    StorageManager.save(SYNC_KEY_GOALS, savingsGoals);
    if (syncReadyGoals.current) saveToSupabase(SYNC_KEY_GOALS, savingsGoals);
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
    setInvestments(prev => softDelete(prev, platformId));
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
    if (!platform) return { roi: 0, roiPercent: 0, hasData: false };

    const current = platform.currentBalance || 0;
    let deposited = platform.totalDeposited;

    // Fallback: use first balanceHistory entry as initial investment
    if (!deposited || deposited <= 0) {
      const history = platform.balanceHistory;
      if (history && history.length > 0) {
        const initialEntry = history.find(e => e.type === 'initial') || history[0];
        deposited = initialEntry.balance || 0;
      }
    }

    if (!deposited || deposited <= 0) return { roi: 0, roiPercent: 0, hasData: false };

    const roi = current - deposited;
    const roiPercent = (roi / deposited) * 100;

    return { roi, roiPercent, hasData: true };
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
    setSavingsGoals(prev => softDelete(prev, goalId));
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

  // Active items (excludes soft-deleted for UI)
  const activeInvestments = useMemo(() => filterActive(investments), [investments]);
  const activeSavingsGoals = useMemo(() => filterActive(savingsGoals), [savingsGoals]);

  /**
   * Obtener solo plataformas de cash/banco (no archivadas)
   */
  const cashPlatforms = useMemo(() => {
    return activeInvestments.filter(inv =>
      !inv.isArchived && (inv.isCash || inv.goal === 'cash')
    );
  }, [activeInvestments]);

  /**
   * Obtener solo plataformas de inversión (no cash, no archivadas)
   */
  const investmentPlatforms = useMemo(() => {
    return activeInvestments.filter(inv =>
      !inv.isArchived && !inv.isCash && inv.goal !== 'cash'
    );
  }, [activeInvestments]);

  // Nota: totalCash y totalInvestmentsValue NO se calculan aquí porque requieren
  // convertCurrency (disponible en ExchangeRatesContext). Los consumidores deben
  // calcularlos con convertCurrency para soportar multi-moneda correctamente.
  // Ver Dashboard.jsx líneas 37-58 como referencia.

  // ===================== VALUE =====================

  const value = useMemo(() => ({
    // Estado (filtered — no soft-deleted items)
    investments: activeInvestments,
    setInvestments,
    savingsGoals: activeSavingsGoals,
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
    activeInvestments,
    activeSavingsGoals,
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