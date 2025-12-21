import { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { AnalysisEngine } from '../domain/engines/AnalysisEngine'

/**
 * Custom Hook para análisis financiero
 * Centraliza todos los cálculos de KPIs y el Índice Nauta
 * ✅ M18.5: Soporte completo para conversión de monedas en todos los cálculos
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
  // ✅ M18.5: Ahora pasa convertCurrency y displayCurrency
  const nautaIndex = useMemo(() => {
    return AnalysisEngine.calculateNautaIndex(
      { categories, debts, savingsGoals, ynabConfig },
      convertCurrency,
      displayCurrency
    )
  }, [categories, debts, savingsGoals, ynabConfig, convertCurrency, displayCurrency])
  
  // M9.1: Ratio Deuda/Ingreso anual
  // ✅ M18.5: Ahora pasa convertCurrency, displayCurrency e incomeCurrency
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
  // ✅ M18.5: Ahora calcula correctamente con conversión de monedas
  const savingsRate = useMemo(() => {
    // Convertir gastos mensuales a displayCurrency
    const monthlyExpenses = categories.reduce((sum, cat) => 
      sum + convertCurrency(cat.budget, cat.currency, displayCurrency), 0
    )
    
    // Convertir ingreso mensual a displayCurrency
    const monthlyIncome = ynabConfig?.monthlyIncome
      ? convertCurrency(ynabConfig.monthlyIncome, ynabConfig.currency, displayCurrency)
      : 0
    
    if (monthlyIncome === 0) return 0
    
    return ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100
  }, [categories, ynabConfig, convertCurrency, displayCurrency])
  
  // M9.3: Ratio Servicio de Deuda
  // ✅ M18.5: Ahora pasa convertCurrency, displayCurrency e incomeCurrency
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
  // ✅ M18.5: Ahora pasa convertCurrency y displayCurrency
  const emergencyFundMonths = useMemo(() => {
    return AnalysisEngine.calculateEmergencyFundMonths(
      savingsGoals, 
      categories,
      convertCurrency,
      displayCurrency
    )
  }, [savingsGoals, categories, convertCurrency, displayCurrency])
  
  // Patrimonio Neto
  // ✅ M18.5: Conversión de monedas corregida para plataformas vs activos individuales
  const netWorth = useMemo(() => {
    // Convertir ahorros totales a displayCurrency
    const totalSavings = savingsGoals.reduce((sum, goal) => 
      sum + convertCurrency(goal.currentAmount, goal.currency, displayCurrency), 0
    )
    
    // ✅ M18.5: Cálculo correcto para plataformas vs activos individuales
    const totalInvestments = investments.reduce((sum, inv) => {
      let value;
      
      if (inv.currentBalance !== undefined) {
        // Es una plataforma (tiene currentBalance)
        value = inv.currentBalance;
      } else if (inv.quantity && inv.currentPrice) {
        // Es un activo individual (tiene quantity y currentPrice)
        value = inv.quantity * inv.currentPrice;
      } else {
        // Fallback: sin valor calculable
        value = 0;
      }
      
      return sum + convertCurrency(value, inv.currency, displayCurrency);
    }, 0)
    
    // Convertir deuda total a displayCurrency
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