// src/hooks/useAnalytics.js
// ✅ M32: Actualizado para pasar investments + historial de patrimonio neto
import { useMemo, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { AnalysisEngine } from '../domain/engines/AnalysisEngine'

/**
 * Custom Hook para análisis financiero
 * Centraliza todos los cálculos de KPIs y el Índice Nauta
 * ✅ M32: Ahora pasa investments + guarda historial de patrimonio
 */
export function useAnalytics() {
  const { 
    categories, 
    debts, 
    savingsGoals, 
    investments,
    ynabConfig, 
    displayCurrency,
    convertCurrency 
  } = useApp()
  
  // M8: Índice de Tranquilidad Financiera (Nauta)
  // ✅ M32: Ahora pasa investments para linkedPlatforms
  const nautaIndex = useMemo(() => {
    return AnalysisEngine.calculateNautaIndex(
      { categories, debts, savingsGoals, investments, ynabConfig },
      convertCurrency,
      displayCurrency
    )
  }, [categories, debts, savingsGoals, investments, ynabConfig, convertCurrency, displayCurrency])
  
  // M9.1: Ratio Deuda/Ingreso anual
  const debtToIncomeRatio = useMemo(() => {
    return AnalysisEngine.calculateDebtToIncomeRatio(
      debts, 
      ynabConfig?.monthlyIncome || 0,
      convertCurrency,
      displayCurrency,
      ynabConfig?.currency || displayCurrency
    )
  }, [debts, ynabConfig, convertCurrency, displayCurrency])
  
  // M9.2: Tasa de Ahorro
  const savingsRate = useMemo(() => {
    // Only count operating expenses (exclude income and investment categories)
    const monthlyExpenses = categories
      .filter(cat => cat.flowKind === 'OPERATING_EXPENSE' || cat.type === 'expense')
      .reduce((sum, cat) =>
        sum + convertCurrency(cat.budget, cat.currency, displayCurrency), 0
      )

    const monthlyIncome = ynabConfig?.monthlyIncome
      ? convertCurrency(ynabConfig.monthlyIncome, ynabConfig.currency, displayCurrency)
      : 0

    if (monthlyIncome === 0) return 0

    return ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100
  }, [categories, ynabConfig, convertCurrency, displayCurrency])
  
  // M9.3: Ratio Servicio de Deuda
  const debtServiceRatio = useMemo(() => {
    return AnalysisEngine.calculateDebtServiceRatio(
      debts, 
      ynabConfig?.monthlyIncome || 0,
      convertCurrency,
      displayCurrency,
      ynabConfig?.currency || displayCurrency
    )
  }, [debts, ynabConfig, convertCurrency, displayCurrency])
  
  // M9.4: Meses cubiertos por Fondo de Emergencia
  // ✅ M32: Ahora pasa investments para linkedPlatforms
  const emergencyFundMonths = useMemo(() => {
    return AnalysisEngine.calculateEmergencyFundMonths(
      savingsGoals,
      investments,
      categories,
      convertCurrency,
      displayCurrency
    )
  }, [savingsGoals, investments, categories, convertCurrency, displayCurrency])
  
  // Patrimonio Neto
  const netWorth = useMemo(() => {
    const totalSavings = savingsGoals.reduce((sum, goal) => 
      sum + convertCurrency(goal.currentAmount, goal.currency, displayCurrency), 0
    )
    
    const totalInvestments = investments.reduce((sum, inv) => {
      let value;
      
      if (inv.currentBalance !== undefined) {
        value = inv.currentBalance;
      } else if (inv.quantity && inv.currentPrice) {
        value = inv.quantity * inv.currentPrice;
      } else {
        value = 0;
      }
      
      return sum + convertCurrency(value, inv.currency, displayCurrency);
    }, 0)
    
    const totalDebt = debts.reduce((sum, debt) => 
      sum + convertCurrency(debt.currentBalance, debt.currency, displayCurrency), 0
    )
    
    return totalSavings + totalInvestments - totalDebt
  }, [savingsGoals, investments, debts, displayCurrency, convertCurrency])
  
  // ✅ M32: Guardar snapshot de patrimonio neto diariamente
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const history = AnalysisEngine.getNetWorthHistory();
    
    // Solo guardar una vez al día
    if (!history[today]) {
      AnalysisEngine.saveNetWorthSnapshot(netWorth, displayCurrency);
    }
  }, [netWorth, displayCurrency])
  
  // ✅ M32: Historial de patrimonio neto (daily snapshots)
  const netWorthHistory = useMemo(() => {
    return AnalysisEngine.getNetWorthHistory();
  }, [netWorth])

  // Monthly net worth timeline — reconstructed from investment balanceHistory
  // Falls back to daily snapshots when available, uses current savings/debts as static baseline
  const netWorthTimeline = useMemo(() => {
    const now = new Date();
    const timeline = {};

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const endOfMonth = `${ym}-31`;

      const invValue = investments.reduce((sum, inv) => {
        const history = inv.balanceHistory;
        if (!history?.length) {
          return sum + convertCurrency(inv.currentBalance || 0, inv.currency || 'EUR', displayCurrency);
        }
        const entries = history
          .filter(e => e.date <= endOfMonth)
          .sort((a, b) => b.date.localeCompare(a.date));
        const balance = entries.length > 0 ? entries[0].balance : 0;
        return sum + convertCurrency(balance, inv.currency || 'EUR', displayCurrency);
      }, 0);

      const savingsValue = savingsGoals.reduce((sum, goal) =>
        sum + convertCurrency(goal.currentAmount || 0, goal.currency || 'EUR', displayCurrency), 0
      );

      const debtValue = debts.reduce((sum, debt) =>
        sum + convertCurrency(debt.currentBalance || 0, debt.currency || 'EUR', displayCurrency), 0
      );

      timeline[ym] = invValue + savingsValue - debtValue;
    }

    // Override months that have actual daily snapshots (most accurate)
    const snapshots = AnalysisEngine.getNetWorthHistory();
    Object.entries(snapshots).forEach(([date, data]) => {
      const ym = date.slice(0, 7);
      if (ym in timeline) timeline[ym] = data.value;
    });

    return timeline;
  }, [investments, savingsGoals, debts, displayCurrency, convertCurrency])

  return {
    nautaIndex,
    debtToIncomeRatio,
    savingsRate,
    debtServiceRatio,
    emergencyFundMonths,
    netWorth,
    netWorthHistory,
    netWorthTimeline
  }
}