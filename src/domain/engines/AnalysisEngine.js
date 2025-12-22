// src/domain/engines/AnalysisEngine.js
// ✅ M32: Completo con:
// - debt.isToxic (clasificación manual)
// - goal.isEmergencyFund + linkedPlatforms (múltiples plataformas)
// - insuranceConfig desde Settings
// - Detección de APV en inversiones

import StorageManager from '../../modules/storage/StorageManager';

export const AnalysisEngine = {
  /**
   * Calcula el Índice de Tranquilidad Financiera de Nauta
   */
  calculateNautaIndex(data, convertCurrency, displayCurrency) {
    const { categories, debts, savingsGoals, investments, ynabConfig } = data
    
    // ✅ M32: Cargar config de seguros
    const insuranceConfig = StorageManager.load('insuranceConfig_v5', null);
    
    let totalScore = 0
    const breakdown = {
      emergencyFund: { score: 0, max: 20, details: {} },
      savingsRate: { score: 0, max: 20, details: {} },
      toxicDebts: { score: 0, max: 10, details: {} },
      insurance: { score: 0, max: 10, details: {} },
      retirement: { score: 0, max: 10, details: {} }
    }

    // Calcular gasto mensual total
    const monthlyExpenses = (categories || []).reduce((sum, cat) => 
      sum + convertCurrency(cat.budget || 0, cat.currency || 'EUR', displayCurrency), 0
    )
    
    // Convertir ingreso mensual
    const monthlyIncome = ynabConfig?.monthlyIncome 
      ? convertCurrency(ynabConfig.monthlyIncome, ynabConfig.currency || 'EUR', displayCurrency)
      : 0

    // ============================================
    // 1. FONDO DE EMERGENCIA (0-20 puntos)
    // ✅ M32: Buscar por isEmergencyFund o nombre + linkedPlatforms
    // ============================================
    const emergencyFund = (savingsGoals || []).find(g => 
      g.isEmergencyFund === true ||
      g.name?.toLowerCase().includes('emergencia') || 
      g.name?.toLowerCase().includes('emergency')
    )
    
    if (emergencyFund && monthlyExpenses > 0) {
      let fundAmount = 0
      
      // ✅ M32: Usar linkedPlatforms (array) si existe
      if (emergencyFund.linkedPlatforms && emergencyFund.linkedPlatforms.length > 0 && investments) {
        fundAmount = emergencyFund.linkedPlatforms.reduce((sum, platformId) => {
          const platform = investments.find(inv => inv.id === platformId)
          if (platform) {
            return sum + convertCurrency(platform.currentBalance || 0, platform.currency || 'EUR', displayCurrency)
          }
          return sum
        }, 0)
      } else if (emergencyFund.linkedPlatformId && investments) {
        const platform = investments.find(inv => inv.id === emergencyFund.linkedPlatformId)
        if (platform) {
          fundAmount = convertCurrency(platform.currentBalance || 0, platform.currency || 'EUR', displayCurrency)
        }
      } else {
        fundAmount = convertCurrency(
          emergencyFund.currentAmount || 0, 
          emergencyFund.currency || 'EUR', 
          displayCurrency
        )
      }
      
      const monthsCovered = fundAmount / monthlyExpenses
      const objective = 6
      
      const score = Math.min((monthsCovered / objective) * 20, 20)
      
      breakdown.emergencyFund.score = score
      breakdown.emergencyFund.details = {
        currentAmount: fundAmount,
        monthsCovered: monthsCovered,
        objective: objective,
        monthlyExpenses: monthlyExpenses,
        currency: displayCurrency,
        goalName: emergencyFund.name,
        status: monthsCovered >= 6 ? 'Excelente - 6+ meses cubiertos' : 
                monthsCovered >= 3 ? 'Bueno - 3-6 meses cubiertos' : 
                monthsCovered >= 1 ? 'Regular - 1-3 meses cubiertos' : 'Insuficiente - menos de 1 mes'
      }
      
      totalScore += score
    } else {
      breakdown.emergencyFund.details = {
        currentAmount: 0,
        monthsCovered: 0,
        objective: 6,
        monthlyExpenses: monthlyExpenses,
        currency: displayCurrency,
        status: emergencyFund ? 'Sin gastos configurados' : 'Sin fondo de emergencia configurado'
      }
    }

    // ============================================
    // 2. TASA DE AHORRO (0-20 puntos)
    // ============================================
    if (monthlyIncome > 0) {
      const savingsAmount = monthlyIncome - monthlyExpenses
      const savingsRate = savingsAmount / monthlyIncome
      const savingsRatePercent = savingsRate * 100
      
      const score = Math.min(Math.max(savingsRate, 0) * (20 / 0.20), 20)
      
      breakdown.savingsRate.score = score
      breakdown.savingsRate.details = {
        monthlyIncome: monthlyIncome,
        monthlyExpenses: monthlyExpenses,
        savingsAmount: savingsAmount,
        savingsRatePercent: savingsRatePercent,
        currency: displayCurrency,
        objective: 20,
        status: savingsRatePercent >= 20 ? 'Excelente - 20%+ de ahorro' : 
                savingsRatePercent >= 10 ? 'Bueno - 10-20% de ahorro' : 
                savingsRatePercent >= 5 ? 'Regular - 5-10% de ahorro' : 'Insuficiente - menos del 5%'
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
    // ✅ M32: Usar campo isToxic en vez de tipo
    // ============================================
    const toxicDebts = (debts || []).filter(d => {
      if (d.isToxic !== undefined) {
        return d.isToxic === true
      }
      const toxicTypes = ['Préstamo Automotriz', 'Préstamo de Consumo', 'Tarjeta de Crédito', 'Préstamo Personal']
      return toxicTypes.includes(d.type)
    })
    
    const toxicDebtCount = toxicDebts.length
    
    const toxicDebtTotal = toxicDebts.reduce((sum, d) => 
      sum + convertCurrency(d.currentBalance || 0, d.currency || 'EUR', displayCurrency), 0
    )
    
    const score3 = Math.max(10 - (toxicDebtCount * 2.5), 0)
    
    breakdown.toxicDebts.score = score3
    breakdown.toxicDebts.details = {
      count: toxicDebtCount,
      totalAmount: toxicDebtTotal,
      currency: displayCurrency,
      types: toxicDebts.map(d => ({ 
        name: d.name, 
        type: d.type, 
        balance: convertCurrency(d.currentBalance || 0, d.currency || 'EUR', displayCurrency)
      })),
      status: toxicDebtCount === 0 ? 'Excelente - Sin deudas tóxicas' : 
              toxicDebtCount <= 2 ? 'Mejorable - 1-2 deudas tóxicas' : 'Crítico - 3+ deudas tóxicas'
    }
    
    totalScore += score3

    // ============================================
    // 4. SEGUROS (0-10 puntos)
    // ✅ M32: Primero checkear config de Settings, luego categorías
    // ============================================
    let hasHealthInsurance = false;
    let hasLifeInsurance = false;
    let hasCatastrophicInsurance = false;

    // Primero: Config de Settings (tiene prioridad)
    if (insuranceConfig) {
      hasHealthInsurance = insuranceConfig.hasHealthInsurance || false;
      hasLifeInsurance = insuranceConfig.hasLifeInsurance || false;
      hasCatastrophicInsurance = insuranceConfig.hasCatastrophicInsurance || false;
    }
    
    // Si no hay config, detectar desde categorías
    if (!insuranceConfig || (!hasHealthInsurance && !hasLifeInsurance && !hasCatastrophicInsurance)) {
      hasHealthInsurance = hasHealthInsurance || (categories || []).some(c => 
        c.name?.toLowerCase().includes('seguro') && 
        (c.name?.toLowerCase().includes('médico') || 
         c.name?.toLowerCase().includes('salud') ||
         c.name?.toLowerCase().includes('complementario') ||
         c.name?.toLowerCase().includes('isapre'))
      );
      
      hasLifeInsurance = hasLifeInsurance || (categories || []).some(c => 
        c.name?.toLowerCase().includes('seguro') && 
        c.name?.toLowerCase().includes('vida')
      );
      
      hasCatastrophicInsurance = hasCatastrophicInsurance || (categories || []).some(c => 
        c.name?.toLowerCase().includes('seguro') && 
        (c.name?.toLowerCase().includes('catastróf') || c.name?.toLowerCase().includes('ges'))
      );
    }
    
    let insuranceScore = 0
    if (hasHealthInsurance) insuranceScore += 4
    if (hasCatastrophicInsurance) insuranceScore += 3
    if (hasLifeInsurance) insuranceScore += 3
    
    breakdown.insurance.score = Math.min(insuranceScore, 10)
    breakdown.insurance.details = {
      hasHealthInsurance: hasHealthInsurance,
      hasLifeInsurance: hasLifeInsurance,
      hasCatastrophicInsurance: hasCatastrophicInsurance,
      configuredInSettings: !!insuranceConfig,
      status: insuranceScore >= 7 ? 'Buena protección' : 
              insuranceScore >= 4 ? 'Protección básica' : 'Sin protección detectada'
    }
    
    totalScore += Math.min(insuranceScore, 10)

    // ============================================
    // 5. APV / PENSIÓN (0-10 puntos)
    // ✅ M32: Detecta tipo APV en inversiones
    // ============================================
    const hasAPVCategory = (categories || []).some(c => 
      c.name?.toLowerCase().includes('apv') ||
      c.name?.toLowerCase().includes('previsional') ||
      c.name?.toLowerCase().includes('pensión') ||
      c.name?.toLowerCase().includes('afp')
    )
    
    const hasAPVInvestment = (investments || []).some(inv =>
      inv.name?.toLowerCase().includes('apv') ||
      inv.type?.toLowerCase() === 'apv' ||
      inv.type === 'APV'
    )
    
    let retirementScore = 0
    if (hasAPVCategory) retirementScore += 5
    if (hasAPVInvestment) retirementScore += 5
    
    breakdown.retirement.score = Math.min(retirementScore, 10)
    breakdown.retirement.details = {
      hasAPVCategory: hasAPVCategory,
      hasAPVInvestment: hasAPVInvestment,
      status: retirementScore >= 10 ? 'Excelente - APV activo' :
              retirementScore >= 5 ? 'Bueno - Categoría o inversión APV' : 'Sin APV detectado'
    }
    
    totalScore += Math.min(retirementScore, 10)

    // Escalar de 70 a 100
    const scaledScore = (totalScore / 70) * 100
    
    let status, message
    if (scaledScore >= 80) {
      status = 'Excelente'
      message = '¡Felicitaciones! Tu situación financiera es muy sólida.'
    } else if (scaledScore >= 60) {
      status = 'Bueno'
      message = 'Vas por buen camino. Hay aspectos que puedes mejorar.'
    } else if (scaledScore >= 40) {
      status = 'Regular'
      message = 'Tu situación requiere atención en varios aspectos.'
    } else {
      status = 'Crítico'
      message = 'Es importante tomar acción inmediata para mejorar tu salud financiera.'
    }

    return {
      score: scaledScore,
      breakdown,
      status,
      message
    }
  },

  /**
   * Calcula Salud Financiera (para header/dashboard)
   */
  calculateFinancialHealth(data, convertCurrency, displayCurrency) {
    const result = this.calculateNautaIndex(data, convertCurrency, displayCurrency)
    return Math.round(result.score)
  },

  /**
   * Ratio Deuda/Ingreso Anual
   */
  calculateDebtToIncomeRatio(debts, monthlyIncome, convertCurrency, displayCurrency, incomeCurrency) {
    if (!monthlyIncome || monthlyIncome === 0) return 0
    
    const annualIncome = convertCurrency(monthlyIncome * 12, incomeCurrency || 'EUR', displayCurrency)
    
    const totalDebt = (debts || []).reduce((sum, d) => 
      sum + convertCurrency(d.currentBalance || 0, d.currency || 'EUR', displayCurrency), 0
    )
    
    return (totalDebt / annualIncome) * 100
  },

  /**
   * Tasa de Ahorro
   */
  calculateSavingsRate(totals, ynabConfig, convertCurrency, displayCurrency) {
    const monthlyIncome = ynabConfig?.monthlyIncome
      ? convertCurrency(ynabConfig.monthlyIncome, ynabConfig.currency || 'EUR', displayCurrency)
      : 0
    
    if (monthlyIncome === 0) return 0
    
    const savings = totals.available || 0
    return (savings / monthlyIncome) * 100
  },

  /**
   * Ratio Servicio de Deuda
   */
  calculateDebtServiceRatio(debts, monthlyIncome, convertCurrency, displayCurrency, incomeCurrency) {
    if (!monthlyIncome || monthlyIncome === 0) return 0
    
    const incomeInDisplay = convertCurrency(monthlyIncome, incomeCurrency || 'EUR', displayCurrency)
    
    const monthlyPayment = (debts || []).reduce((sum, d) => 
      sum + convertCurrency(d.monthlyPayment || 0, d.currency || 'EUR', displayCurrency), 0
    )
    
    return (monthlyPayment / incomeInDisplay) * 100
  },

  /**
   * Meses cubiertos por Fondo de Emergencia
   * ✅ M32: Soporta linkedPlatforms
   */
  calculateEmergencyFundMonths(savingsGoals, investments, categories, convertCurrency, displayCurrency) {
    const emergencyFund = (savingsGoals || []).find(g => 
      g.isEmergencyFund === true ||
      g.name?.toLowerCase().includes('emergencia') ||
      g.name?.toLowerCase().includes('emergency')
    )
    if (!emergencyFund) return 0
    
    let fundAmount = 0
    
    if (emergencyFund.linkedPlatforms && emergencyFund.linkedPlatforms.length > 0 && investments) {
      fundAmount = emergencyFund.linkedPlatforms.reduce((sum, platformId) => {
        const platform = investments.find(inv => inv.id === platformId)
        if (platform) {
          return sum + convertCurrency(platform.currentBalance || 0, platform.currency || 'EUR', displayCurrency)
        }
        return sum
      }, 0)
    } else if (emergencyFund.linkedPlatformId && investments) {
      const platform = investments.find(inv => inv.id === emergencyFund.linkedPlatformId)
      if (platform) {
        fundAmount = convertCurrency(platform.currentBalance || 0, platform.currency || 'EUR', displayCurrency)
      }
    } else {
      fundAmount = convertCurrency(
        emergencyFund.currentAmount || 0,
        emergencyFund.currency || 'EUR',
        displayCurrency
      )
    }
    
    const monthlyExpenses = (categories || []).reduce((sum, cat) => 
      sum + convertCurrency(cat.budget || 0, cat.currency || 'EUR', displayCurrency), 0
    )
    
    if (monthlyExpenses === 0) return 0
    
    return fundAmount / monthlyExpenses
  },

  /**
   * ✅ M32: Calcula patrimonio neto con historial
   */
  calculateNetWorth(data, convertCurrency, displayCurrency) {
    const { savingsGoals, investments, debts } = data;
    
    const totalSavings = (savingsGoals || []).reduce((sum, goal) => 
      sum + convertCurrency(goal.currentAmount || 0, goal.currency || 'EUR', displayCurrency), 0
    );
    
    const totalInvestments = (investments || []).reduce((sum, inv) => {
      let value;
      if (inv.currentBalance !== undefined) {
        value = inv.currentBalance;
      } else if (inv.quantity && inv.currentPrice) {
        value = inv.quantity * inv.currentPrice;
      } else {
        value = 0;
      }
      return sum + convertCurrency(value, inv.currency || 'EUR', displayCurrency);
    }, 0);
    
    const totalDebt = (debts || []).reduce((sum, debt) => 
      sum + convertCurrency(debt.currentBalance || 0, debt.currency || 'EUR', displayCurrency), 0
    );
    
    return totalSavings + totalInvestments - totalDebt;
  },

  /**
   * ✅ M32: Guardar snapshot de patrimonio neto
   */
  saveNetWorthSnapshot(netWorth, displayCurrency) {
    const today = new Date().toISOString().slice(0, 10);
    const history = StorageManager.load('netWorthHistory_v5', {});
    
    history[today] = {
      value: netWorth,
      currency: displayCurrency,
      timestamp: new Date().toISOString()
    };
    
    StorageManager.save('netWorthHistory_v5', history);
    return history;
  },

  /**
   * ✅ M32: Obtener historial de patrimonio neto
   */
  getNetWorthHistory() {
    return StorageManager.load('netWorthHistory_v5', {});
  },

  /**
   * Genera insights automáticos
   */
  generateInsights(data, convertCurrency, displayCurrency) {
    const insights = []
    const { categories, totals, debts, savingsGoals, ynabConfig } = data

    (categories || []).forEach(cat => {
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

    const monthlyIncome = ynabConfig?.monthlyIncome
      ? convertCurrency(ynabConfig.monthlyIncome, ynabConfig.currency || 'EUR', displayCurrency)
      : totals?.budgeted || 0
    
    const savingsRate = monthlyIncome > 0 ? (totals?.available || 0) / monthlyIncome : 0
    
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

    const toxicDebts = (debts || []).filter(d => {
      if (d.isToxic !== undefined) return d.isToxic === true
      return ['Préstamo Automotriz', 'Préstamo de Consumo', 'Tarjeta de Crédito', 'Préstamo Personal'].includes(d.type)
    })
    
    if (toxicDebts.length > 0) {
      insights.push({
        type: 'danger',
        icon: 'fa-credit-card',
        title: `${toxicDebts.length} deuda(s) tóxica(s)`,
        message: 'Prioriza pagar estas deudas para mejorar tu salud financiera.',
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
   */
  compareWithPreviousMonth(currentTransactions, convertCurrency, displayCurrency) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthTransactions = (currentTransactions || []).filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const lastMonthTransactions = (currentTransactions || []).filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
    });

    const currentTotal = currentMonthTransactions.reduce((sum, t) => 
      sum + convertCurrency(t.amount || 0, t.currency || 'EUR', displayCurrency), 0
    );
    
    const lastTotal = lastMonthTransactions.reduce((sum, t) => 
      sum + convertCurrency(t.amount || 0, t.currency || 'EUR', displayCurrency), 0
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
   */
  projectCashflow(categories, debts, ynabConfig, convertCurrency, displayCurrency) {
    const projection = [];
    
    const monthlyExpenses = (categories || []).reduce((sum, cat) => 
      sum + convertCurrency(cat.budget || 0, cat.currency || 'EUR', displayCurrency), 0
    );
    
    const monthlyDebtPayment = (debts || []).reduce((sum, d) => 
      sum + convertCurrency(d.monthlyPayment || 0, d.currency || 'EUR', displayCurrency), 0
    );
    
    const monthlyIncome = ynabConfig?.monthlyIncome
      ? convertCurrency(ynabConfig.monthlyIncome, ynabConfig.currency || 'EUR', displayCurrency)
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

export default AnalysisEngine;