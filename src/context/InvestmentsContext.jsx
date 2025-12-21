// src/context/InvestmentsContext.jsx
// ✅ M26: Sub-contexto para gestión de inversiones
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import StorageManager from '../modules/storage/StorageManager';
import { INITIAL_INVESTMENTS, INITIAL_SAVINGS_GOALS } from '../config/initialData';

const InvestmentsContext = createContext();

export const useInvestments = () => {
  const context = useContext(InvestmentsContext);
  if (!context) {
    throw new Error('useInvestments debe usarse dentro de InvestmentsProvider');
  }
  return context;
};

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
      const hasLinked = prev.some(goal => goal.linkedPlatform === platformId);
      if (!hasLinked) return prev;

      return prev.map(goal => {
        if (goal.linkedPlatform === platformId) {
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

  // ===================== INVERSIONES =====================

  const addInvestment = useCallback((investment) => {
    const newInvestment = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: investment.name || 'Nueva Inversión',
      type: investment.type || 'stock',
      quantity: parseFloat(investment.quantity) || 0,
      purchasePrice: parseFloat(investment.purchasePrice) || 0,
      currentPrice: parseFloat(investment.currentPrice) || parseFloat(investment.purchasePrice) || 0,
      currency: investment.currency || 'EUR',
      platform: investment.platform || '',
      notes: investment.notes || '',
      priceHistory: [],
      createdAt: new Date().toISOString()
    };

    setInvestments(prev => [...prev, newInvestment]);
    return true;
  }, []);

  const updateInvestment = useCallback((investmentId, updates) => {
    setInvestments(prev => {
      const updatedList = prev.map(inv => 
        inv.id === investmentId 
          ? { ...inv, ...updates, updatedAt: new Date().toISOString() }
          : inv
      );
      
      const updatedInv = updatedList.find(inv => inv.id === investmentId);
      if (updatedInv && updatedInv.type === 'platform' && updates.currentBalance !== undefined) {
        setTimeout(() => updateLinkedSavingsGoals(investmentId, updates.currentBalance), 0);
      }
      
      return updatedList;
    });
    return true;
  }, [updateLinkedSavingsGoals]);

  const deleteInvestment = useCallback((investmentId) => {
    setInvestments(prev => prev.filter(inv => inv.id !== investmentId));
    return true;
  }, []);

  const savePlatform = useCallback((platformData) => {
    const platformId = platformData.id || `platform_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const platform = {
      id: platformId,
      name: platformData.name,
      type: 'platform',
      currency: platformData.currency || 'EUR',
      currentBalance: parseFloat(platformData.currentBalance) || 0,
      holdings: platformData.holdings || [],
      balanceHistory: platformData.balanceHistory || [],
      notes: platformData.notes || '',
      createdAt: platformData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setInvestments(prev => {
      if (platformData.id) {
        return prev.map(inv => inv.id === platformId ? platform : inv);
      } else {
        return [...prev, platform];
      }
    });

    updateLinkedSavingsGoals(platformId, platform.currentBalance);
    return platformId;
  }, [updateLinkedSavingsGoals]);

  const addHoldingToPlatform = useCallback((platformId, holding) => {
    setInvestments(prev => {
      const platform = prev.find(inv => inv.id === platformId);
      if (!platform || platform.type !== 'platform') return prev;

      const newHolding = {
        id: `holding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: holding.name,
        ticker: holding.ticker || '',
        quantity: parseFloat(holding.quantity) || 0,
        purchasePrice: parseFloat(holding.purchasePrice) || 0,
        currentPrice: parseFloat(holding.currentPrice) || parseFloat(holding.purchasePrice) || 0,
        currency: holding.currency || platform.currency,
        notes: holding.notes || ''
      };

      return prev.map(inv => 
        inv.id === platformId 
          ? { ...inv, holdings: [...(inv.holdings || []), newHolding], updatedAt: new Date().toISOString() }
          : inv
      );
    });
    return true;
  }, []);

  const updateHoldingInPlatform = useCallback((platformId, holdingId, updates) => {
    setInvestments(prev => prev.map(inv => {
      if (inv.id === platformId && inv.type === 'platform') {
        return {
          ...inv,
          holdings: (inv.holdings || []).map(h => h.id === holdingId ? { ...h, ...updates } : h),
          updatedAt: new Date().toISOString()
        };
      }
      return inv;
    }));
    return true;
  }, []);

  const deleteHoldingFromPlatform = useCallback((platformId, holdingId) => {
    setInvestments(prev => prev.map(inv => {
      if (inv.id === platformId && inv.type === 'platform') {
        return {
          ...inv,
          holdings: (inv.holdings || []).filter(h => h.id !== holdingId),
          updatedAt: new Date().toISOString()
        };
      }
      return inv;
    }));
    return true;
  }, []);

  const addBalanceHistory = useCallback((platformId, historyEntries) => {
    setInvestments(prev => {
      const platform = prev.find(inv => inv.id === platformId);
      if (!platform || platform.type !== 'platform') return prev;

      return prev.map(inv => 
        inv.id === platformId 
          ? { ...inv, balanceHistory: [...(inv.balanceHistory || []), ...historyEntries], updatedAt: new Date().toISOString() }
          : inv
      );
    });
    return true;
  }, []);

  const updateBalanceHistory = useCallback((platformId, newHistory) => {
    setInvestments(prev => prev.map(inv => 
      inv.id === platformId 
        ? { ...inv, balanceHistory: newHistory, updatedAt: new Date().toISOString() }
        : inv
    ));
    return true;
  }, []);

  const addBalanceEntry = useCallback((platformId, entry) => {
    setInvestments(prev => {
      const platform = prev.find(inv => inv.id === platformId);
      if (!platform || platform.type !== 'platform') return prev;

      const newEntry = {
        id: `balance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        date: entry.date || new Date().toISOString().split('T')[0],
        balance: parseFloat(entry.balance) || 0,
        timestamp: new Date().toISOString()
      };

      return prev.map(inv => 
        inv.id === platformId 
          ? { ...inv, balanceHistory: [...(inv.balanceHistory || []), newEntry], updatedAt: new Date().toISOString() }
          : inv
      );
    });
    return true;
  }, []);

  const deleteBalanceEntry = useCallback((platformId, entryId) => {
    setInvestments(prev => prev.map(inv => {
      if (inv.id === platformId && inv.type === 'platform') {
        return {
          ...inv,
          balanceHistory: (inv.balanceHistory || []).filter(entry => entry.id !== entryId),
          updatedAt: new Date().toISOString()
        };
      }
      return inv;
    }));
    return true;
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
      createdAt: new Date().toISOString()
    };

    setSavingsGoals(prev => [...prev, newGoal]);
    return true;
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

  const value = useMemo(() => ({
    // Estados
    investments,
    setInvestments,
    savingsGoals,
    setSavingsGoals,
    
    // Funciones Inversiones
    addInvestment,
    updateInvestment,
    deleteInvestment,
    savePlatform,
    addHoldingToPlatform,
    updateHoldingInPlatform,
    deleteHoldingFromPlatform,
    addBalanceHistory,
    updateBalanceHistory,
    addBalanceEntry,
    deleteBalanceEntry,
    
    // Funciones Ahorros
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    registerSavingsContribution,
    updateLinkedSavingsGoals
  }), [
    investments,
    savingsGoals,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    savePlatform,
    addHoldingToPlatform,
    updateHoldingInPlatform,
    deleteHoldingFromPlatform,
    addBalanceHistory,
    updateBalanceHistory,
    addBalanceEntry,
    deleteBalanceEntry,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    registerSavingsContribution,
    updateLinkedSavingsGoals
  ]);

  return (
    <InvestmentsContext.Provider value={value}>
      {children}
    </InvestmentsContext.Provider>
  );
}