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
    const monthlyExpenses = categories.reduce((sum, cat) => 
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
  
  // ✅ M32: Historial de patrimonio neto
  const netWorthHistory = useMemo(() => {
    return AnalysisEngine.getNetWorthHistory();
  }, [netWorth]) // Se recalcula cuando cambia netWorth
  
  return {
    nautaIndex,
    debtToIncomeRatio,
    savingsRate,
    debtServiceRatio,
    emergencyFundMonths,
    netWorth,
    netWorthHistory // ✅ M32: Nuevo
  }
}