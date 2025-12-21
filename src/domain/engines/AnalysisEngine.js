/**
 * Motor de Análisis Financiero
 * Implementa el Índice de Tranquilidad Financiera (Método Nauta) y otros KPIs
 * ✅ M18.5: Soporte completo para conversión de monedas
 */

export const AnalysisEngine = {
  /**
   * M8: Calcula el Índice de Tranquilidad Financiera de Nauta
   * ✅ M18.5: Ahora recibe convertCurrency y displayCurrency para cálculos multi-moneda
   * 
   * Componentes (70 puntos totales → escalado a 100):
   * 1. Fondo de Emergencia (0-20 pts): Evalúa meses cubiertos (objetivo: 6 meses)
   * 2. Tasa de Ahorro (0-20 pts): Evalúa porcentaje ahorrado (objetivo: 20%)
   * 3. Deudas Tóxicas (0-10 pts): Penaliza deudas no hipotecarias
   * 4. Seguros (0-10 pts): Valora protección médica
   * 5. APV/Pensión (0-10 pts): Considera ahorro previsional
   * 
   * @param {Object} data - Datos financieros
   * @param {Array} data.categories - Categorías de presupuesto
   * @param {Array} data.debts - Deudas activas
   * @param {Array} data.savingsGoals - Objetivos de ahorro
   * @param {Object} data.ynabConfig - Configuración YNAB (ingreso mensual)
   * @param {Function} convertCurrency - Función de conversión (amount, from, to)
   * @param {String} displayCurrency - Moneda de visualización
   * @returns {Object} { score, breakdown }
   */
  calculateNautaIndex(data, convertCurrency, displayCurrency) {
    const { categories, debts, savingsGoals, ynabConfig } = data
    
    let totalScore = 0
    const breakdown = {
      emergencyFund: { score: 0, max: 20, details: {} },
      savingsRate: { score: 0, max: 20, details: {} },
      toxicDebts: { score: 0, max: 10, details: {} },
      insurance: { score: 0, max: 10, details: {} },
      retirement: { score: 0, max: 10, details: {} }
    }

    // ✅ M18.5: Calcular gasto mensual total con conversión de monedas
    const monthlyExpenses = categories.reduce((sum, cat) => {
      return sum + convertCurrency(cat.budget, cat.currency, displayCurrency)
    }, 0)
    
    // ✅ M18.5: Convertir ingreso mensual a displayCurrency
    const monthlyIncome = ynabConfig?.monthlyIncome 
      ? convertCurrency(ynabConfig.monthlyIncome, ynabConfig.currency, displayCurrency)
      : 0

    // ============================================
    // 1. FONDO DE EMERGENCIA (0-20 puntos)
    // ============================================
    const emergencyFund = savingsGoals.find(g => 
      g.name.toLowerCase().includes('emergencia') || 
      g.name.toLowerCase().includes('emergency')
    )
    
    if (emergencyFund && monthlyExpenses > 0) {
      // ✅ M18.5: Convertir monto del fondo a displayCurrency
      const fundAmount = convertCurrency(
        emergencyFund.currentAmount, 
        emergencyFund.currency, 
        displayCurrency
      )
      
      const monthsCovered = fundAmount / monthlyExpenses
      const objective = 6 // 6 meses es el objetivo
      
      // Escala: 0 meses = 0 pts, 6+ meses = 20 pts
      const score = Math.min((monthsCovered / objective) * 20, 20)
      
      breakdown.emergencyFund.score = score
      breakdown.emergencyFund.details = {
        currentAmount: fundAmount,
        monthsCovered: monthsCovered,
        objective: objective,
        monthlyExpenses: monthlyExpenses,
        currency: displayCurrency,
        status: monthsCovered >= 6 ? 'Excelente' : 
                monthsCovered >= 3 ? 'Bueno' : 
                monthsCovered >= 1 ? 'Regular' : 'Insuficiente'
      }
      
      totalScore += score
    } else {
      breakdown.emergencyFund.details = {
        currentAmount: 0,
        monthsCovered: 0,
        objective: 6,
        monthlyExpenses: monthlyExpenses,
        currency: displayCurrency,
        status: 'Sin fondo de emergencia'
      }
    }

    // ============================================
    // 2. TASA DE AHORRO (0-20 puntos)
    // ============================================
    if (monthlyIncome > 0) {
      const savingsAmount = monthlyIncome - monthlyExpenses
      const savingsRate = savingsAmount / monthlyIncome
      const savingsRatePercent = savingsRate * 100
      
      // Escala: 0% = 0 pts, 20%+ = 20 pts
      // Fórmula: (tasa / 0.20) * 20
      const score = Math.min(Math.max(savingsRate, 0) * (20 / 0.20), 20)
      
      breakdown.savingsRate.score = score
      breakdown.savingsRate.details = {
        monthlyIncome: monthlyIncome,
        monthlyExpenses: monthlyExpenses,
        savingsAmount: savingsAmount,
        savingsRatePercent: savingsRatePercent,
        currency: displayCurrency,
        objective: 20, // 20% es el objetivo
        status: savingsRatePercent >= 20 ? 'Excelente' : 
                savingsRatePercent >= 10 ? 'Bueno' : 
                savingsRatePercent >= 5 ? 'Regular' : 'Insuficiente'
      }
      
      totalScore += score
    } else {
      breakdown.savingsRate.details = {
        monthlyIncome: 0,
        monthlyExpenses: monthlyExpenses,
        savingsAmount: 0,
        savingsRatePercent: 0,
        currency: displayCurrency,
        objective: 20,
        status: 'Sin ingreso configurado'
      }
    }

    // ============================================
    // 3. DEUDAS TÓXICAS (0-10 puntos)
    // ============================================
    // Deudas tóxicas son aquellas con alta tasa de interés y no productivas
    const toxicDebtTypes = [
      'Préstamo Automotriz',
      'Préstamo de Consumo',
      'Tarjeta de Crédito'
    ]
    
    const toxicDebts = debts.filter(d => toxicDebtTypes.includes(d.type))
    const toxicDebtCount = toxicDebts.length
    
    // ✅ M18.5: Convertir deudas tóxicas a displayCurrency
    const toxicDebtTotal = toxicDebts.reduce((sum, d) => {
      return sum + convertCurrency(d.currentBalance, d.currency, displayCurrency)
    }, 0)
    
    // Penalización: -2.5 puntos por cada deuda tóxica
    // Máximo 10 puntos si no hay deudas tóxicas
    const score = Math.max(10 - (toxicDebtCount * 2.5), 0)
    
    breakdown.toxicDebts.score = score
    breakdown.toxicDebts.details = {
      count: toxicDebtCount,
      totalAmount: toxicDebtTotal,
      currency: displayCurrency,
      types: toxicDebts.map(d => ({ 
        name: d.name, 
        type: d.type, 
        balance: convertCurrency(d.currentBalance, d.currency, displayCurrency)
      })),
      status: toxicDebtCount === 0 ? 'Excelente - Sin deudas tóxicas' : 
              toxicDebtCount <= 2 ? 'Mejorable' : 'Crítico'
    }
    
    totalScore += score

    // ============================================
    // 4. SEGUROS (0-10 puntos)
    // ============================================
    // Detectar si tiene seguros en las categorías
    const hasHealthInsurance = categories.some(c => 
      c.name.toLowerCase().includes('seguro') && 
      (c.name.toLowerCase().includes('médico') || 
       c.name.toLowerCase().includes('salud') ||
       c.name.toLowerCase().includes('complementario'))
    )
    
    const hasLifeInsurance = categories.some(c => 
      c.name.toLowerCase().includes('seguro') && 
      c.name.toLowerCase().includes('vida')
    )
    
    const hasCatastrophicInsurance = categories.some(c => 
      c.name.toLowerCase().includes('seguro') && 
      c.name.toLowerCase().includes('catastróf')
    )
    
    // Puntuación:
    // - Complementario/Salud: 4 pts
    // - Catastrófico: 3 pts
    // - Vida: 3 pts
    let insuranceScore = 0
    if (hasHealthInsurance) insuranceScore += 4
    if (hasCatastrophicInsurance) insuranceScore += 3
    if (hasLifeInsurance) insuranceScore += 3
    
    breakdown.insurance.score = Math.min(insuranceScore, 10)
    breakdown.insurance.details = {
      hasHealthInsurance: hasHealthInsurance,
      hasLifeInsurance: hasLifeInsurance,
      hasCatastrophicInsurance: hasCatastrophicInsurance,
      status: insuranceScore >= 7 ? 'Buena protección' : 
              insuranceScore >= 4 ? 'Protección básica' : 'Sin protección'
    }
    
    totalScore += Math.min(insuranceScore, 10)

    // ============================================
    // 5. APV / PENSIÓN (0-10 puntos)
    // ============================================
    // Detectar si tiene APV o ahorro previsional
    const hasRetirementSavings = categories.some(c => 
      c.name.toLowerCase().includes('apv') || 
      c.name.toLowerCase().includes('pensión') ||
      c.name.toLowerCase().includes('pension') ||
      c.name.toLowerCase().includes('jubilación')
    )
    
    const retirementGoal = savingsGoals.find(g => 
      g.name.toLowerCase().includes('retiro') ||
      g.name.toLowerCase().includes('pensión') ||
      g.name.toLowerCase().includes('jubilación')
    )
    
    // Puntuación simplificada:
    // - Tiene categoría APV/Pensión: 5 pts
    // - Tiene objetivo de ahorro para retiro: 5 pts
    let retirementScore = 0
    if (hasRetirementSavings) retirementScore += 5
    if (retirementGoal) retirementScore += 5
    
    breakdown.retirement.score = retirementScore
    breakdown.retirement.details = {
      hasRetirementCategory: hasRetirementSavings,
      hasRetirementGoal: !!retirementGoal,
      status: retirementScore >= 8 ? 'Excelente planificación' : 
              retirementScore >= 5 ? 'Planificación básica' : 'Sin planificación'
    }
    
    totalScore += retirementScore

    // ============================================
    // RESULTADO FINAL
    // ============================================
    // Escalar de 70 puntos a 100 puntos
    const finalScore = (totalScore / 70) * 100

    return {
      score: finalScore,
      breakdown,
      status: finalScore >= 80 ? 'Excelente' :
              finalScore >= 60 ? 'Bueno' :
              finalScore >= 40 ? 'Regular' : 'Mejorable',
      message: finalScore >= 80 
        ? 'Tu situación financiera es muy sólida. ¡Sigue así!' 
        : finalScore >= 60 
        ? 'Vas por buen camino. Hay algunos aspectos por mejorar.'
        : finalScore >= 40
        ? 'Tu situación financiera necesita atención. Enfócate en las áreas críticas.'
        : 'Es momento de tomar acción. Prioriza el fondo de emergencia y reduce deudas.'
    }
  },

  /**
   * Calcula Patrimonio Neto (Assets - Liabilities)
   * ✅ M18.5: Ahora requiere conversión de monedas
   */
  calculateNetWorth(assets, liabilities, convertCurrency, displayCurrency) {
    const totalAssets = assets.reduce((sum, asset) => 
      sum + convertCurrency(asset.value, asset.currency, displayCurrency), 0
    )
    const totalLiabilities = liabilities.reduce((sum, liability) => 
      sum + convertCurrency(liability.value, liability.currency, displayCurrency), 0
    )
    return totalAssets - totalLiabilities
  },

  /**
   * NUEVA: Calcula salud financiera básica (0-100)
   * ✅ M18.5: Actualizado con conversión de monedas
   * Necesaria para ExportPDFButton
   */
  calculateFinancialHealth(data, convertCurrency, displayCurrency) {
    let score = 0;
    
    // ✅ M18.5: Convertir ingreso mensual
    const monthlyIncome = data.ynabConfig?.monthlyIncome
      ? convertCurrency(data.ynabConfig.monthlyIncome, data.ynabConfig.currency, displayCurrency)
      : data.totals.budgeted;
    
    // ✅ M18.5: Convertir pagos mensuales de deuda
    const monthlyDebtPayment = data.debts.reduce((sum, d) => 
      sum + convertCurrency(d.monthlyPayment, d.currency, displayCurrency), 0
    );
    
    // Ratio deuda/ingreso (30 puntos)
    const debtRatio = monthlyIncome > 0 ? monthlyDebtPayment / monthlyIncome : 0;
    if (debtRatio < 0.2) score += 30;
    else if (debtRatio < 0.36) score += 20;
    else if (debtRatio < 0.5) score += 10;
    
    // Tasa de ahorro (25 puntos)
    const savingsRate = monthlyIncome > 0 ? data.totals.available / monthlyIncome : 0;
    if (savingsRate > 0.2) score += 25;
    else if (savingsRate > 0.1) score += 15;
    else if (savingsRate > 0) score += 5;
    
    // Fondo de emergencia (25 puntos)
    const emergencyFund = data.savingsGoals.find(g => 
      g.name.toLowerCase().includes('emergencia')
    );
    if (emergencyFund && monthlyIncome > 0) {
      const fundAmount = convertCurrency(
        emergencyFund.currentAmount,
        emergencyFund.currency,
        displayCurrency
      );
      const monthsCovered = fundAmount / monthlyIncome;
      if (monthsCovered >= 6) score += 25;
      else if (monthsCovered >= 3) score += 15;
      else if (monthsCovered >= 1) score += 5;
    }
    
    // Diversificación (20 puntos)
    if (data.investments.length >= 5) score += 20;
    else if (data.investments.length >= 3) score += 15;
    else if (data.investments.length >= 1) score += 5;
    
    return Math.min(score, 100);
  },

  /**
   * M9.1: Ratio Deuda/Ingreso anual
   * ✅ M18.5: Ahora recibe convertCurrency y displayCurrency
   */
  calculateDebtToIncomeRatio(debts, monthlyIncome, convertCurrency, displayCurrency, incomeCurrency) {
    if (!monthlyIncome || monthlyIncome === 0) return 0
    
    // ✅ M18.5: Convertir ingreso a displayCurrency
    const incomeInDisplay = convertCurrency(monthlyIncome, incomeCurrency, displayCurrency)
    
    // ✅ M18.5: Convertir deudas totales a displayCurrency
    const totalDebt = debts.reduce((sum, d) => 
      sum + convertCurrency(d.currentBalance, d.currency, displayCurrency), 0
    )
    
    return (totalDebt / (incomeInDisplay * 12)) * 100
  },

  /**
   * M9.3: Ratio Servicio de Deuda
   * ✅ M18.5: Ahora recibe convertCurrency y displayCurrency
   */
  calculateDebtServiceRatio(debts, monthlyIncome, convertCurrency, displayCurrency, incomeCurrency) {
    if (!monthlyIncome || monthlyIncome === 0) return 0
    
    // ✅ M18.5: Convertir ingreso a displayCurrency
    const incomeInDisplay = convertCurrency(monthlyIncome, incomeCurrency, displayCurrency)
    
    // ✅ M18.5: Convertir pagos mensuales a displayCurrency
    const monthlyPayment = debts.reduce((sum, d) => 
      sum + convertCurrency(d.monthlyPayment, d.currency, displayCurrency), 0
    )
    
    return (monthlyPayment / incomeInDisplay) * 100
  },

  /**
   * M9.4: Meses cubiertos por Fondo de Emergencia
   * ✅ M18.5: Ahora recibe convertCurrency y displayCurrency
   */
  calculateEmergencyFundMonths(savingsGoals, categories, convertCurrency, displayCurrency) {
    const emergencyFund = savingsGoals.find(g => 
      g.name.toLowerCase().includes('emergencia') ||
      g.name.toLowerCase().includes('emergency')
    )
    if (!emergencyFund) return 0
    
    // ✅ M18.5: Convertir monto del fondo a displayCurrency
    const fundAmount = convertCurrency(
      emergencyFund.currentAmount,
      emergencyFund.currency,
      displayCurrency
    )
    
    // ✅ M18.5: Convertir gastos mensuales a displayCurrency
    const monthlyExpenses = categories.reduce((sum, cat) => 
      sum + convertCurrency(cat.budget, cat.currency, displayCurrency), 0
    )
    
    if (monthlyExpenses === 0) return 0
    
    return fundAmount / monthlyExpenses
  },

  /**
   * Genera insights automáticos
   * ✅ M18.5: Actualizado con conversión de monedas
   */
  generateInsights(data, convertCurrency, displayCurrency) {
    const insights = []
    const { categories, totals, debts, savingsGoals, ynabConfig } = data

    // Análisis de gastos
    categories.forEach(cat => {
      const percentage = cat.budget > 0 ? (cat.spent / cat.budget) * 100 : 0
      if (percentage > 100) {
        insights.push({
          type: 'warning',
          icon: 'fa-exclamation-triangle',
          title: `Sobrepasaste el presupuesto en ${cat.name}`,
          message: `Has gastado ${percentage.toFixed(0)}% del presupuesto asignado.`,
          priority: 'high'
        })
      }
    })

    // Tasa de ahorro
    const monthlyIncome = ynabConfig?.monthlyIncome
      ? convertCurrency(ynabConfig.monthlyIncome, ynabConfig.currency, displayCurrency)
      : totals.budgeted
    
    const savingsRate = monthlyIncome > 0 ? totals.available / monthlyIncome : 0
    
    if (savingsRate < 0.1) {
      insights.push({
        type: 'warning',
        icon: 'fa-piggy-bank',
        title: 'Tasa de ahorro baja',
        message: `Solo estás ahorrando ${(savingsRate * 100).toFixed(1)}% de tus ingresos. Se recomienda al menos 20%.`,
        priority: 'high'
      })
    } else if (savingsRate > 0.3) {
      insights.push({
        type: 'success',
        icon: 'fa-trophy',
        title: '¡Excelente tasa de ahorro!',
        message: `Estás ahorrando ${(savingsRate * 100).toFixed(1)}% de tus ingresos. ¡Sigue así!`,
        priority: 'low'
      })
    }

    // ✅ M18.5: Convertir deuda total a displayCurrency
    const totalDebt = debts.reduce((sum, d) => 
      sum + convertCurrency(d.currentBalance, d.currency, displayCurrency), 0
    )
    
    const debtToIncomeRatio = monthlyIncome > 0 ? totalDebt / (monthlyIncome * 12) : 0
    if (debtToIncomeRatio > 3) {
      insights.push({
        type: 'danger',
        icon: 'fa-exclamation-circle',
        title: 'Nivel de deuda alto',
        message: `Tu deuda total representa ${debtToIncomeRatio.toFixed(1)} años de ingresos.`,
        priority: 'high'
      })
    }

    return insights.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  },

  /**
   * Compara con el mes anterior
   * ✅ M18.5: Actualizado con conversión de monedas
   */
  compareWithPreviousMonth(currentTransactions, convertCurrency, displayCurrency) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthTransactions = currentTransactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const lastMonthTransactions = currentTransactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
    });

    // ✅ M18.5: Convertir montos de transacciones
    const currentTotal = currentMonthTransactions.reduce((sum, t) => 
      sum + convertCurrency(t.amount, t.currency, displayCurrency), 0
    );
    
    const lastTotal = lastMonthTransactions.reduce((sum, t) => 
      sum + convertCurrency(t.amount, t.currency, displayCurrency), 0
    );
    
    const difference = currentTotal - lastTotal;
    const percentageChange = lastTotal > 0 ? (difference / lastTotal) * 100 : 0;

    return {
      currentMonth: {
        name: new Date(currentYear, currentMonth).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
        total: currentTotal,
        transactions: currentMonthTransactions.length
      },
      lastMonth: {
        name: new Date(lastMonthYear, lastMonth).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
        total: lastTotal,
        transactions: lastMonthTransactions.length
      },
      difference: difference,
      percentageChange: percentageChange,
      trend: difference > 0 ? 'up' : difference < 0 ? 'down' : 'equal',
      currency: displayCurrency
    };
  },

  /**
   * Proyecta el cashflow para los próximos 12 meses
   * ✅ M18.5: Actualizado con conversión de monedas
   */
  projectCashflow(categories, debts, ynabConfig, convertCurrency, displayCurrency) {
    const projection = [];
    
    // ✅ M18.5: Convertir gastos mensuales a displayCurrency
    const monthlyExpenses = categories.reduce((sum, cat) => 
      sum + convertCurrency(cat.budget, cat.currency, displayCurrency), 0
    );
    
    // ✅ M18.5: Convertir pagos de deuda a displayCurrency
    const monthlyDebtPayment = debts.reduce((sum, d) => 
      sum + convertCurrency(d.monthlyPayment, d.currency, displayCurrency), 0
    );
    
    // ✅ M18.5: Convertir ingreso mensual a displayCurrency
    const monthlyIncome = ynabConfig?.monthlyIncome
      ? convertCurrency(ynabConfig.monthlyIncome, ynabConfig.currency, displayCurrency)
      : monthlyExpenses;
    
    let cumulativeBalance = monthlyIncome - monthlyExpenses;
    
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      
      const netCashflow = monthlyIncome - monthlyExpenses - monthlyDebtPayment;
      cumulativeBalance += netCashflow;
      
      projection.push({
        month: date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
        income: monthlyIncome,
        expenses: monthlyExpenses,
        debtPayments: monthlyDebtPayment,
        netCashflow,
        cumulativeBalance,
        currency: displayCurrency
      });
    }
    
    return projection;
  }
}

// Export por defecto
export default AnalysisEngine;