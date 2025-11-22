import { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { AnalysisEngine } from '../domain/engines/AnalysisEngine'

/**
 * Custom Hook para análisis financiero
 * Centraliza todos los cálculos de KPIs y el Índice Nauta
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
  const nautaIndex = useMemo(() => {
    return AnalysisEngine.calculateNautaIndex({ 
      categories, 
      debts, 
      savingsGoals, 
      ynabConfig 
    })
  }, [categories, debts, savingsGoals, ynabConfig])
  
  // M9.1: Ratio Deuda/Ingreso anual
  const debtToIncomeRatio = useMemo(() => {
    return AnalysisEngine.calculateDebtToIncomeRatio(
      debts, 
      ynabConfig?.monthlyIncome || 0
    )
  }, [debts, ynabConfig])
  
  // M9.2: Tasa de Ahorro
  const savingsRate = useMemo(() => {
    const monthlyExpenses = categories.reduce((sum, cat) => sum + cat.budget, 0)
    const monthlyIncome = ynabConfig?.monthlyIncome || 0
    
    if (monthlyIncome === 0) return 0
    
    return ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100
  }, [categories, ynabConfig])
  
  // M9.3: Ratio Servicio de Deuda
  const debtServiceRatio = useMemo(() => {
    return AnalysisEngine.calculateDebtServiceRatio(
      debts, 
      ynabConfig?.monthlyIncome || 0
    )
  }, [debts, ynabConfig])
  
  // M9.4: Meses cubiertos por Fondo de Emergencia
  const emergencyFundMonths = useMemo(() => {
    return AnalysisEngine.calculateEmergencyFundMonths(savingsGoals, categories)
  }, [savingsGoals, categories])
  
  // Patrimonio Neto
  const netWorth = useMemo(() => {
    const totalSavings = savingsGoals.reduce((sum, goal) => 
      sum + convertCurrency(goal.currentAmount, goal.currency, displayCurrency), 0
    )
    
    const totalInvestments = investments.reduce((sum, inv) => {
      const value = inv.quantity * inv.currentPrice
      return sum + convertCurrency(value, inv.currency, displayCurrency)
    }, 0)
    
    const totalDebt = debts.reduce((sum, debt) => 
      sum + convertCurrency(debt.currentBalance, debt.currency, displayCurrency), 0
    )
    
    return totalSavings + totalInvestments - totalDebt
  }, [savingsGoals, investments, debts, displayCurrency, convertCurrency])
  
  return {
    nautaIndex,
    debtToIncomeRatio,
    savingsRate,
    debtServiceRatio,
    emergencyFundMonths,
    netWorth
  }
}